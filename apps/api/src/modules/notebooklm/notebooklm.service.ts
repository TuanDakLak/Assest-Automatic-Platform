import { Injectable, OnModuleInit, Logger, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { NotebooklmRepository } from './notebooklm.repository';
import { CreateNotebooklmDto } from './dto/create-notebooklm.dto';
import { UpdateNotebooklmDto } from './dto/update-notebooklm.dto';

@Injectable()
export class NotebooklmService implements OnModuleInit {
  private queue: Queue;
  private readonly logger = new Logger(NotebooklmService.name);

  constructor(private readonly repository: NotebooklmRepository) {}

  onModuleInit() {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

    // Initialize BullMQ Queue
    this.queue = new Queue('notebooklm-automation', {
      connection: { host: redisHost, port: redisPort },
    });

    this.logger.log(`NotebookLM Queue Publisher initialized.`);
  }

  /**
   * Triggers a new Playwright automation job inside the BullMQ Queue.
   * 
   * @param topic Title of the research topic
   * @param markdownContent Markdown text input for NotebookLM source
   * @returns Added job information
   */
  async triggerNotebookLMAutomation(topic: string, markdownContent: string) {
    const job = await this.queue.add('generate-slides', {
      topic,
      markdownContent,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    this.logger.log(`Queued automation job ${job.id} for topic: "${topic}"`);
    return {
      jobId: job.id,
      name: job.name,
      status: 'QUEUED',
      timestamp: job.timestamp,
    };
  }

  /**
   * Retrieves status and results of a queued BullMQ job.
   */
  async getJobStatus(jobId: string) {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`Automation job with ID ${jobId} not found.`);
    }

    const state = await job.getState();
    return {
      jobId: job.id,
      state,
      progress: job.progress,
      result: job.returnvalue,
      failedReason: job.failedReason,
      timestamp: job.timestamp,
    };
  }

  // =========================================================================
  // Standard CRUD boilerplate to maintain controller alignment
  // =========================================================================
  async create(createDto: CreateNotebooklmDto) {
    return this.repository.create(createDto);
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findOne(id);
  }

  async update(id: string, updateDto: UpdateNotebooklmDto) {
    return this.repository.update(id, updateDto);
  }

  async remove(id: string) {
    return this.repository.remove(id);
  }
}
