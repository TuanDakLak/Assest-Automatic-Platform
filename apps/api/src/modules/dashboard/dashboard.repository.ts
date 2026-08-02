import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDashboardDto) {
    // Boilerplate repository return - DB connection logic fits here
    return { id: 'mock-id', ...dto, createdAt: new Date() };
  }

  async findAll() {
    return [];
  }

  async findOne(id: string) {
    return { id, title: 'mock-title' };
  }

  async update(id: string, dto: UpdateDashboardDto) {
    return { id, ...dto, updatedAt: new Date() };
  }

  async remove(id: string) {
    return { id, deleted: true };
  }
}
