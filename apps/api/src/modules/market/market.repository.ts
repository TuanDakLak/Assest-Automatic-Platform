import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateMarketDto } from './dto/create-market.dto';
import { UpdateMarketDto } from './dto/update-market.dto';

@Injectable()
export class MarketRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMarketDto) {
    // Boilerplate repository return - DB connection logic fits here
    return { id: 'mock-id', ...dto, createdAt: new Date() };
  }

  async findAll() {
    return [];
  }

  async findOne(id: string) {
    return { id, title: 'mock-title' };
  }

  async update(id: string, dto: UpdateMarketDto) {
    return { id, ...dto, updatedAt: new Date() };
  }

  async remove(id: string) {
    return { id, deleted: true };
  }
}
