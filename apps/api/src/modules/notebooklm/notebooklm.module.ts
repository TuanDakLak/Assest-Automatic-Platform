import { Module } from '@nestjs/common';
import { NotebooklmController } from './notebooklm.controller';
import { NotebooklmService } from './notebooklm.service';
import { NotebooklmRepository } from './notebooklm.repository';
import { NotebooklmProcessor } from './notebooklm.processor';
import { PrismaService } from 'src/database/prisma.service';
import { SlidesModule } from '../slides/slides.module';
import { AssetModule } from '../asset/asset.module';
import { QualityModule } from '../quality/quality.module';

@Module({
  imports: [
    SlidesModule,
    AssetModule,
    QualityModule,
  ],
  controllers: [NotebooklmController],
  providers: [
    NotebooklmService,
    NotebooklmRepository,
    NotebooklmProcessor,
    PrismaService,
  ],
  exports: [NotebooklmService],
})
export class NotebooklmModule {}

