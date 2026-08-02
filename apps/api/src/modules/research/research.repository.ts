import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateResearchDto } from './dto/create-research.dto';
import { UpdateResearchDto } from './dto/update-research.dto';

@Injectable()
export class ResearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateResearchDto) {
    // Boilerplate repository return - DB connection logic fits here
    return { id: 'mock-id', ...dto, createdAt: new Date() };
  }

  async findAll() {
    return [];
  }

  async findOne(id: string) {
    return { id, title: 'mock-title' };
  }

  async update(id: string, dto: UpdateResearchDto) {
    return { id, ...dto, updatedAt: new Date() };
  }

  async remove(id: string) {
    return { id, deleted: true };
  }
}
