import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * The four metrics MarketService feeds into its weighted scoring formula.
 */
export interface GdeltMetrics {
  keyword: string;
  /** Number of matching articles over the recent window. */
  searchVolume: number;
  /** 0-100. Momentum of recent coverage against the longer baseline. */
  trendScore: number;
  /** 0-100. Share of coverage carrying a positive tone. */
  marketScore: number;
  /** 0-100. Media saturation. Higher means more outlets already cover it. */
  competitionScore: number;
  /** Diagnostics kept alongside the cached row. */
  articleCount: number;
  distinctDomains: number;
  fetchedAt: Date;
  fromCache: boolean;
}

interface TimelineResponse {
  timeline?: Array<{
    series?: string;
    data?: Array<{ date?: string; value?: number; norm?: number }>;
  }>;
}

interface ToneChartResponse {
  tonechart?: Array<{ bin?: number; count?: number }>;
}

interface ArtListResponse {
  articles?: Array<{ domain?: string; url?: string }>;
}

/**
 * Client for the GDELT DOC 2.0 API (https://api.gdeltproject.org/api/v2/doc/doc).
 *
 * Two behaviours of that API drive the design of this class:
 *
 * 1. It needs no API key, but it rate limits aggressively and signals this by
 *    returning HTTP 200 with an EMPTY BODY rather than a 429. Every request is
 *    therefore serialised behind a throttle and an empty body is retried.
 * 2. It indexes world news, not design trends. Queries like "glassmorphism"
 *    legitimately return nothing. After retries are exhausted an empty result
 *    is reported as zero volume rather than as an error.
 */
@Injectable()
export class GdeltService {
  private readonly logger = new Logger(GdeltService.name);
  private readonly baseUrl = 'https://api.gdeltproject.org/api/v2/doc/doc';

  /** Serialises every outbound request so we never fire two at once. */
  private requestChain: Promise<unknown> = Promise.resolve();
  private lastRequestAt = 0;

  /** Epoch ms until which every request must wait. Set when GDELT returns 429. */
  private cooldownUntil = 0;

  /** Consecutive keyword failures. Trips the breaker so a run can bail early. */
  private consecutiveFailures = 0;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Accessor for the GdeltSnapshot delegate.
   *
   * Cast because the generated Prisma client only gains this model after
   * `pnpm db:generate` has run against the updated schema. Keeping the cast
   * here means the project still compiles on a fresh checkout and fails with a
   * readable message at runtime instead of a wall of type errors.
   */
  private get snapshots(): any {
    const delegate = (this.prisma as any).gdeltSnapshot;
    if (!delegate) {
      throw new Error(
        'Prisma model "GdeltSnapshot" is missing from the generated client. ' +
          'Run `pnpm db:generate` and `pnpm db:migrate` in apps/api.',
      );
    }
    return delegate;
  }

  private get enabled(): boolean {
    return process.env.GDELT_ENABLED !== 'false' && process.env.NODE_ENV !== 'test';
  }

  private get mockEnabled(): boolean {
    return process.env.GDELT_MOCK === 'true';
  }

