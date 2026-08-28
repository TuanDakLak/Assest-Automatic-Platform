import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { MarketRepository } from './market.repository';
import { GdeltService } from './gdelt.service';
import { CreateCategoryDto, CreateStyleDto, CreateMarketTopicDto } from './dto/create-market.dto';
import { UpdateCategoryDto, UpdateStyleDto, UpdateMarketTopicDto } from './dto/update-market.dto';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  constructor(
    private readonly repository: MarketRepository,
    private readonly gdelt: GdeltService,
  ) {}

  // ==========================================
  // Category Service Operations
  // ==========================================
  async createCategory(dto: CreateCategoryDto) {
    try {
      return await this.repository.createCategory(dto);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Category name already exists.');
      }
      throw error;
    }
  }

  async findAllCategories() {
    return this.repository.findCategories();
  }

  async findCategory(id: string) {
    const category = await this.repository.findCategoryById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found.`);
    }
    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    await this.findCategory(id);
    return this.repository.updateCategory(id, dto);
  }

  async removeCategory(id: string) {
    await this.findCategory(id);
    try {
      return await this.repository.deleteCategory(id);
    } catch (error: any) {
      throw new BadRequestException('Cannot delete category as it is currently associated with active topics.');
    }
  }

  // ==========================================
  // Style Service Operations
  // ==========================================
  async createStyle(dto: CreateStyleDto) {
    try {
      return await this.repository.createStyle(dto);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Style name already exists.');
      }
      throw error;
    }
  }

  async findAllStyles() {
    return this.repository.findStyles();
  }

  async findStyle(id: string) {
    const style = await this.repository.findStyleById(id);
    if (!style) {
      throw new NotFoundException(`Style with ID "${id}" not found.`);
    }
    return style;
  }

  async updateStyle(id: string, dto: UpdateStyleDto) {
    await this.findStyle(id);
    return this.repository.updateStyle(id, dto);
  }

  async removeStyle(id: string) {
    await this.findStyle(id);
    try {
      return await this.repository.deleteStyle(id);
    } catch (error: any) {
      throw new BadRequestException('Cannot delete style as it is currently associated with active topics.');
    }
  }

  // ==========================================
  // MarketTopic Service Operations
  // ==========================================
  async createTopic(dto: CreateMarketTopicDto) {
    // Validate relations exist
    await this.findCategory(dto.categoryId);
    await this.findStyle(dto.styleId);

    // Calculate score
    const score = this.calculateTopicScore({
      trendScore: dto.trendScore || 0,
      marketScore: dto.marketScore || 0,
      searchVolume: dto.searchVolume || 0,
      competitionScore: dto.competitionScore || 0,
    });

    return this.repository.createMarketTopic({ ...dto, score });
  }

  async findAllTopics(filters?: { categoryId?: string; styleId?: string; status?: string }) {
    return this.repository.findMarketTopics(filters);
  }

  async findTopic(id: string) {
    const topic = await this.repository.findMarketTopicById(id);
    if (!topic) {
      throw new NotFoundException(`Market Topic with ID "${id}" not found.`);
    }
    return topic;
  }

  async updateTopic(id: string, dto: UpdateMarketTopicDto) {
    const existing = await this.findTopic(id);

    if (dto.categoryId) await this.findCategory(dto.categoryId);
    if (dto.styleId) await this.findStyle(dto.styleId);

    // If score-related metrics changed, recalculate
    const trendScore = dto.trendScore !== undefined ? dto.trendScore : existing.trendScore;
    const marketScore = dto.marketScore !== undefined ? dto.marketScore : existing.marketScore;
    const searchVolume = dto.searchVolume !== undefined ? dto.searchVolume : existing.searchVolume;
    const competitionScore = dto.competitionScore !== undefined ? dto.competitionScore : existing.competitionScore;

    const score = this.calculateTopicScore({
      trendScore,
      marketScore,
      searchVolume,
      competitionScore,
    });

    return this.repository.updateMarketTopic(id, { ...dto, score });
  }

  async removeTopic(id: string) {
    await this.findTopic(id);
    return this.repository.deleteMarketTopic(id);
  }

  async recalculateTopicScore(id: string) {
    const topic = await this.findTopic(id);
    const score = this.calculateTopicScore({
      trendScore: topic.trendScore,
      marketScore: topic.marketScore,
      searchVolume: topic.searchVolume,
      competitionScore: topic.competitionScore,
    });

    return this.repository.updateMarketTopic(id, { score });
  }

  // ==========================================
  // Auto-Discovery Engine (GDELT-backed)
  // ==========================================

  /**
   * Discovers commercial topics by scoring each category's seed keywords
   * against live world-news coverage from the GDELT DOC 2.0 API.
   *
   * Each (category keyword × style) pair becomes one candidate topic. The four
   * metrics are real signals rather than random numbers:
   *
   *   searchVolume     ← matching articles in the recent window
   *   trendScore       ← recent coverage rate vs the 3-month baseline
   *   marketScore      ← share of coverage in positive tone bins
   *   competitionScore ← distinct outlets already covering it
   *
   * Keywords GDELT has no coverage for are skipped rather than invented, so an
   * empty result is a legitimate outcome and is reported as such.
   */
  async discoverCommercialTopics(options?: { forceRefresh?: boolean }) {
    const categories = await this.findAllCategories();
    const styles = await this.findAllStyles();

    if (categories.length === 0 || styles.length === 0) {
      throw new BadRequestException(
        'Cannot run commercial topic discovery. Please seed categories and styles first.'
      );
    }

    // Build the candidate list from every category that carries seed keywords.
    const candidates: Array<{ keyword: string; category: (typeof categories)[number] }> = [];
    for (const category of categories) {
      const keywords: string[] = (category as any).keywords ?? [];
      for (const keyword of keywords) {
        const trimmed = keyword?.trim();
        if (trimmed) {
          candidates.push({ keyword: trimmed, category });
        }
      }
    }

    if (candidates.length === 0) {
      throw new BadRequestException(
        'No seed keywords configured. Add keywords to at least one category ' +
          '(PUT /market/categories/:id with { "keywords": ["sustainable packaging", ...] }) ' +
          'before running discovery.'
      );
    }

    this.logger.log(
      `[Discovery] Scoring ${candidates.length} seed keyword(s) against GDELT across ${categories.length} categor(ies).`
    );

    const discovered = [];
    const skipped: Array<{ keyword: string; reason: string }> = [];
    let abortedReason: string | null = null;

    // Start each run with a clean breaker so a previous rate-limit episode
    // does not permanently disable discovery.
    this.gdelt.resetCircuit();

    for (const { keyword, category } of candidates) {
      if (this.gdelt.circuitOpen) {
        const cooldown = this.gdelt.cooldownSecondsRemaining;
        abortedReason =
          'GDELT failed repeatedly, so the run stopped early to avoid deepening the rate limit. ' +
          (cooldown > 0
            ? `Wait ${cooldown}s and run discovery again — keywords already resolved are cached.`
            : 'Run discovery again in a minute — keywords already resolved are cached.');

        // Everything still unprocessed is reported rather than silently dropped.
        skipped.push({ keyword, reason: 'Not attempted — run aborted early.' });
        this.logger.warn(`[Discovery] Aborting run at "${keyword}". ${abortedReason}`);
        continue;
      }

      const metrics = await this.gdelt.getMetrics(keyword, {
        forceRefresh: options?.forceRefresh,
      });

      if (!metrics) {
        skipped.push({ keyword, reason: 'GDELT returned no usable response.' });
        this.logger.warn(`[Discovery] Skipping "${keyword}" — no GDELT response.`);
        continue;
      }

      if (metrics.searchVolume === 0) {
        skipped.push({ keyword, reason: 'No news coverage found in the recent window.' });
        this.logger.warn(
          `[Discovery] Skipping "${keyword}" — GDELT has zero coverage. ` +
            'GDELT indexes world news, so design-jargon keywords will not resolve.'
        );
        continue;
      }

      // Pair the subject with a design style. GDELT cannot rank styles, so the
      // style axis stays owned by the local Style table.
      const style = styles[Math.floor(Math.random() * styles.length)];
      const title = this.buildTopicTitle(keyword, category.name, style.name);

      const existing = await this.repository.findMarketTopicByTitle(title);
      if (existing) {
        skipped.push({ keyword, reason: `Topic "${title}" already exists.` });
        this.logger.log(`[Discovery] Skipping duplicate topic: "${title}"`);
        continue;
      }

      const topicDto: CreateMarketTopicDto = {
        title,
        categoryId: category.id,
        styleId: style.id,
        trendScore: metrics.trendScore,
        marketScore: metrics.marketScore,
        // MarketTopic.searchVolume is an Int column.
        searchVolume: Math.round(metrics.searchVolume),
        competitionScore: metrics.competitionScore,
        status: 'DISCOVERED',
      };

      const topic = await this.createTopic(topicDto);
      discovered.push({
        ...topic,
        gdelt: {
          keyword: metrics.keyword,
          articleCount: metrics.articleCount,
          distinctDomains: metrics.distinctDomains,
          fetchedAt: metrics.fetchedAt,
          fromCache: metrics.fromCache,
        },
      });

      this.logger.log(`[Discovery] Created topic "${title}" with score ${topic.score}.`);
    }

    let message: string;
    if (abortedReason) {
      message = `Discovery stopped early. ${abortedReason}`;
    } else if (discovered.length > 0) {
      message = 'Commercial topic discovery complete.';
    } else {
      message = 'Discovery ran but produced no new topics. See "skipped" for details.';
    }

    return {
      message,
      count: discovered.length,
      evaluated: candidates.length,
      aborted: Boolean(abortedReason),
      topics: discovered,
      skipped,
    };
  }

  /** Builds the topic title, keeping it inside the 100-character schema limit. */
  private buildTopicTitle(keyword: string, categoryName: string, styleName: string): string {
    const subject = keyword
      .split(' ')
      .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
      .join(' ');

    const title = `${subject} (${categoryName} - ${styleName})`;
    return title.length <= 100 ? title : `${title.slice(0, 97)}...`;
  }

  // ==========================================
  // Scoring Math helper
  // ==========================================
  private calculateTopicScore(metrics: {
    trendScore: number;
    marketScore: number;
    searchVolume: number;
    competitionScore: number;
  }): number {
    // Normalize Search Volume (scale of 0 to 100, clamped at 15000 volume)
    const normalizedVolume = Math.min((metrics.searchVolume / 15000) * 100, 100);

    // Inverse Competition (higher score is better, lower competition is better)
    const inverseCompetition = Math.max(100 - metrics.competitionScore, 0);

    // Weights:
    // Trend = 35%, Market = 35%, Volume = 15%, Competition = 15%
    const finalScore =
      metrics.trendScore * 0.35 +
      metrics.marketScore * 0.35 +
      normalizedVolume * 0.15 +
      inverseCompetition * 0.15;

    return Math.round(finalScore * 100) / 100;
  }

  async removeCategoriesBulk(ids: string[]) {
    return this.repository.deleteCategories(ids);
  }

  async removeStylesBulk(ids: string[]) {
    return this.repository.deleteStyles(ids);
  }

  async removeTopicsBulk(ids: string[]) {
    return this.repository.deleteMarketTopics(ids);
  }
}
