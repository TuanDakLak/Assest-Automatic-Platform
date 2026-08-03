import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { QualityRepository } from './quality.repository';
import { PrismaService } from 'src/database/prisma.service';
import { CreateQualityDto } from './dto/create-quality.dto';
import { UpdateQualityDto } from './dto/update-quality.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class QualityService {
  private readonly logger = new Logger(QualityService.name);

  constructor(
    private readonly repository: QualityRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Evaluates a generated design asset using the GPT Vision Quality Checker.
   * Performs 7 key visual tests: background removal, floating text, watermarks,
   * duplicates, cropping, blur, and distortion.
   *
   * Updates the asset's database status based on the pass mark of >= 90.
   *
   * @param assetId Database ID of the target Asset
   * @returns Detailed quality assessment and score
   */
  async checkQuality(assetId: string) {
    this.logger.log(`Initiating quality check for asset: ${assetId}`);

    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset not found with ID: ${assetId}`);
    }

    if (!asset.url) {
      throw new Error(`Asset with ID ${assetId} does not have a valid file URL path.`);
    }

    const absolutePath = path.isAbsolute(asset.url)
      ? asset.url
      : path.resolve(process.cwd(), asset.url);

    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException(`Asset file not found at: ${absolutePath}`);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    let evalResult: any;

    try {
      if (!apiKey || apiKey === 'mock-key' || process.env.NODE_ENV === 'test') {
        this.logger.warn('OpenAI API key missing or in test environment. Using mock quality evaluator.');
        evalResult = this.getMockQualityResponse();
      } else {
        evalResult = await this.callGptQualityApi(absolutePath, apiKey);
      }
    } catch (error) {
      this.logger.error(`Quality Checker API error for asset ${assetId}: ${error.message}`);
      throw new Error(`Quality check failed: ${error.message}`);
    }

    const finalScore = evalResult.finalScore ?? 0;
    const passed = finalScore >= 90;
    const finalStatus = passed ? 'COMPLETED' : 'FAILED_QC';

    // Merge new quality checks into asset metadata
    const currentMetadata = (asset.metadata as Record<string, any>) ?? {};
    const updatedMetadata = {
      ...currentMetadata,
      qualityAssessment: {
        criteria: evalResult.criteria,
        finalScore,
        passed,
        checkedAt: new Date().toISOString(),
      },
    };

    // Save final status and assessment to DB
    const updatedAsset = await this.prisma.asset.update({
      where: { id: assetId },
      data: {
        status: finalStatus,
        metadata: updatedMetadata,
        description: `${asset.description || ''} | QC Score: ${finalScore} (${passed ? 'PASSED' : 'FAILED'})`.trim(),
      },
    });

    this.logger.log(`Quality check completed for ${assetId}. Score: ${finalScore}. Status updated to: ${finalStatus}`);

    return {
      success: true,
      assetId,
      finalScore,
      passed,
      status: finalStatus,
      criteria: evalResult.criteria,
      asset: updatedAsset,
    };
  }

  /**
   * Queries OpenAI GPT Vision to rate the image across seven quality gates.
   */
  private async callGptQualityApi(imagePath: string, apiKey: string) {
    const fileBuffer = fs.readFileSync(imagePath);
    const base64Image = fileBuffer.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

    const prompt = `
You are a strict Quality Assurance engineer for commercial digital assets.
Analyze this image and rate its quality from 0 to 100 for each of the following 7 criteria:

1. backgroundRemoved: Is the background completely transparent or clean without remnants? (100 if transparent, 0 if background is fully present)
2. noFloatingText: Is there any stray, floating, or unnecessary text/letters left in the graphic? (100 if no text, 0 if full of text)
3. noWatermark: Are there any watermarks, stamps, or copyright signs? (100 if none, 0 if present)
4. noDuplicatedObjects: Are there any duplicate objects or weird overlapping copies? (100 if none, 0 if present)
5. noCroppedObjects: Are the main objects whole and not cut off/cropped at the edges? (100 if whole, 0 if cut off)
6. noBlur: Is the image sharp and clear? (100 if sharp, 0 if blurry)
7. noDistortion: Are there any AI generation distortions or deformed parts? (100 if perfect, 0 if distorted)

Return a JSON object containing:
{
  "criteria": {
    "backgroundRemoved": { "score": number, "reason": "string" },
    "noFloatingText": { "score": number, "reason": "string" },
    "noWatermark": { "score": number, "reason": "string" },
    "noDuplicatedObjects": { "score": number, "reason": "string" },
    "noCroppedObjects": { "score": number, "reason": "string" },
    "noBlur": { "score": number, "reason": "string" },
    "noDistortion": { "score": number, "reason": "string" }
  },
  "finalScore": number
}
Note: The finalScore must be the arithmetic average of the 7 scores.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`OpenAI Quality Vision API error: Status ${response.status} - ${errBody}`);
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content;
    return JSON.parse(resultText);
  }

  /**
   * Default mock evaluator returns high pass score for local dev/testing.
   */
  private getMockQualityResponse() {
    return {
      criteria: {
        backgroundRemoved: { score: 95, reason: 'Clean transparency mask applied.' },
        noFloatingText: { score: 100, reason: 'No typography present.' },
        noWatermark: { score: 100, reason: 'No watermarks detected.' },
        noDuplicatedObjects: { score: 90, reason: 'Single centered illustration.' },
        noCroppedObjects: { score: 95, reason: 'Illustration margins are kept.' },
        noBlur: { score: 95, reason: 'High resolution asset.' },
        noDistortion: { score: 90, reason: 'Proportions look natural.' },
      },
      finalScore: 95, // (95+100+100+90+95+95+90) / 7 = 95
    };
  }

  // =========================================================================
  // Boilerplate CRUD
  // =========================================================================
  async create(createDto: CreateQualityDto) {
    return this.repository.create(createDto);
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findOne(id);
  }

  async update(id: string, updateDto: UpdateQualityDto) {
    return this.repository.update(id, updateDto);
  }

  async remove(id: string) {
    return this.repository.remove(id);
  }
}
