import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto, CreateStyleDto, CreateMarketTopicDto } from './dto/create-market.dto';
import { UpdateCategoryDto, UpdateStyleDto, UpdateMarketTopicDto } from './dto/update-market.dto';

@Injectable()
export class MarketRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // Category DB Operations
  // ==========================================
  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async findCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findCategoryById(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCategory(id: string) {
    return this.prisma.category.delete({
      where: { id },
    });
  }

  // ==========================================
  // Style DB Operations
  // ==========================================
  async createStyle(dto: CreateStyleDto) {
    return this.prisma.style.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async findStyles() {
    return this.prisma.style.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findStyleById(id: string) {
    return this.prisma.style.findUnique({
      where: { id },
    });
  }

  async updateStyle(id: string, dto: UpdateStyleDto) {
    return this.prisma.style.update({
      where: { id },
      data: dto,
    });
  }

  async deleteStyle(id: string) {
    return this.prisma.style.delete({
      where: { id },
    });
  }

  // ==========================================
  // MarketTopic DB Operations
  // ==========================================
  async createMarketTopic(dto: CreateMarketTopicDto & { score: number }) {
    return this.prisma.marketTopic.create({
      data: {
        title: dto.title,
        categoryId: dto.categoryId,
        styleId: dto.styleId,
        trendScore: dto.trendScore || 0,
        marketScore: dto.marketScore || 0,
        searchVolume: dto.searchVolume || 0,
        competitionScore: dto.competitionScore || 0,
        score: dto.score,
        status: dto.status || 'DISCOVERED',
      },
      include: {
        category: true,
        style: true,
      },
    });
  }

  async findMarketTopics(filters?: { categoryId?: string; styleId?: string; status?: string }) {
    return this.prisma.marketTopic.findMany({
      where: {
        ...(filters?.categoryId && { categoryId: filters.categoryId }),
        ...(filters?.styleId && { styleId: filters.styleId }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        category: true,
        style: true,
      },
      orderBy: {
        score: 'desc',
      },
    });
  }

  async findMarketTopicById(id: string) {
    return this.prisma.marketTopic.findUnique({
      where: { id },
      include: {
        category: true,
        style: true,
      },
    });
  }

  async updateMarketTopic(id: string, data: Partial<CreateMarketTopicDto> & { score?: number }) {
    return this.prisma.marketTopic.update({
      where: { id },
      data,
      include: {
        category: true,
        style: true,
      },
    });
  }

  async deleteMarketTopic(id: string) {
    return this.prisma.marketTopic.delete({
      where: { id },
    });
  }
}
