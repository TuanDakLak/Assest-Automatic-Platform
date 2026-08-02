import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MarketRepository } from './market.repository';
import { CreateCategoryDto, CreateStyleDto, CreateMarketTopicDto } from './dto/create-market.dto';
import { UpdateCategoryDto, UpdateStyleDto, UpdateMarketTopicDto } from './dto/update-market.dto';

@Injectable()
export class MarketService {
  constructor(private readonly repository: MarketRepository) {}

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
  // Auto-Discovery Engine
  // ==========================================
  async discoverCommercialTopics() {
    const categories = await this.findAllCategories();
    const styles = await this.findAllStyles();

    if (categories.length === 0 || styles.length === 0) {
      throw new BadRequestException(
        'Cannot run commercial topic discovery. Please seed categories and styles first.'
      );
    }

    // A list of trending visual concepts
    const concepts = [
      'Minimalist E-Commerce Layouts',
      'Glassmorphic Fintech UI Components',
      '3D Isometric Space Travel Assets',
      'Claymorphic Medical Icons',
      'Retro Cyberpunk Marketing Banners',
      'Sustainable Living Vector Pack',
      'Neo-Brutalist SaaS Landing Templates',
      'Abstract Fluid Presentation Backgrounds',
      'Futuristic Electric Vehicles Graphics',
      'Cozy Cottagecore Branding Kits',
    ];

    const discovered = [];

    // Select 3 random concepts, randomize metrics, and create topics
    for (let i = 0; i < 3; i++) {
      const concept = concepts[Math.floor(Math.random() * concepts.length)];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const randomStyle = styles[Math.floor(Math.random() * styles.length)];

      const trendScore = Math.floor(Math.random() * 40) + 60; // 60-100
      const marketScore = Math.floor(Math.random() * 30) + 70; // 70-100
      const searchVolume = Math.floor(Math.random() * 15000) + 2000; // 2000-17000
      const competitionScore = Math.floor(Math.random() * 40) + 10; // 10-50 (lower is better)

      const topicDto: CreateMarketTopicDto = {
        title: `${concept} (${randomCategory.name} - ${randomStyle.name})`,
        categoryId: randomCategory.id,
        styleId: randomStyle.id,
        trendScore,
        marketScore,
        searchVolume,
        competitionScore,
        status: 'DISCOVERED',
      };

      const topic = await this.createTopic(topicDto);
      discovered.push(topic);
    }

    return {
      message: 'Commercial topic discovery complete.',
      count: discovered.length,
      topics: discovered,
    };
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
}
