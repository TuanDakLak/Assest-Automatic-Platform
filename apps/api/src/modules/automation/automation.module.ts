import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { AutomationRepository } from './automation.repository';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [AutomationController],
  providers: [AutomationService, AutomationRepository, PrismaService],
  exports: [AutomationService],
})
export class AutomationModule {}