  private generateMockMetrics(keyword: string): GdeltMetrics {
    // Generate a simple deterministic hash code from the keyword string
    let hash = 0;
    for (let i = 0; i < keyword.length; i++) {
      hash = keyword.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Use the hash to get deterministic values between 40 and 95
    const seedValue = (min: number, max: number, offset = 0) => {
      const val = Math.abs(Math.sin(hash + offset));
      return Math.round(min + val * (max - min));
    };

    const searchVolume = seedValue(50, 450, 1);
    const trendScore = seedValue(60, 98, 2);
    const marketScore = seedValue(55, 95, 3);
    const competitionScore = seedValue(40, 85, 4);

    return {
      searchVolume,
      trendScore,
      marketScore,
      competitionScore,
      distinctDomains: seedValue(5, 50, 5),
      articleCount: searchVolume * 2,
      keyword,
      fetchedAt: new Date(),
      fromCache: false,
    };
  }

  private get newsApiKey(): string | undefined {
    return process.env.NEWS_API_KEY;
  }

  private async fetchNewsApiMetrics(keyword: string): Promise<GdeltMetrics | null> {
    const apiKey = this.newsApiKey;
    if (!apiKey) return null;

    const encodedKeyword = encodeURIComponent(`"${keyword}"`);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const toDateStr = (d: Date) => d.toISOString().split('T')[0];

    // Request 1: Recent 7 days (also fetches articles to analyze domains and sentiment)
    const recentUrl = `https://newsapi.org/v2/everything?q=${encodedKeyword}&from=${toDateStr(sevenDaysAgo)}&language=en&pageSize=100&apiKey=${apiKey}`;
    
    // Request 2: Baseline 7 days (previous week)
    const baselineUrl = `https://newsapi.org/v2/everything?q=${encodedKeyword}&from=${toDateStr(fourteenDaysAgo)}&to=${toDateStr(sevenDaysAgo)}&language=en&pageSize=1&apiKey=${apiKey}`;

    const [recentRes, baselineRes] = await Promise.all([
      fetch(recentUrl).then(async (r) => {
        if (!r.ok) throw new Error(`Recent query failed: ${r.status} ${r.statusText}`);
        return r.json();
      }),
      fetch(baselineUrl).then(async (r) => {
        if (!r.ok) throw new Error(`Baseline query failed: ${r.status} ${r.statusText}`);
        return r.json();
      })
    ]);

    if (recentRes.status !== 'ok' || baselineRes.status !== 'ok') {
      throw new Error(`NewsAPI returned error status: recent=${recentRes.status}, baseline=${baselineRes.status}`);
    }

    const recentVol = recentRes.totalResults || 0;
    const baselineVol = baselineRes.totalResults || 0;

    // Calculate trendScore (recent / baseline * 100)
    const trendScore = Math.min(100, Math.max(0, Math.round((recentVol / (baselineVol || 1)) * 100)));

    // Calculate competitionScore based on unique domains
    const articles = recentRes.articles || [];
    const domains = new Set<string>();
    articles.forEach((art: any) => {
      const sourceName = art.source?.name || art.source?.id;
      if (sourceName) domains.add(sourceName);
    });

    const distinctDomains = domains.size;
    const competitionScore = Math.min(100, Math.round((distinctDomains / 30) * 100));

    // Calculate marketScore based on basic sentiment analysis of titles/descriptions
    let posCount = 0;
    let negCount = 0;
    const posKeywords = /\b(growth|record|launch|success|positive|clean|benefit|dynamic|rise|boom|green|breakthrough|key|leading|innovation|innovative|efficient|sustainable|health|improvement|improved|popular)\b/i;
    const negKeywords = /\b(decline|fall|drop|warning|fail|drop|risk|crisis|threat|negative|low|concern|inflation|slowdown|recession|bankruptcy|collapse|deficit)\b/i;

    articles.forEach((art: any) => {
      const text = `${art.title || ''} ${art.description || ''}`;
      if (posKeywords.test(text)) posCount++;
      if (negKeywords.test(text)) negCount++;
    });

    const totalSentimentMentions = posCount + negCount;
    let marketScore = 65; // Default middle-high score
    if (totalSentimentMentions > 0) {
      marketScore = Math.min(100, Math.max(0, Math.round((posCount / totalSentimentMentions) * 100)));
    }

    return {
      searchVolume: recentVol,
      trendScore,
      marketScore,
      competitionScore,
      distinctDomains,
      articleCount: recentVol,
      keyword,
      fetchedAt: new Date(),
      fromCache: false,
    };
  }

  /**
   * Gap between outbound requests. GDELT tolerates far less than its docs
   * suggest — below ~5s sustained it starts answering 429.
   */
  private get throttleMs(): number {
    return parseInt(process.env.GDELT_THROTTLE_MS || '5000', 10);
  }

  /** How long to stand down after a 429 before touching the API again. */
  private get cooldownMs(): number {
    return parseInt(process.env.GDELT_COOLDOWN_MS || '60000', 10);
  }

  /** Keyword failures in a row before the breaker trips. */
  private get failureThreshold(): number {
    return parseInt(process.env.GDELT_MAX_CONSECUTIVE_FAILURES || '3', 10);
  }

  private get cacheTtlHours(): number {
    return parseInt(process.env.GDELT_CACHE_TTL_HOURS || '12', 10);
  }

  private get requestTimeoutMs(): number {
    return parseInt(process.env.GDELT_TIMEOUT_MS || '5000', 10);
  }

  private get maxRetries(): number {
    return parseInt(process.env.GDELT_MAX_RETRIES || '1', 10);
  }

  /** Baseline window used to judge momentum. */
  private get baselineTimespan(): string {
    return process.env.GDELT_BASELINE_TIMESPAN || '3m';
  }

  /** Recent window used for volume, tone and competition. */
  private get recentTimespan(): string {
    return process.env.GDELT_RECENT_TIMESPAN || '1w';
  }

  // =========================================================================
  // Circuit breaker
  // =========================================================================

  /**
   * True once GDELT has failed `failureThreshold` keywords in a row. Callers
   * should stop the run rather than grind through the remaining keywords: at
   * ~40s per failing keyword a 17-keyword list burns 12 minutes to achieve
   * nothing, and every attempt deepens the rate limit.
   */
  get circuitOpen(): boolean {
    return this.consecutiveFailures >= this.failureThreshold;
  }

  /** Seconds left on the current cooldown, for reporting back to the caller. */
  get cooldownSecondsRemaining(): number {
    return Math.max(0, Math.ceil((this.cooldownUntil - Date.now()) / 1000));
  }

  /** Clears the breaker. Call before starting a fresh discovery run. */
  resetCircuit(): void {
    this.consecutiveFailures = 0;
  }

  // =========================================================================
  // Public API
  // =========================================================================

  /**
   * Resolves metrics for a keyword, preferring a fresh cached snapshot.
   * Returns null when GDELT is disabled or every request failed, letting the
   * caller decide whether to skip the keyword.
   */
  async getMetrics(keyword: string, options?: { forceRefresh?: boolean }): Promise<GdeltMetrics | null> {
    const normalised = keyword.trim().toLowerCase();
    if (!normalised) {
      return null;
    }

    if (this.mockEnabled) {
      this.logger.log(`[GDELT] Mock Mode active. Generating deterministic metrics for "${normalised}".`);
      return this.generateMockMetrics(normalised);
    }

    if (this.newsApiKey) {
      this.logger.log(`[NewsAPI] Fetching metrics for "${normalised}" from NewsAPI.org.`);
      try {
        if (!options?.forceRefresh) {
          const cached = await this.readCache(normalised);
          if (cached) {
            this.logger.log(`[NewsAPI] Cache hit for "${normalised}" (fetched ${cached.fetchedAt.toISOString()})`);
            return cached;
          }
        }
        const metrics = await this.fetchNewsApiMetrics(normalised);
        if (metrics) {
          await this.writeCache(metrics);
        }
        return metrics;
      } catch (err: any) {
        this.logger.error(`[NewsAPI] Failed to fetch metrics for "${normalised}": ${err.message}`);
        const stale = await this.readCache(normalised, { ignoreTtl: true });
        if (stale) {
          this.logger.warn(`[NewsAPI] Falling back to stale snapshot for "${normalised}".`);
          return stale;
        }
        return null;
      }
    }

    if (this.cooldownSecondsRemaining > 0) {
      this.logger.warn(
        `[GDELT] Rate limit cooldown active (${this.cooldownSecondsRemaining}s remaining). ` +
          `Skipping request for "${normalised}".`
      );
      // Fall back to a stale snapshot rather than losing the keyword entirely.
      const stale = await this.readCache(normalised, { ignoreTtl: true });
      if (stale) {
        this.logger.warn(`[GDELT] Falling back to stale snapshot for "${normalised}" during cooldown.`);
        return stale;
      }
      return null;
    }

    if (!options?.forceRefresh) {
      const cached = await this.readCache(normalised);
      if (cached) {
        this.logger.log(`[GDELT] Cache hit for "${normalised}" (fetched ${cached.fetchedAt.toISOString()})`);
        return cached;
      }
    }

    if (!this.enabled) {
      this.logger.warn('[GDELT] Disabled via GDELT_ENABLED / NODE_ENV=test. Returning null.');
      return null;
    }

    if (this.circuitOpen) {
      this.logger.warn(
        `[GDELT] Circuit open after ${this.consecutiveFailures} consecutive failures. ` +
          `Not requesting "${normalised}".`,
      );
      return null;
    }

    try {
      const metrics = await this.fetchMetrics(normalised);
      await this.writeCache(metrics);
      this.consecutiveFailures = 0;
      return metrics;
    } catch (error: any) {
      this.consecutiveFailures += 1;
      this.logger.error(
        `[GDELT] Failed to resolve metrics for "${normalised}" ` +
          `(${this.consecutiveFailures}/${this.failureThreshold} consecutive): ${error.message}`,
      );

      // Fall back to a stale snapshot rather than losing the keyword entirely.
      const stale = await this.readCache(normalised, { ignoreTtl: true });
      if (stale) {
        this.logger.warn(`[GDELT] Falling back to stale snapshot for "${normalised}".`);
        return stale;
      }
      return null;
    }
  }

  /** Resolves metrics for many keywords sequentially, respecting the throttle. */
  async getMetricsForKeywords(
    keywords: string[],
    options?: { forceRefresh?: boolean },
  ): Promise<Map<string, GdeltMetrics>> {
    const results = new Map<string, GdeltMetrics>();
    for (const keyword of keywords) {
      const metrics = await this.getMetrics(keyword, options);
      if (metrics) {
        results.set(metrics.keyword, metrics);
      }
    }
    return results;
  }

  // =========================================================================
  // Metric assembly
  // =========================================================================

  private async fetchMetrics(keyword: string): Promise<GdeltMetrics> {
    const quoted = `"${keyword}"`;

    const [timeline, tone, artlist] = await Promise.all([
      this.request<TimelineResponse>({
        query: quoted,
        mode: 'timelinevolraw',
        timespan: this.baselineTimespan,
      }),
      this.request<ToneChartResponse>({
        query: quoted,
        mode: 'tonechart',
        timespan: this.recentTimespan,
      }),
      this.request<ArtListResponse>({
        query: quoted,
        mode: 'artlist',
        timespan: this.recentTimespan,
        maxrecords: '250',
      }),
    ]);

    const { searchVolume, trendScore, articleCount } = this.deriveVolumeAndTrend(timeline);
    const marketScore = this.deriveMarketScore(tone);
    const { competitionScore, distinctDomains } = this.deriveCompetition(artlist);

    this.logger.log(
      `[GDELT] "${keyword}" → volume=${searchVolume} trend=${trendScore} market=${marketScore} competition=${competitionScore} (${distinctDomains} domains)`,
    );

    return {
      keyword,
      searchVolume,
      trendScore,
      marketScore,
      competitionScore,
      articleCount,
      distinctDomains,
      fetchedAt: new Date(),
      fromCache: false,
    };
  }

  /**
   * searchVolume = total matching articles in the recent window.
   * trendScore   = momentum of the recent window against the full baseline.
   *
   * A keyword covered at exactly its baseline rate scores 50. Twice the
   * baseline or better saturates at 100.
   */
  deriveVolumeAndTrend(payload: TimelineResponse | null): {
    searchVolume: number;
    trendScore: number;
    articleCount: number;
  } {
    // A null payload means "no response after retries" — a legitimate zero.
    if (payload === null || payload === undefined) {
      return { searchVolume: 0, trendScore: 0, articleCount: 0 };
    }

    // A payload that parsed but lacks the expected key means GDELT changed
    // shape. Fail loudly: returning 0 here would masquerade as "no coverage"
    // and silently drop every keyword.
    this.assertShape(Array.isArray(payload.timeline), 'timelinevolraw', 'timeline[]', payload);

    const series = payload.timeline?.[0]?.data;
    if (!series) {
      // timeline exists but the first series has no data array.
      this.assertShape(
        payload.timeline!.length === 0,
        'timelinevolraw',
        'timeline[0].data[]',
        payload,
      );
      return { searchVolume: 0, trendScore: 0, articleCount: 0 };
    }

    if (series.length === 0) {
      return { searchVolume: 0, trendScore: 0, articleCount: 0 };
    }

    const values = series.map((point) => Number(point.value) || 0);
    const articleCount = values.reduce((sum, v) => sum + v, 0);

    // The baseline window is daily-resolution; take the trailing 7 buckets.
    const recentWindow = Math.min(7, values.length);
    const recent = values.slice(-recentWindow);
    const searchVolume = recent.reduce((sum, v) => sum + v, 0);

    const recentAvg = searchVolume / recentWindow;
    const baselineAvg = articleCount / values.length;

    if (baselineAvg <= 0) {
      return { searchVolume, trendScore: 0, articleCount };
    }

    const ratio = recentAvg / baselineAvg;
    const trendScore = this.clamp(Math.round(ratio * 50 * 100) / 100, 0, 100);

    return { searchVolume, trendScore, articleCount };
  }

  /**
   * marketScore = share of coverage in positive tone bins.
   *
   * Rationale: subjects reported on positively (launches, investment, growth)
   * correlate better with commercial demand than subjects reported on
   * negatively (disasters, scandals, recalls).
   */
  deriveMarketScore(payload: ToneChartResponse | null): number {
    if (payload === null || payload === undefined) {
      return 0;
    }

    this.assertShape(Array.isArray(payload.tonechart), 'tonechart', 'tonechart[]', payload);

    const bins = payload.tonechart!;
    if (bins.length === 0) {
      return 0;
    }

    let total = 0;
    let positive = 0;

    for (const entry of bins) {
      const count = Number(entry.count) || 0;
      const bin = Number(entry.bin) || 0;
      total += count;
      if (bin > 0) {
        positive += count;
      }
    }

    if (total === 0) {
      return 0;
    }

    return this.clamp(Math.round((positive / total) * 100 * 100) / 100, 0, 100);
  }

  /**
   * competitionScore = media saturation, measured as the number of distinct
   * outlets covering the keyword in the recent window. Higher means the space
   * is already crowded; MarketService inverts this when scoring.
   *
   * The DOC API caps artlist at 250 records, so the count saturates well
   * before that. 150 distinct domains is treated as fully saturated.
   */
  deriveCompetition(payload: ArtListResponse | null): {
    competitionScore: number;
    distinctDomains: number;
  } {
    if (payload === null || payload === undefined) {
      return { competitionScore: 0, distinctDomains: 0 };
    }

    this.assertShape(Array.isArray(payload.articles), 'artlist', 'articles[]', payload);

    const articles = payload.articles!;
    if (articles.length === 0) {
      return { competitionScore: 0, distinctDomains: 0 };
    }

    const domains = new Set<string>();
    for (const article of articles) {
      const domain = (article.domain || this.domainFromUrl(article.url) || '').toLowerCase();
      if (domain) {
        domains.add(domain);
      }
    }

    const saturationCeiling = parseInt(process.env.GDELT_SATURATION_CEILING || '150', 10);
    const competitionScore = this.clamp(
      Math.round((domains.size / saturationCeiling) * 100 * 100) / 100,
      0,
      100,
    );

    return { competitionScore, distinctDomains: domains.size };
  }

  // =========================================================================
  // HTTP plumbing
  // =========================================================================

  /**
   * Issues a throttled, retried request. Every call is queued behind the
   * previous one so concurrent callers cannot burst past the rate limit.
   */
  private request<T>(params: Record<string, string>): Promise<T | null> {
    const run = this.requestChain.then(() => this.executeWithRetry<T>(params));
    // Keep the chain alive even if this link rejects.
    this.requestChain = run.catch(() => undefined);
    return run;
  }

  private async executeWithRetry<T>(params: Record<string, string>): Promise<T | null> {
    const url = this.buildUrl(params);

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      // Abort immediately if a concurrent request hit a 429 and triggered cooldown
      const cooldownRemaining = this.cooldownSecondsRemaining;
      if (cooldownRemaining > 0) {
        throw new Error(
          `GDELT rate limit cooldown active (${cooldownRemaining}s remaining). ` +
            `Aborting request for ${params.mode} "${params.query}" to clear queue.`
        );
      }

      await this.waitForThrottle();

      try {
        const body = await this.fetchText(url);
        const trimmed = body.trim();

        if (trimmed.length === 0) {
          // Empty 200 means rate limited or genuinely no news coverage.
          // Trigger the cooldown to protect the IP and abort immediately to clear the queue.
          this.cooldownUntil = Date.now() + this.cooldownMs;
          this.logger.warn(
            `[GDELT] Empty body (rate limit/no coverage) on ${params.mode} "${params.query}". Pausing all requests for ` +
              `${Math.ceil((this.cooldownUntil - Date.now()) / 1000)}s.`
          );
          throw new Error(
            `GDELT returned empty response on ${params.mode} "${params.query}". Aborting request to clear queue.`
          );
        }

        // Check if the body looks like HTML or plain text (e.g. rate limit messages)
        const isJson = trimmed.startsWith('{') || trimmed.startsWith('[');
        const isRateLimitText = /limit|rate|throttle|ngrams|contact/i.test(trimmed);

        if (!isJson || isRateLimitText) {
          this.cooldownUntil = Date.now() + this.cooldownMs;
          this.logger.warn(
            `[GDELT] Non-JSON or rate-limit body received on ${params.mode} "${params.query}". Pausing all requests. ` +
              `Body starts with: "${trimmed.slice(0, 100)}"`
          );
          throw new Error(
            `GDELT rate limited or returned invalid response on ${params.mode} "${params.query}". Aborting request to clear queue.`
          );
        }

        return JSON.parse(trimmed) as T;
      } catch (error: any) {
        const isTimeout = error?.name === 'AbortError' || error?.message?.includes('timeout') || error?.message?.includes('aborted');

        // A 429 or timeout is GDELT asking us to stand down or experiencing severe issues.
        // Fast-fail the current request chain immediately. Retrying only deepens the rate limit/blocks the queue.
        if (error?.isRateLimit || isTimeout) {
          this.cooldownUntil = Date.now() + this.cooldownMs;
          this.logger.warn(
            `[GDELT] ${isTimeout ? 'Timeout' : 'Rate limit (429)'} on ${params.mode} "${params.query}". Pausing all requests for ` +
              `${Math.ceil((this.cooldownUntil - Date.now()) / 1000)}s.`,
          );

          throw new Error(
            `GDELT ${isTimeout ? 'timed out' : 'rate limited'} on ${params.mode} "${params.query}". ` +
              `Aborting request to clear queue.`
          );
        }

        if (attempt >= this.maxRetries) {
          throw new Error(`GDELT request failed for ${params.mode} "${params.query}": ${error.message}`);
        }

        const backoff = this.throttleMs * Math.pow(2, attempt);
        this.logger.warn(
          `[GDELT] Request error on attempt ${attempt}/${this.maxRetries}: ${error.message}. Retrying in ${backoff}ms.`,
        );
        await this.sleep(backoff);
      }
    }

    return null;
  }

