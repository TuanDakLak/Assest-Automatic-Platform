import { Module } from '@nestjs/common';
import { PromptController } from './prompt.controller';
import { PromptService } from './prompt.service';
import { PromptRepository } from './prompt.repository';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [PromptController],
  providers: [PromptService, PromptRepository, PrismaService],
  exports: [PromptService],
})
export class PromptModule {}
