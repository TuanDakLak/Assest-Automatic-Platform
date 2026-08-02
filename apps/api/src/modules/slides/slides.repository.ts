import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateSlidesDto } from './dto/create-slides.dto';
import { UpdateSlidesDto } from './dto/update-slides.dto';

@Injectable()
export class SlidesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSlidesDto) {
    // Boilerplate repository return - DB connection logic fits here
    return { id: 'mock-id', ...dto, createdAt: new Date() };
  }

  async findAll() {
    return [];
  }

  async findOne(id: string) {
    return { id, title: 'mock-title' };
  }

  async update(id: string, dto: UpdateSlidesDto) {
    return { id, ...dto, updatedAt: new Date() };
  }

  async remove(id: string) {
    return { id, deleted: true };
  }
}
