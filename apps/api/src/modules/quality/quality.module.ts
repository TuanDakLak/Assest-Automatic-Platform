import { Module } from '@nestjs/common';
import { QualityController } from './quality.controller';
import { QualityService } from './quality.service';
import { QualityRepository } from './quality.repository';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [QualityController],
  providers: [QualityService, QualityRepository, PrismaService],
  exports: [QualityService],
})
export class QualityModule {}