  private async fetchText(url: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          // GDELT blocks requests without a recognisable agent.
          'User-Agent': 'ai-asset-factory/1.0 (+market-discovery)',
          Accept: 'application/json',
        },
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const err: any = new Error('HTTP 429 Too Many Requests');
        err.isRateLimit = true;
        // Retry-After is in seconds when numeric; ignore HTTP-date form.
        if (retryAfter && /^\d+$/.test(retryAfter.trim())) {
          err.retryAfterMs = parseInt(retryAfter.trim(), 10) * 1000;
        }
        throw err;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timer);
    }
  }

  private buildUrl(params: Record<string, string>): string {
    const search = new URLSearchParams({ format: 'json', ...params });
    return `${this.baseUrl}?${search.toString()}`;
  }

  private async waitForThrottle(): Promise<void> {
    // A cooldown set by a 429 outranks the normal inter-request gap.
    const cooldownWait = this.cooldownUntil - Date.now();
    if (cooldownWait > 0) {
      await this.sleep(cooldownWait);
    }

    const elapsed = Date.now() - this.lastRequestAt;
    const wait = this.throttleMs - elapsed;
    if (wait > 0) {
      await this.sleep(wait);
    }
    this.lastRequestAt = Date.now();
  }

  // =========================================================================
  // Cache
  // =========================================================================

  private async readCache(
    keyword: string,
    options?: { ignoreTtl?: boolean },
  ): Promise<GdeltMetrics | null> {
    let snapshot: any;
    try {
      snapshot = await this.snapshots.findUnique({ where: { keyword } });
    } catch (error: any) {
      this.logger.warn(`[GDELT] Cache read failed for "${keyword}": ${error.message}`);
      return null;
    }

    if (!snapshot) {
      return null;
    }

    if (!options?.ignoreTtl) {
      const ageMs = Date.now() - new Date(snapshot.fetchedAt).getTime();
      if (ageMs > this.cacheTtlHours * 3600 * 1000) {
        return null;
      }
    }

    return {
      keyword: snapshot.keyword,
      searchVolume: snapshot.searchVolume,
      trendScore: snapshot.trendScore,
      marketScore: snapshot.marketScore,
      competitionScore: snapshot.competitionScore,
      articleCount: snapshot.articleCount,
      distinctDomains: snapshot.distinctDomains,
      fetchedAt: new Date(snapshot.fetchedAt),
      fromCache: true,
    };
  }

  private async writeCache(metrics: GdeltMetrics): Promise<void> {
    const data = {
      searchVolume: metrics.searchVolume,
      trendScore: metrics.trendScore,
      marketScore: metrics.marketScore,
      competitionScore: metrics.competitionScore,
      articleCount: metrics.articleCount,
      distinctDomains: metrics.distinctDomains,
      fetchedAt: metrics.fetchedAt,
      raw: {
        baselineTimespan: this.baselineTimespan,
        recentTimespan: this.recentTimespan,
        source: 'gdelt-doc-2.0',
      },
    };

    try {
      await this.snapshots.upsert({
        where: { keyword: metrics.keyword },
        create: { keyword: metrics.keyword, ...data },
        update: data,
      });
    } catch (error: any) {
      this.logger.warn(`[GDELT] Cache write failed for "${metrics.keyword}": ${error.message}`);
    }
  }

  // =========================================================================
  // Small helpers
  // =========================================================================

  /**
   * Guards against GDELT changing its response shape.
   *
   * Without this, a renamed or restructured field makes the parser return 0,
   * which the discovery engine reads as "this keyword has no news coverage" —
   * indistinguishable from the genuine case. Every keyword would be skipped and
   * nothing in the logs would say why. Throwing turns an invisible data bug
   * into a visible one.
   */
  private assertShape(ok: boolean, mode: string, expected: string, payload: unknown): void {
    if (ok) return;

    const keys = payload && typeof payload === 'object' ? Object.keys(payload) : [];
    throw new Error(
      `GDELT ${mode} response did not match the expected shape. ` +
        `Expected "${expected}", got top-level keys [${keys.join(', ')}]. ` +
        'The API contract may have changed — check deriveVolumeAndTrend / ' +
        'deriveMarketScore / deriveCompetition in gdelt.service.ts.',
    );
  }

  private domainFromUrl(url?: string): string | null {
    if (!url) return null;
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
