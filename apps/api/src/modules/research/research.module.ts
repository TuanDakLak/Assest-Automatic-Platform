import { Module } from '@nestjs/common';
import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';
import { ResearchRepository } from './research.repository';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [ResearchController],
  providers: [ResearchService, ResearchRepository, PrismaService],
  exports: [ResearchService],
})
export class ResearchModule {}
