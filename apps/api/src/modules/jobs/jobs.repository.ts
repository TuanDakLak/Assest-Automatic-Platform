import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateJobsDto } from './dto/create-jobs.dto';
import { UpdateJobsDto } from './dto/update-jobs.dto';
import { Queue } from 'bullmq';

@Injectable()
export class JobsRepository implements OnModuleInit {
  private queue: Queue;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    this.queue = new Queue('notebooklm-automation', {
      connection: { host: redisHost, port: redisPort },
    });
  }

  async create(dto: CreateJobsDto) {
    // Boilerplate repository return - DB connection logic fits here
    return { id: 'mock-id', ...dto, createdAt: new Date() };
  }

  async findAll() {
    try {
      if (!this.queue) return [];
      
      const active = await this.queue.getActive();
      const waiting = await this.queue.getWaiting();
      const completed = await this.queue.getCompleted();
      const failed = await this.queue.getFailed();

      const allJobs = [
        ...active.map(j => ({ id: j.id, type: 'NOTEBOOKLM_SLIDES', status: 'RUNNING', createdAt: new Date(j.timestamp).toISOString() })),
        ...waiting.map(j => ({ id: j.id, type: 'NOTEBOOKLM_SLIDES', status: 'QUEUED', createdAt: new Date(j.timestamp).toISOString() })),
        ...completed.map(j => ({ id: j.id, type: 'NOTEBOOKLM_SLIDES', status: 'COMPLETED', createdAt: new Date(j.timestamp).toISOString() })),
        ...failed.map(j => ({ id: j.id, type: 'NOTEBOOKLM_SLIDES', status: 'FAILED', createdAt: new Date(j.timestamp).toISOString() }))
      ];

      return allJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      return [];
    }
  }

  async findOne(id: string) {
    return { id, title: 'mock-title' };
  }

  async update(id: string, dto: UpdateJobsDto) {
    return { id, ...dto, updatedAt: new Date() };
  }

  async remove(id: string) {
    return { id, deleted: true };
  }
}
