import { Module } from '@nestjs/common';
import { SlidesController } from './slides.controller';
import { SlidesService } from './slides.service';
import { SlidesRepository } from './slides.repository';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [SlidesController],
  providers: [SlidesService, SlidesRepository, PrismaService],
  exports: [SlidesService],
})
export class SlidesModule {}
