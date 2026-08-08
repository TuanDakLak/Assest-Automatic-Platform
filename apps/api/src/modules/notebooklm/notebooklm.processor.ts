import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaService } from 'src/database/prisma.service';
import { SlidesService } from '../slides/slides.service';
import { AssetService } from '../asset/asset.service';
import { QualityService } from '../quality/quality.service';

@Injectable()
export class NotebooklmProcessor implements OnModuleInit, OnModuleDestroy {
  private worker: Worker;
  private readonly logger = new Logger(NotebooklmProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly slidesService: SlidesService,
    private readonly assetService: AssetService,
    private readonly qualityService: QualityService,
  ) {}

  onModuleInit() {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

    // Initialize BullMQ Worker
    this.worker = new Worker(
      'notebooklm-automation',
      async (job: Job) => {
        return this.processJob(job);
      },
      {
        connection: { host: redisHost, port: redisPort },
        concurrency: 2, // Support parallel worker execution
      }
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`[Worker] Job ${job.id} completed successfully.`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`[Worker] Job ${job?.id} failed with error: ${err.message}`, err.stack);
    });

    this.logger.log(`NotebookLM Automation Worker initialized with Redis connection: ${redisHost}:${redisPort}`);
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
  }

  private async processJob(job: Job) {
    const { topic, markdownContent } = job.data;
    this.logger.log(`[Job ${job.id}] Starting NotebookLM automation process for: "${topic}"`);

    const headless = process.env.PLAYWRIGHT_HEADLESS !== 'false';
    const sessionPath = process.env.NOTEBOOKLM_SESSION_STATE_PATH || 'session.json';
    const downloadDir = path.join(process.cwd(), 'downloads');

    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    const tempFilePath = path.join(downloadDir, `temp_research_${job.id}.md`);
    fs.writeFileSync(tempFilePath, markdownContent);
    this.logger.log(`[Job ${job.id}] Saved temporary source file to: ${tempFilePath}`);

    const maxRetries = 3;
    let attempt = 0;
    let success = false;
    let downloadedFilePath = '';

    while (attempt < maxRetries && !success) {
      attempt++;
      this.logger.log(`[Job ${job.id}] Starting browser automation attempt ${attempt}/${maxRetries}`);

      const browser = await chromium.launch({
        headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      try {
        let contextOptions = {};
        if (fs.existsSync(sessionPath)) {
          this.logger.log(`[Job ${job.id}] StorageState session file found. Loading cookies and storage...`);
          contextOptions = { storageState: sessionPath };
        } else {
          this.logger.warn(`[Job ${job.id}] Warning: No session storageState state file found at: ${sessionPath}. Google account may block this request.`);
        }

        const context = await browser.newContext({
          ...contextOptions,
          acceptDownloads: true,
          viewport: { width: 1280, height: 800 }
        });

        const page = await context.newPage();
        page.setDefaultTimeout(35000); // 35 seconds timeout limit

        // Step 1: Open NotebookLM
        this.logger.log(`[Job ${job.id}] Step 1: Navigating to https://notebooklm.google/`);
        await page.goto('https://notebooklm.google/', { waitUntil: 'domcontentloaded' });

        // Step 2: Create Notebook
        this.logger.log(`[Job ${job.id}] Step 2: Creating a new notebook`);
        const newNotebookBtn = page.locator('button:has-text("New notebook"), [aria-label="New notebook"], button:has-text("Create new")');
        await newNotebookBtn.waitFor({ state: 'visible', timeout: 15000 });
        await newNotebookBtn.click();

        // Step 3: Upload source file
        this.logger.log(`[Job ${job.id}] Step 3: Triggering markdown upload input`);
        const fileInput = page.locator('input[type="file"]');
        await fileInput.waitFor({ state: 'attached', timeout: 10000 });
        await fileInput.setInputFiles(tempFilePath);
        this.logger.log(`[Job ${job.id}] Source file uploaded to NotebookLM.`);

        // Step 4: Wait for indexing
        this.logger.log(`[Job ${job.id}] Step 4: Waiting for document indexing...`);
        const indexingIndicator = page.locator(':has-text("Indexing"), .indexing-spinner, [aria-label*="indexing"]');
        
        // Wait for indexing to start (if immediate) and disappear
        await page.waitForTimeout(3000);
        if (await indexingIndicator.count() > 0) {
          await indexingIndicator.waitFor({ state: 'hidden', timeout: 70000 });
        }
        this.logger.log(`[Job ${job.id}] Document indexing complete.`);

        // Step 5: Generate Slide Deck content
        this.logger.log(`[Job ${job.id}] Step 5: Requesting slide deck generation`);
        const generateBtn = page.locator('button:has-text("Generate slide deck"), button:has-text("Create slides"), button:has-text("Study Guide")');
        await generateBtn.waitFor({ state: 'visible', timeout: 15000 });
        await generateBtn.click();

        // Wait for generation process
        this.logger.log(`[Job ${job.id}] Waiting for slide generation...`);
        await page.waitForTimeout(5000);
        const generatingIndicator = page.locator(':has-text("Generating"), .generating-spinner');
        if (await generatingIndicator.count() > 0) {
          await generatingIndicator.waitFor({ state: 'hidden', timeout: 90000 });
        }
        this.logger.log(`[Job ${job.id}] Slide generation successful.`);

        // Step 6: Download slide deck presentation
        this.logger.log(`[Job ${job.id}] Step 6: Initiating file download`);
        const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
        
        const downloadBtn = page.locator('button[title*="Download"], button:has-text("Download"), button[aria-label*="Download"]');
        await downloadBtn.first().click();

        const download = await downloadPromise;
        const filename = `${topic.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_presentation_${job.id}.pptx`;
        downloadedFilePath = path.join(downloadDir, filename);
        await download.saveAs(downloadedFilePath);

        this.logger.log(`[Job ${job.id}] File downloaded and saved to: ${downloadedFilePath}`);
        success = true;

        // --- CONNECT DOWNSTREAM PIPELINE ---
        this.logger.log(`[Job ${job.id}] Triggering downstream E2E processing: Parse -> Category Copy -> Extract -> Remove Background -> Quality Check`);
        
        // 1. Resolve category folder name to copy slides into appropriate section
        let categoryName = 'general';
        const dbTopic = await this.prisma.marketTopic.findFirst({
          where: { title: topic },
          include: { category: true }
        });
        if (dbTopic?.category) {
          categoryName = dbTopic.category.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        }

        const categoryDir = path.join(process.cwd(), 'downloads', 'categories', categoryName, topic.toLowerCase().replace(/[^a-z0-9]+/g, '_'));
        if (!fs.existsSync(categoryDir)) {
          fs.mkdirSync(categoryDir, { recursive: true });
        }

        // Save a permanent copy of the research report in the category directory
        const permanentReportPath = path.join(categoryDir, 'research_report.md');
        try {
          fs.copyFileSync(tempFilePath, permanentReportPath);
          this.logger.log(`[Job ${job.id}] Saved permanent copy of research report to: ${permanentReportPath}`);
        } catch (copyErr: any) {
          this.logger.warn(`[Job ${job.id}] Failed to save permanent copy of research report: ${copyErr.message}`);
        }

        // 2. Parse slide PPTX to PNG images inside the category-specific directory
        const parseResult = await this.slidesService.parseSlides({
          filePath: downloadedFilePath,
          outputDir: categoryDir,
          scale: 2.0,
          transparent: false
        });

        if (parseResult.success && parseResult.savedPaths) {
          this.logger.log(`[Job ${job.id}] Successfully parsed ${parseResult.slideCount} slides into category folder: ${categoryDir}`);
          
          for (const slidePath of parseResult.savedPaths) {
            this.logger.log(`[Job ${job.id}] Extracting assets from slide: ${slidePath}`);
            
            // 3. Extract asset from slide PNG with user prompt template
            const extractResult = await this.assetService.extractAsset(slidePath, {
              promptTemplate: `Isolate the design assets from this slide. The design style is 3D graphic design style with a clean, light background. Keep only the central asset graphic.`,
            });

            if (extractResult.success && extractResult.assetId) {
              const assetId = extractResult.assetId;
              const assetRecord = extractResult.asset;
              
              if (assetRecord.url) {
                // 4. Remove light background (transparent overlay)
                const transparentPath = await this.assetService.removeBackground(assetRecord.url);
                
                // Update Asset URL to the new background-removed file
                await this.prisma.asset.update({
                  where: { id: assetId },
                  data: { url: transparentPath }
                });

                // 5. Execute Quality Checker on the final background-removed asset
                this.logger.log(`[Job ${job.id}] Executing Quality check on asset: ${assetId}`);
                await this.qualityService.checkQuality(assetId);
              }
            }
          }
        }
      } catch (err: any) {
        this.logger.warn(`[Job ${job.id}] Attempt ${attempt} failed with: ${err.message}`);
        if (attempt >= maxRetries) {
          throw err;
        }
        // Backoff delay
        await new Promise((resolve) => setTimeout(resolve, attempt * 3000));
      } finally {
        await browser.close();
      }
    }

    // Cleanup temp markdown file
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (cleanupErr) {
      this.logger.warn(`[Job ${job.id}] Failed to delete temp file: ${tempFilePath}`);
    }

    return {
      success: true,
      downloadedFilePath,
      topic,
    };
  }
}
