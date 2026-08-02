import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobsRepository } from './jobs.repository';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService, JobsRepository, PrismaService],
  exports: [JobsService],
})
export class JobsModule {}
