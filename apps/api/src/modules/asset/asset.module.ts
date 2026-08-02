import { Module } from '@nestjs/common';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';
import { AssetRepository } from './asset.repository';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [AssetController],
  providers: [AssetService, AssetRepository, PrismaService],
  exports: [AssetService],
})
export class AssetModule {}
