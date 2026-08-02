import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SlidesRepository } from './slides.repository';
import { CreateSlidesDto, ParseSlidesDto } from './dto/create-slides.dto';
import { UpdateSlidesDto } from './dto/update-slides.dto';
import { renderPresentation } from 'node-pptx-png';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class SlidesService {
  private readonly logger = new Logger(SlidesService.name);

  constructor(private readonly repository: SlidesRepository) {}

  /**
   * Parses a PPTX presentation and exports each slide as a high-resolution PNG image.
   * 
   * @param dto Input file and rendering options
   * @returns List of parsed slide details and output file paths
   */
  async parseSlides(dto: ParseSlidesDto) {
    this.logger.log(`Initiating slide parsing for: ${dto.filePath}`);

    const absolutePath = path.isAbsolute(dto.filePath)
      ? dto.filePath
      : path.resolve(process.cwd(), dto.filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException(`PowerPoint presentation not found at: ${absolutePath}`);
    }

    const scale = dto.scale ?? 2.0; // 2x default for high resolution
    const width = dto.width;
    const transparent = dto.transparent ?? false;

    // Resolve output directory
    const outputDir = dto.outputDir
      ? (path.isAbsolute(dto.outputDir) ? dto.outputDir : path.resolve(process.cwd(), dto.outputDir))
      : path.join(path.dirname(absolutePath), `${path.basename(absolutePath, path.extname(absolutePath))}_slides`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    this.logger.log(`Rendered PNGs will be saved to: ${outputDir}`);

    // Set options for the pure JS/Skia parser
    const renderOpts: any = {
      format: 'png',
      logLevel: 'silent',
    };

    if (width) {
      renderOpts.width = width;
    } else {
      renderOpts.scale = scale;
    }

    if (transparent) {
      renderOpts.backgroundColor = 'transparent';
    }

    // Perform high-fidelity conversion
    const result = await renderPresentation(absolutePath, renderOpts);

    if (!result.allSuccessful) {
      this.logger.warn(`Slide render completed with partial success: ${result.successfulSlides}/${result.totalSlides}`);
    }

    const slides = [];
    const savedPaths = [];
    const baseName = path.basename(absolutePath, path.extname(absolutePath));

    for (const slide of result.slides) {
      if (!slide.success) {
        this.logger.error(`Slide #${slide.slideNumber} failed to render: ${slide.errorMessage}`);
        continue;
      }

      const slideFilename = `${baseName}_slide_${slide.slideNumber}.png`;
      const slidePath = path.join(outputDir, slideFilename);

      // Write binary buffer to disk
      fs.writeFileSync(slidePath, slide.imageData);
      savedPaths.push(slidePath);

      slides.push({
        slideNumber: slide.slideNumber,
        width: slide.width,
        height: slide.height,
        path: slidePath,
      });
    }

    this.logger.log(`Slide parsing completed. Exchanged ${slides.length}/${result.totalSlides} slides.`);

    return {
      success: slides.length > 0,
      slideCount: slides.length,
      savedPaths,
      slides,
    };
  }

  // =========================================================================
  // Boilerplate CRUD
  // =========================================================================
  async create(createDto: CreateSlidesDto) {
    return this.repository.create(createDto);
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findOne(id);
  }

  async update(id: string, updateDto: UpdateSlidesDto) {
    return this.repository.update(id, updateDto);
  }

  async remove(id: string) {
    return this.repository.remove(id);
  }
}
