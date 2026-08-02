import { Module } from '@nestjs/common';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { MarketRepository } from './market.repository';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [MarketController],
  providers: [MarketService, MarketRepository, PrismaService],
  exports: [MarketService],
})
export class MarketModule {}
