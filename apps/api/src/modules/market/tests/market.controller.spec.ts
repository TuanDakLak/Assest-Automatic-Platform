import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MarketController } from '../market.controller';
import { MarketService } from '../market.service';
import { GdeltService } from '../gdelt.service';

describe('MarketController', () => {
  let controller: MarketController;
  let service: MarketService;
  let gdelt: { getMetrics: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketController],
      providers: [
        {
          provide: MarketService,
          useValue: {
            createCategory: jest.fn(),
            findAllCategories: jest.fn().mockResolvedValue([]),
            findCategory: jest.fn(),
            updateCategory: jest.fn(),
            removeCategory: jest.fn(),
            createStyle: jest.fn(),
            findAllStyles: jest.fn().mockResolvedValue([]),
            findStyle: jest.fn(),
            updateStyle: jest.fn(),
            removeStyle: jest.fn(),
            createTopic: jest.fn(),
            findAllTopics: jest.fn().mockResolvedValue([]),
            findTopic: jest.fn(),
            updateTopic: jest.fn(),
            removeTopic: jest.fn(),
            recalculateTopicScore: jest.fn(),
            discoverCommercialTopics: jest.fn().mockResolvedValue({ count: 0, topics: [] }),
          },
        },
        {
          provide: GdeltService,
          useValue: {
            getMetrics: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MarketController>(MarketController);
    service = module.get<MarketService>(MarketService);
    gdelt = module.get(GdeltService) as unknown as typeof gdelt;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /market/discover', () => {
    it('passes forceRefresh=true through to the service', async () => {
      await controller.discoverTopics('true');
      expect(service.discoverCommercialTopics).toHaveBeenCalledWith({ forceRefresh: true });
    });

    it('defaults forceRefresh to false so cached snapshots are reused', async () => {
      await controller.discoverTopics(undefined);
      expect(service.discoverCommercialTopics).toHaveBeenCalledWith({ forceRefresh: false });
    });
  });

  describe('GET /market/gdelt/probe', () => {
    it('rejects a missing keyword', async () => {
      await expect(controller.probeKeyword('')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('reports a keyword with coverage as usable', async () => {
      gdelt.getMetrics.mockResolvedValue({
        keyword: 'sustainable packaging',
        searchVolume: 161,
        trendScore: 66.67,
        marketScore: 78.88,
        competitionScore: 20,
        articleCount: 480,
        distinctDomains: 30,
        fetchedAt: new Date(),
        fromCache: false,
      });

      const result: any = await controller.probeKeyword('sustainable packaging');

      expect(result.usable).toBe(true);
      expect(result.marketScore).toBe(78.88);
    });

    it('reports a keyword with zero coverage as unusable', async () => {
      gdelt.getMetrics.mockResolvedValue({
        keyword: 'glassmorphism',
        searchVolume: 0,
        trendScore: 0,
        marketScore: 0,
        competitionScore: 0,
        articleCount: 0,
        distinctDomains: 0,
        fetchedAt: new Date(),
        fromCache: false,
      });

      const result: any = await controller.probeKeyword('glassmorphism');

      expect(result.usable).toBe(false);
    });

    it('explains the failure when GDELT returns nothing at all', async () => {
      gdelt.getMetrics.mockResolvedValue(null);

      const result: any = await controller.probeKeyword('anything');

      expect(result.usable).toBe(false);
      expect(result.message).toMatch(/rate limiting/i);
    });
  });
});
