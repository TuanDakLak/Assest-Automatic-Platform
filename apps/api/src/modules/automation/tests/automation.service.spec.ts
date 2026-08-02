import { Test, TestingModule } from '@nestjs/testing';
import { AutomationService } from '../automation.service';
import { AutomationRepository } from '../automation.repository';
import { MarketService } from '../../market/market.service';
import { ResearchService } from '../../research/research.service';
import { NotebooklmService } from '../../notebooklm/notebooklm.service';
import { PrismaService } from 'src/database/prisma.service';

describe('AutomationService', () => {
  let service: AutomationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationService,
        {
          provide: AutomationRepository,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
            create: jest.fn().mockResolvedValue({ id: '1' }),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            remove: jest.fn().mockResolvedValue({ id: '1' }),
          },
        },
        {
          provide: MarketService,
          useValue: {
            discoverCommercialTopics: jest.fn().mockResolvedValue([
              { id: 'topic-1', title: 'Concept 1', score: 80, status: 'DISCOVERED' },
            ]),
          },
        },
        {
          provide: ResearchService,
          useValue: {
            generateResearch: jest.fn().mockResolvedValue('# Markdown Content'),
          },
        },
        {
          provide: NotebooklmService,
          useValue: {
            triggerNotebookLMAutomation: jest.fn().mockResolvedValue({ jobId: 'job_abc', status: 'QUEUED' }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            marketTopic: {
              findMany: jest.fn().mockResolvedValue([
                { id: 'topic-1', title: 'Concept 1', score: 80, status: 'DISCOVERED' },
              ]),
              update: jest.fn().mockResolvedValue({ id: 'topic-1', status: 'ANALYZING' }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AutomationService>(AutomationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleDailyAssetFactoryPipeline', () => {
    it('should run the discovery, research generation, and queue automation jobs', async () => {
      await expect(service.handleDailyAssetFactoryPipeline()).resolves.not.toThrow();
    });
  });

  describe('forceTriggerPipeline', () => {
    it('should trigger the background run and return immediately', async () => {
      const result = await service.forceTriggerPipeline();
      expect(result).toEqual({
        success: true,
        message: 'End-to-end asset factory pipeline triggered in background.',
      });
    });
  });
});
