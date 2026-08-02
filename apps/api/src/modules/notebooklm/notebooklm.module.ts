import { Module } from '@nestjs/common';
import { NotebooklmController } from './notebooklm.controller';
import { NotebooklmService } from './notebooklm.service';
import { NotebooklmRepository } from './notebooklm.repository';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [NotebooklmController],
  providers: [NotebooklmService, NotebooklmRepository, PrismaService],
  exports: [NotebooklmService],
})
export class NotebooklmModule {}
