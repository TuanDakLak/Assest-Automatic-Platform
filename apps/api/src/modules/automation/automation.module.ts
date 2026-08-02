import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { AutomationRepository } from './automation.repository';
import { PrismaService } from 'src/database/prisma.service';
import { MarketModule } from '../market/market.module';
import { ResearchModule } from '../research/research.module';
import { NotebooklmModule } from '../notebooklm/notebooklm.module';

@Module({
  imports: [
    MarketModule,
    ResearchModule,
    NotebooklmModule,
  ],
  controllers: [AutomationController],
  providers: [
    AutomationService,
    AutomationRepository,
    PrismaService,
  ],
  exports: [AutomationService],
})
export class AutomationModule {}
