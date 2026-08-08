import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MarketService } from '../market/market.service';
import { ResearchService } from '../research/research.service';
import { NotebooklmService } from '../notebooklm/notebooklm.service';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly marketService: MarketService,
    private readonly researchService: ResearchService,
    private readonly notebooklmService: NotebooklmService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Automatic execution schedule running daily at midnight.
   * 
   * Triggers the full asset generation cycle:
   * 1. Runs discovery algorithms to find hot category-style combinations.
   * 2. Evaluates candidates and isolates top potentials (score >= 75).
   * 3. Generates rich source research documents.
   * 4. Queues headless browser automation tasks.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyAssetFactoryPipeline(topicId?: string) {
    this.logger.log('--- Initiating Scheduled End-To-End Automation Pipeline ---');
    try {
      let candidates = [];

      if (topicId) {
        this.logger.log(`[Pipeline] Manual override trigger for specific Topic ID: "${topicId}"`);
        const topic = await this.prisma.marketTopic.findUnique({
          where: { id: topicId },
        });
        if (topic) {
          candidates = [topic];
        }
      } else {
        // Step 1: Discover topics
        this.logger.log('[Pipeline] Step 1: Scanning categories and styles for commercial concepts...');
        const discovered = await this.marketService.discoverCommercialTopics();
        const count = discovered?.topics?.length || discovered?.count || 0;
        this.logger.log(`[Pipeline] Discovered ${count} total potential combinations.`);

        // Step 2: Fetch unanalyzed high-score candidates
        candidates = await this.prisma.marketTopic.findMany({
          where: {
            score: { gte: 75 },
            status: 'DISCOVERED',
          },
          take: 5, // Process in small chunks to protect resource bounds
        });
      }

      this.logger.log(`[Pipeline] Step 2: Isolated ${candidates.length} high-potential topics needing process.`);

      for (const topic of candidates) {
        this.logger.log(`[Pipeline] Processing: "${topic.title}" (Score: ${topic.score.toFixed(1)}%)`);

        // Lock topic state immediately
        await this.prisma.marketTopic.update({
          where: { id: topic.id },
          data: { status: 'ANALYZING' },
        });

        // Step 3: Call Research module to generate markdown
        this.logger.log(`[Pipeline] Step 3: Triggering AI report generation for "${topic.title}"`);
        const markdown = await this.researchService.generateResearch(topic.title);

        // Step 4: Queue Playwright slideshow job in BullMQ
        this.logger.log(`[Pipeline] Step 4: Enqueuing Playwright Google NotebookLM slide worker for "${topic.title}"`);
        const jobResult = await this.notebooklmService.triggerNotebookLMAutomation(topic.title, markdown);
        this.logger.log(`[Pipeline] Enqueued job: ${jobResult.jobId} for "${topic.title}".`);
      }

      this.logger.log('--- Automated AI Asset Factory Pipeline Complete ---');
    } catch (err: any) {
      this.logger.error(`[Pipeline] Automation cycle failed: ${err.message}`, err.stack);
    }
  }

  /**
   * Manual force-override.
   */
  async forceTriggerPipeline(topicId?: string) {
    // Run asynchronously to allow endpoint response
    this.handleDailyAssetFactoryPipeline(topicId);
    return {
      success: true,
      message: 'End-to-end asset factory pipeline triggered in background.',
    };
  }

  // =========================================================================
  // CRUD alignments
  // =========================================================================
  async create(createDto: any) {
    return { id: 'mock-id', ...createDto, createdAt: new Date() };
  }

  async findAll() {
    return [];
  }

  async findOne(id: string) {
    return { id };
  }

  async update(id: string, updateDto: any) {
    return { id, ...updateDto };
  }

  async remove(id: string) {
    return { id, deleted: true };
  }
}
