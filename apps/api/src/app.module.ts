import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MarketModule } from './modules/market/market.module';
import { ResearchModule } from './modules/research/research.module';
import { NotebooklmModule } from './modules/notebooklm/notebooklm.module';
import { SlidesModule } from './modules/slides/slides.module';
import { AssetModule } from './modules/asset/asset.module';
import { PromptModule } from './modules/prompt/prompt.module';
import { AutomationModule } from './modules/automation/automation.module';
import { QualityModule } from './modules/quality/quality.module';
import { StorageModule } from './modules/storage/storage.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PrismaService } from './database/prisma.service';

@Module({
  imports: [
    AuthModule,
    DashboardModule,
    MarketModule,
    ResearchModule,
    NotebooklmModule,
    SlidesModule,
    AssetModule,
    PromptModule,
    AutomationModule,
    QualityModule,
    StorageModule,
    JobsModule,
    SettingsModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
