import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MarketService } from '../market.service';
import { MarketRepository } from '../market.repository';
import { GdeltService } from '../gdelt.service';

describe('MarketService', () => {
  let service: MarketService;
  let repository: jest.Mocked<MarketRepository>;
  let gdelt: {
    getMetrics: jest.Mock;
    getMetricsForKeywords: jest.Mock;
    resetCircuit: jest.Mock;
    cooldownSecondsRemaining: number;
    circuitOpen: boolean;
  };

  const category = (overrides: Partial<any> = {}) => ({
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Packaging',
    description: null,
    keywords: ['sustainable packaging'],
    ...overrides,
  });

  const style = (overrides: Partial<any> = {}) => ({
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Minimalist',
    description: null,
    ...overrides,
  });

  const metrics = (overrides: Partial<any> = {}) => ({
    keyword: 'sustainable packaging',
    searchVolume: 161,
    trendScore: 66.67,
    marketScore: 78.88,
    competitionScore: 20,
    articleCount: 480,
    distinctDomains: 30,
    fetchedAt: new Date('2026-08-12T00:00:00Z'),
    fromCache: false,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketService,
        {
          provide: MarketRepository,
          useValue: {
            createCategory: jest.fn(),
            findCategories: jest.fn().mockResolvedValue([]),
            findCategoryById: jest.fn(),
            updateCategory: jest.fn(),
            deleteCategory: jest.fn(),
            createStyle: jest.fn(),
            findStyles: jest.fn().mockResolvedValue([]),
            findStyleById: jest.fn(),
            updateStyle: jest.fn(),
            deleteStyle: jest.fn(),
            createMarketTopic: jest.fn(),
            findMarketTopics: jest.fn().mockResolvedValue([]),
            findMarketTopicById: jest.fn(),
            findMarketTopicByTitle: jest.fn().mockResolvedValue(null),
            updateMarketTopic: jest.fn(),
            deleteMarketTopic: jest.fn(),
          },
        },
        {
          provide: GdeltService,
          useValue: {
            getMetrics: jest.fn(),
            getMetricsForKeywords: jest.fn(),
            resetCircuit: jest.fn(),
            circuitOpen: false,
            cooldownSecondsRemaining: 0,
          },
        },
      ],
    }).compile();

    service = module.get<MarketService>(MarketService);
    repository = module.get(MarketRepository) as unknown as jest.Mocked<MarketRepository>;
    gdelt = module.get(GdeltService) as unknown as typeof gdelt;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================================================================
  // Scoring formula
  // =========================================================================
  describe('createTopic scoring', () => {
    it('applies the weighted formula to GDELT-supplied metrics', async () => {
      repository.findCategoryById.mockResolvedValue(category() as any);
      repository.findStyleById.mockResolvedValue(style() as any);
      repository.createMarketTopic.mockImplementation(async (dto: any) => dto);

      const result: any = await service.createTopic({
        title: 'Sustainable Packaging (Packaging - Minimalist)',
        categoryId: category().id,
        styleId: style().id,
        trendScore: 66.67,
        marketScore: 78.88,
        searchVolume: 161,
        competitionScore: 20,
      });

      // trend 66.67*0.35 = 23.3345
      // market 78.88*0.35 = 27.608
      // volume (161/15000)*100 = 1.07333 → *0.15 = 0.161
      // competition (100-20)=80 → *0.15 = 12
      // total = 63.10 (2dp)
      expect(result.score).toBeCloseTo(63.1, 1);
    });
  });

  // =========================================================================
  // GDELT-backed discovery
  // =========================================================================
  describe('discoverCommercialTopics', () => {
    it('rejects when no categories or styles are seeded', async () => {
      repository.findCategories.mockResolvedValue([]);
      repository.findStyles.mockResolvedValue([]);

      await expect(service.discoverCommercialTopics()).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when categories exist but carry no seed keywords', async () => {
      repository.findCategories.mockResolvedValue([category({ keywords: [] })] as any);
      repository.findStyles.mockResolvedValue([style()] as any);

      await expect(service.discoverCommercialTopics()).rejects.toThrow(/No seed keywords configured/);
      expect(gdelt.getMetrics).not.toHaveBeenCalled();
    });

    it('creates a topic from real GDELT metrics instead of random numbers', async () => {
      repository.findCategories.mockResolvedValue([category()] as any);
      repository.findStyles.mockResolvedValue([style()] as any);
      repository.findCategoryById.mockResolvedValue(category() as any);
      repository.findStyleById.mockResolvedValue(style() as any);
      repository.createMarketTopic.mockImplementation(async (dto: any) => dto);
      gdelt.getMetrics.mockResolvedValue(metrics());

      const result = await service.discoverCommercialTopics();

      expect(gdelt.getMetrics).toHaveBeenCalledWith('sustainable packaging', { forceRefresh: undefined });
      expect(result.count).toBe(1);
      expect(result.evaluated).toBe(1);

      const created: any = repository.createMarketTopic.mock.calls[0][0];
      expect(created.trendScore).toBe(66.67);
      expect(created.marketScore).toBe(78.88);
      expect(created.searchVolume).toBe(161);
      expect(created.competitionScore).toBe(20);
      expect(created.title).toBe('Sustainable Packaging (Packaging - Minimalist)');
    });

    it('skips keywords GDELT has no coverage for rather than inventing metrics', async () => {
      repository.findCategories.mockResolvedValue([
        category({ keywords: ['glassmorphism'] }),
      ] as any);
      repository.findStyles.mockResolvedValue([style()] as any);
      gdelt.getMetrics.mockResolvedValue(metrics({ keyword: 'glassmorphism', searchVolume: 0 }));

      const result = await service.discoverCommercialTopics();

      expect(result.count).toBe(0);
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0].reason).toMatch(/No news coverage/);
      expect(repository.createMarketTopic).not.toHaveBeenCalled();
    });

    it('skips a keyword when GDELT is unreachable without failing the whole run', async () => {
      repository.findCategories.mockResolvedValue([
        category({ keywords: ['sustainable packaging', 'electric vehicles'] }),
      ] as any);
      repository.findStyles.mockResolvedValue([style()] as any);
      repository.findCategoryById.mockResolvedValue(category() as any);
      repository.findStyleById.mockResolvedValue(style() as any);
      repository.createMarketTopic.mockImplementation(async (dto: any) => dto);

      gdelt.getMetrics
        .mockResolvedValueOnce(null) // first keyword: API failure
        .mockResolvedValueOnce(metrics({ keyword: 'electric vehicles' }));

      const result = await service.discoverCommercialTopics();

      expect(result.evaluated).toBe(2);
      expect(result.count).toBe(1);
      expect(result.skipped[0].reason).toMatch(/no usable response/i);
    });

    it('does not recreate a topic that already exists', async () => {
      repository.findCategories.mockResolvedValue([category()] as any);
      repository.findStyles.mockResolvedValue([style()] as any);
      repository.findMarketTopicByTitle.mockResolvedValue({ id: 'existing' } as any);
      gdelt.getMetrics.mockResolvedValue(metrics());

      const result = await service.discoverCommercialTopics();

      expect(result.count).toBe(0);
      expect(result.skipped[0].reason).toMatch(/already exists/);
      expect(repository.createMarketTopic).not.toHaveBeenCalled();
    });

    it('truncates titles that would exceed the 100-character column limit', async () => {
      const longKeyword = 'a'.repeat(90);
      repository.findCategories.mockResolvedValue([category({ keywords: [longKeyword] })] as any);
      repository.findStyles.mockResolvedValue([style()] as any);
      repository.findCategoryById.mockResolvedValue(category() as any);
      repository.findStyleById.mockResolvedValue(style() as any);
      repository.createMarketTopic.mockImplementation(async (dto: any) => dto);
      gdelt.getMetrics.mockResolvedValue(metrics({ keyword: longKeyword }));

      await service.discoverCommercialTopics();

      const created: any = repository.createMarketTopic.mock.calls[0][0];
      expect(created.title.length).toBeLessThanOrEqual(100);
      expect(created.title.endsWith('...')).toBe(true);
    });

    it('stops early instead of grinding through every keyword when GDELT is rate limiting', async () => {
      repository.findCategories.mockResolvedValue([
        category({ keywords: ['a keyword', 'b keyword', 'c keyword', 'd keyword'] }),
      ] as any);
      repository.findStyles.mockResolvedValue([style()] as any);

      // First keyword fails, then the breaker trips.
      gdelt.getMetrics.mockResolvedValueOnce(null).mockImplementation(async () => {
        throw new Error('should not be called once the circuit is open');
      });
      Object.defineProperty(gdelt, 'circuitOpen', {
        get: () => gdelt.getMetrics.mock.calls.length >= 1,
        configurable: true,
      });
      Object.defineProperty(gdelt, 'cooldownSecondsRemaining', {
        get: () => 45,
        configurable: true,
      });

      const result = await service.discoverCommercialTopics();

      // Only the first keyword was ever requested.
      expect(gdelt.getMetrics).toHaveBeenCalledTimes(1);
      expect(result.aborted).toBe(true);
      expect(result.message).toMatch(/stopped early/i);
      expect(result.message).toMatch(/45s/);
      // The three unattempted keywords are still reported, not silently dropped.
      expect(result.skipped.filter((s) => /not attempted/i.test(s.reason))).toHaveLength(3);
    });

    it('clears the breaker at the start of each run', async () => {
      repository.findCategories.mockResolvedValue([category()] as any);
      repository.findStyles.mockResolvedValue([style()] as any);
      gdelt.getMetrics.mockResolvedValue(null);

      await service.discoverCommercialTopics();

      expect(gdelt.resetCircuit).toHaveBeenCalled();
    });

    it('forwards forceRefresh through to the GDELT client', async () => {
      repository.findCategories.mockResolvedValue([category()] as any);
      repository.findStyles.mockResolvedValue([style()] as any);
      gdelt.getMetrics.mockResolvedValue(null);

      await service.discoverCommercialTopics({ forceRefresh: true });

      expect(gdelt.getMetrics).toHaveBeenCalledWith('sustainable packaging', { forceRefresh: true });
    });
  });
});
