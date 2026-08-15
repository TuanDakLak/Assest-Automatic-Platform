import { GdeltService } from '../gdelt.service';

/**
 * Live verification against the real GDELT DOC 2.0 API.
 *
 * Skipped by default so `pnpm test` stays offline and deterministic.
 * Run it explicitly:
 *
 *   # PowerShell
 *   cd apps/api
 *   $env:GDELT_LIVE="1"; pnpm test -- --testPathPattern=gdelt.live
 *
 *   # bash
 *   GDELT_LIVE=1 pnpm test -- --testPathPattern=gdelt.live
 *
 * What it proves, and why it matters:
 *
 * Each of the three GDELT modes feeds a different metric through a different
 * parser. If GDELT's response shape ever differs from what the parser expects,
 * the parser returns 0 silently — and the keyword gets dropped as "no coverage"
 * rather than raising an error. This spec checks each parser independently so a
 * failure points at exactly one of them.
 *
 *   timelinevolraw -> searchVolume + trendScore
 *   tonechart      -> marketScore
 *   artlist        -> competitionScore
 */

const LIVE = process.env.GDELT_LIVE === '1';
const describeLive = LIVE ? describe : describe.skip;

// A subject with reliably heavy, ongoing news coverage.
const KEYWORD = process.env.GDELT_LIVE_KEYWORD || 'circular economy';
const BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';

const prismaStub: any = {
  gdeltSnapshot: {
    findUnique: async () => null, // always a cache miss
    upsert: async () => undefined,
  },
};

async function fetchMode(mode: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({
    format: 'json',
    mode,
    query: `"${KEYWORD}"`,
    ...extra,
  });

  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'ai-asset-factory/1.0 (+verification)' },
  });

  const text = await res.text();

  // Anything other than 200 gets dumped in full. A 429 body usually states how
  // long the ban lasts, which is the single most useful fact when blocked.
  if (res.status !== 200) {
    console.log(`  !! HTTP ${res.status}. Response headers:`);
    for (const [k, v] of res.headers.entries()) {
      if (/retry|rate|limit|date/i.test(k)) console.log(`     ${k}: ${v}`);
    }
    console.log(`  !! Body (${text.length} bytes):\n${text.slice(0, 1000)}`);
  }

  return { status: res.status, text };
}

/** GDELT throttles hard; keep a wide gap between raw probes. */
const gap = () => new Promise((r) => setTimeout(r, 6000));

describeLive('GDELT live API', () => {
  jest.setTimeout(300000);

  beforeAll(() => {
    // The service disables itself under NODE_ENV=test.
    process.env.NODE_ENV = 'development';
    process.env.GDELT_ENABLED = 'true';
    process.env.GDELT_THROTTLE_MS = process.env.GDELT_THROTTLE_MS || '6000';
  });

  // =========================================================================
  // Part 1 — raw response shapes
  // =========================================================================

  it('timelinevolraw returns timeline[0].data[] with numeric value', async () => {
    const { status, text } = await fetchMode('timelinevolraw', { timespan: '1m' });
    console.log(`\n[timelinevolraw] HTTP ${status}, ${text.length} bytes`);

    expect(status).toBe(200);
    expect(text.trim().length).toBeGreaterThan(0); // empty body = rate limited

    const json = JSON.parse(text);
    console.log('  top-level keys:', Object.keys(json));

    const data = json?.timeline?.[0]?.data;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    console.log('  first bucket:', JSON.stringify(data[0]));
    expect(typeof data[0].value).toBe('number');

    await gap();
  });

  it('tonechart returns tonechart[] with bin and count', async () => {
    const { status, text } = await fetchMode('tonechart', { timespan: '1w' });
    console.log(`\n[tonechart] HTTP ${status}, ${text.length} bytes`);

    expect(status).toBe(200);
    expect(text.trim().length).toBeGreaterThan(0);

    const json = JSON.parse(text);
    console.log('  top-level keys:', Object.keys(json));

    const bins = json?.tonechart;
    expect(Array.isArray(bins)).toBe(true);
    expect(bins.length).toBeGreaterThan(0);

    console.log('  first bin:', JSON.stringify({ bin: bins[0].bin, count: bins[0].count }));
    expect(typeof bins[0].bin).toBe('number');
    expect(typeof bins[0].count).toBe('number');

    await gap();
  });

  it('artlist returns articles[] carrying a domain field', async () => {
    const { status, text } = await fetchMode('artlist', { timespan: '1w', maxrecords: '250' });
    console.log(`\n[artlist] HTTP ${status}, ${text.length} bytes`);

    expect(status).toBe(200);
    expect(text.trim().length).toBeGreaterThan(0);

    const json = JSON.parse(text);
    console.log('  top-level keys:', Object.keys(json));

    const articles = json?.articles;
    expect(Array.isArray(articles)).toBe(true);
    expect(articles.length).toBeGreaterThan(0);

    console.log('  first article keys:', Object.keys(articles[0]));
    // deriveCompetition falls back to parsing `url`, so either is acceptable.
    const hasDomainSignal = Boolean(articles[0].domain || articles[0].url);
    expect(hasDomainSignal).toBe(true);

    await gap();
  });

  // =========================================================================
  // Part 2 — the real service, end to end
  // =========================================================================

  it('GdeltService turns the live responses into four usable metrics', async () => {
    const service = new GdeltService(prismaStub);
    const metrics = await service.getMetrics(KEYWORD, { forceRefresh: true });

    console.log(`\n[GdeltService] "${KEYWORD}"`);
    console.log(JSON.stringify(metrics, null, 2));

    expect(metrics).not.toBeNull();

    // Each assertion isolates one parser — read the failure to know which broke.
    expect(metrics!.searchVolume).toBeGreaterThan(0); // timelinevolraw
    expect(metrics!.marketScore).toBeGreaterThan(0); // tonechart
    expect(metrics!.competitionScore).toBeGreaterThan(0); // artlist

    // trendScore can legitimately be 0 only if the baseline is empty, which
    // cannot happen when searchVolume > 0.
    expect(metrics!.trendScore).toBeGreaterThan(0);
    expect(metrics!.trendScore).toBeLessThanOrEqual(100);

    // Sanity: real coverage counts are two to three digits, not the 2000-17000
    // range the old random generator produced.
    console.log(
      `\n  VERDICT: volume=${metrics!.searchVolume} trend=${metrics!.trendScore} ` +
        `market=${metrics!.marketScore} competition=${metrics!.competitionScore} ` +
        `(${metrics!.distinctDomains} outlets, ${metrics!.articleCount} articles in baseline)`,
    );
  });

  it('reports zero coverage for design jargon rather than inventing numbers', async () => {
    const service = new GdeltService(prismaStub);
    const metrics = await service.getMetrics('glassmorphism', { forceRefresh: true });

    console.log('\n[GdeltService] "glassmorphism"');
    console.log(JSON.stringify(metrics, null, 2));

    // Either no usable response at all, or a real response with no coverage.
    if (metrics) {
      expect(metrics.searchVolume).toBe(0);
    }
  });
});
