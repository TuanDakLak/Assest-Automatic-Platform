import { Test, TestingModule } from '@nestjs/testing';
import { GdeltService } from '../gdelt.service';
import { PrismaService } from '../../../database/prisma.service';

/**
 * These specs exercise the metric derivation in isolation — no network calls.
 * The tone chart fixture below is a real, unmodified GDELT DOC 2.0 response
 * summary for the query "sustainable packaging" over a one-month window,
 * so the expected values are verifiable against live API behaviour.
 */
describe('GdeltService', () => {
  let service: GdeltService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GdeltService,
        {
          provide: PrismaService,
          useValue: {
            gdeltSnapshot: {
              findUnique: jest.fn().mockResolvedValue(null),
              upsert: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<GdeltService>(GdeltService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================================================================
  // Volume + trend
  // =========================================================================
  describe('deriveVolumeAndTrend', () => {
    const buildTimeline = (values: number[]) => ({
      timeline: [
        {
          series: 'Article Count',
          data: values.map((value, i) => ({
            date: `2026080${(i % 9) + 1}T000000Z`,
            value,
            norm: 100000,
          })),
        },
      ],
    });

    it('sums only the trailing seven buckets into searchVolume', () => {
      // 7 quiet days followed by 7 busy days.
      const timeline = buildTimeline([...Array(7).fill(10), ...Array(7).fill(20)]);

      const result = service.deriveVolumeAndTrend(timeline);

      expect(result.articleCount).toBe(210); // whole window
      expect(result.searchVolume).toBe(140); // trailing 7 days only
    });

    it('scores a keyword at its baseline rate as 50', () => {
      const timeline = buildTimeline(Array(30).fill(12));

      const result = service.deriveVolumeAndTrend(timeline);

      expect(result.trendScore).toBe(50);
    });

    it('scores accelerating coverage above 50', () => {
      // recentAvg 20 vs baselineAvg 15 → ratio 1.333 → 66.67
      const timeline = buildTimeline([...Array(7).fill(10), ...Array(7).fill(20)]);

      const result = service.deriveVolumeAndTrend(timeline);

      expect(result.trendScore).toBeCloseTo(66.67, 2);
    });

    it('clamps explosive growth at 100 instead of overflowing', () => {
      const timeline = buildTimeline([...Array(20).fill(0), ...Array(7).fill(500)]);

      const result = service.deriveVolumeAndTrend(timeline);

      expect(result.trendScore).toBe(100);
    });

    it('throws rather than returning 0 when GDELT changes shape', () => {
      // The dangerous case: a parsed response missing the expected key. Silently
      // returning 0 would look identical to "this keyword has no coverage".
      expect(() => service.deriveVolumeAndTrend({} as any)).toThrow(/did not match the expected shape/);
      expect(() => service.deriveVolumeAndTrend({ results: [] } as any)).toThrow(/timelinevolraw/);
    });

    it('returns zeroes for an empty or missing timeline', () => {
      expect(service.deriveVolumeAndTrend(null)).toEqual({
        searchVolume: 0,
        trendScore: 0,
        articleCount: 0,
      });
      expect(service.deriveVolumeAndTrend({ timeline: [] })).toEqual({
        searchVolume: 0,
        trendScore: 0,
        articleCount: 0,
      });
    });
  });

  // =========================================================================
  // Market score (tone)
  // =========================================================================
  describe('deriveMarketScore', () => {
    /** Real bin counts returned for "sustainable packaging", timespan=1m. */
    const sustainablePackagingTone = {
      tonechart: [
        { bin: -6, count: 1 },
        { bin: -5, count: 1 },
        { bin: -4, count: 0 },
        { bin: -3, count: 5 },
        { bin: -2, count: 5 },
        { bin: -1, count: 8 },
        { bin: 0, count: 14 },
        { bin: 1, count: 36 },
        { bin: 2, count: 18 },
        { bin: 3, count: 19 },
        { bin: 4, count: 14 },
        { bin: 5, count: 16 },
        { bin: 6, count: 10 },
        { bin: 7, count: 4 },
        { bin: 8, count: 8 },
        { bin: 9, count: 1 },
        { bin: 10, count: 1 },
      ],
    };

    it('computes the positive share of a real GDELT tone chart', () => {
      // 127 positive-bin articles out of 161 total = 78.88%
      expect(service.deriveMarketScore(sustainablePackagingTone)).toBeCloseTo(78.88, 2);
    });

    it('treats the neutral bin as non-positive', () => {
      const payload = {
        tonechart: [
          { bin: 0, count: 50 },
          { bin: 1, count: 50 },
        ],
      };

      expect(service.deriveMarketScore(payload)).toBe(50);
    });

    it('returns 0 for uniformly negative coverage', () => {
      const payload = {
        tonechart: [
          { bin: -5, count: 10 },
          { bin: -1, count: 10 },
        ],
      };

      expect(service.deriveMarketScore(payload)).toBe(0);
    });

    it('returns 0 rather than NaN when every bin is empty', () => {
      expect(service.deriveMarketScore({ tonechart: [{ bin: 1, count: 0 }] })).toBe(0);
      expect(service.deriveMarketScore(null)).toBe(0);
    });

    it('throws rather than returning 0 when GDELT changes shape', () => {
      expect(() => service.deriveMarketScore({} as any)).toThrow(/tonechart/);
    });
  });

  // =========================================================================
  // Competition (media saturation)
  // =========================================================================
  describe('deriveCompetition', () => {
    it('counts distinct outlets, not article count', () => {
      const payload = {
        articles: [
          { domain: 'reuters.com', url: 'https://reuters.com/a' },
          { domain: 'reuters.com', url: 'https://reuters.com/b' },
          { domain: 'reuters.com', url: 'https://reuters.com/c' },
          { domain: 'bbc.co.uk', url: 'https://bbc.co.uk/a' },
        ],
      };

      const result = service.deriveCompetition(payload);

      expect(result.distinctDomains).toBe(2);
    });

    it('normalises against the saturation ceiling', () => {
      // 30 distinct domains against the default ceiling of 150 → 20
      const payload = {
        articles: Array.from({ length: 30 }, (_, i) => ({
          domain: `outlet-${i}.com`,
          url: `https://outlet-${i}.com/story`,
        })),
      };

      expect(service.deriveCompetition(payload).competitionScore).toBeCloseTo(20, 2);
    });

    it('clamps at 100 once the ceiling is exceeded', () => {
      const payload = {
        articles: Array.from({ length: 200 }, (_, i) => ({
          domain: `outlet-${i}.com`,
          url: `https://outlet-${i}.com/story`,
        })),
      };

      expect(service.deriveCompetition(payload).competitionScore).toBe(100);
    });

    it('falls back to parsing the URL when domain is absent', () => {
      const payload = {
        articles: [
          { url: 'https://www.theguardian.com/story-one' },
          { url: 'https://theguardian.com/story-two' },
          { url: 'https://apnews.com/story' },
        ],
      };

      // www. is stripped, so the two Guardian entries collapse into one.
      expect(service.deriveCompetition(payload).distinctDomains).toBe(2);
    });

    it('throws rather than returning 0 when GDELT changes shape', () => {
      expect(() => service.deriveCompetition({} as any)).toThrow(/artlist/);
    });

    it('returns zeroes for an empty article list', () => {
      expect(service.deriveCompetition({ articles: [] })).toEqual({
        competitionScore: 0,
        distinctDomains: 0,
      });
      expect(service.deriveCompetition(null)).toEqual({
        competitionScore: 0,
        distinctDomains: 0,
      });
    });
  });

  // =========================================================================
  // Guard rails
  // =========================================================================
  describe('getMetrics', () => {
    it('returns null for a blank keyword without touching the network', async () => {
      await expect(service.getMetrics('   ')).resolves.toBeNull();
    });

    it('returns null when disabled by NODE_ENV=test rather than calling GDELT', async () => {
      // NODE_ENV is 'test' under Jest, so the service must not issue requests.
      await expect(service.getMetrics('sustainable packaging')).resolves.toBeNull();
    });
  });
});
