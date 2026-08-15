import { Module } from '@nestjs/common';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { MarketRepository } from './market.repository';
import { GdeltService } from './gdelt.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [MarketController],
  providers: [MarketService, MarketRepository, GdeltService, PrismaService],
  exports: [MarketService, GdeltService],
})
export class MarketModule {}
