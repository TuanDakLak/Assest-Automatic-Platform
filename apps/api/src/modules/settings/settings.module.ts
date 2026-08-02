import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { SettingsRepository } from './settings.repository';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, SettingsRepository, PrismaService],
  exports: [SettingsService],
})
export class SettingsModule {}
