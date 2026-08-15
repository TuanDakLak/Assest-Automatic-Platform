import { test, expect, Page } from '@playwright/test';

/**
 * UI tests for the GDELT-backed market discovery panel.
 *
 * These intercept the backend so they are deterministic, run in seconds, and
 * do not need the NestJS API, Postgres or GDELT to be up. A live smoke test
 * against the real stack is at the bottom, opt-in via MARKET_LIVE=1.
 */

const API = 'http://localhost:3001/api/v1/market';

const CATEGORIES = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Sustainability',
    description: 'Green economy, circular production, climate technology.',
    keywords: ['sustainable packaging', 'circular economy'],
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Legacy Category',
    description: 'Seeded before GDELT existed.',
    keywords: [],
  },
];

const STYLES = [
  { id: '33333333-3333-3333-3333-333333333333', name: 'Minimalist' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Glassmorphism' },
];

const TOPICS = [
  {
    id: '55555555-5555-5555-5555-555555555555',
    title: 'Sustainable Packaging (Sustainability - Minimalist)',
    categoryId: CATEGORIES[0].id,
    category: CATEGORIES[0],
    styleId: STYLES[0].id,
    style: STYLES[0],
    trendScore: 58.31,
    marketScore: 78.88,
    searchVolume: 47,
    competitionScore: 21.33,
    score: 63.1,
    status: 'DISCOVERED',
    createdAt: '2026-08-12T09:14:22.113Z',
  },
];

const json = (body: unknown, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

/** Serves the three endpoints MarketPanel loads on mount. */
async function stubReads(page: Page) {
  await page.route(`${API}/categories`, (route) =>
    route.request().method() === 'GET' ? route.fulfill(json(CATEGORIES)) : route.fallback(),
  );
  await page.route(`${API}/styles`, (route) => route.fulfill(json(STYLES)));
  await page.route(`${API}/topics`, (route) =>
    route.request().method() === 'GET' ? route.fulfill(json(TOPICS)) : route.fallback(),
  );
}

test.describe('Market panel — GDELT discovery', () => {
  test.beforeEach(async ({ page }) => {
    await stubReads(page);
  });

  test('renders the page and its seeded data', async ({ page }) => {
    await page.goto('/market');

    await expect(page.locator('h1')).toContainText('Market View');
    await expect(page.getByText('Sustainability', { exact: true })).toBeVisible();
    await expect(page.getByText('Minimalist', { exact: true }).first()).toBeVisible();
  });

  test('shows seed keywords as chips on the category that has them', async ({ page }) => {
    await page.goto('/market');

    await expect(page.getByText('sustainable packaging', { exact: true })).toBeVisible();
    await expect(page.getByText('circular economy', { exact: true })).toBeVisible();
  });

  test('warns about a category that discovery will skip', async ({ page }) => {
    await page.goto('/market');

    await expect(
      page.getByText('No seed keywords — skipped by discovery'),
    ).toBeVisible();
  });

  test('sends keywords as an array when creating a category', async ({ page }) => {
    let postedBody: any = null;

    await page.route(`${API}/categories`, async (route) => {
      if (route.request().method() === 'POST') {
        postedBody = route.request().postDataJSON();
        return route.fulfill(json({ id: 'new', ...postedBody }, 201));
      }
      return route.fulfill(json(CATEGORIES));
    });

    await page.goto('/market');

    await page.getByPlaceholder('Category name (e.g. Dashboard, E-Commerce)').fill('Mobility');
    await page
      .getByPlaceholder('GDELT keywords, comma separated')
      .fill('electric vehicles, urban mobility ,  ');
    await page.getByRole('button', { name: 'Add Category' }).click();

    await expect(page.getByText('Category created successfully!')).toBeVisible();

    // Whitespace trimmed, empty entries dropped.
    expect(postedBody).toMatchObject({
      name: 'Mobility',
      keywords: ['electric vehicles', 'urban mobility'],
    });
  });

  test('reports counts after a successful discovery run', async ({ page }) => {
    await page.route(`${API}/discover*`, (route) =>
      route.fulfill(
        json({
          message: 'Commercial topic discovery complete.',
          count: 14,
          evaluated: 17,
          topics: TOPICS,
          skipped: [
            { keyword: 'glassmorphism', reason: 'No news coverage found in the recent window.' },
            { keyword: 'claymorphism', reason: 'No news coverage found in the recent window.' },
            { keyword: 'neo-brutalism', reason: 'No news coverage found in the recent window.' },
          ],
        }),
      ),
    );

    await page.goto('/market');
    await page.getByRole('button', { name: 'Discover New Topics' }).click();

    await expect(
      page.getByText('Scored 17 keyword(s) and created 14 topic(s), skipped 3.'),
    ).toBeVisible();
  });

  test('surfaces the reason when discovery creates nothing', async ({ page }) => {
    await page.route(`${API}/discover*`, (route) =>
      route.fulfill(
        json({
          message: 'Discovery ran but produced no new topics. See "skipped" for details.',
          count: 0,
          evaluated: 2,
          topics: [],
          skipped: [
            { keyword: 'glassmorphism', reason: 'No news coverage found in the recent window.' },
            { keyword: 'claymorphism', reason: 'No news coverage found in the recent window.' },
          ],
        }),
      ),
    );

    await page.goto('/market');
    await page.getByRole('button', { name: 'Discover New Topics' }).click();

    await expect(page.getByText(/created no topics/)).toBeVisible();
    await expect(page.getByText(/No news coverage found/)).toBeVisible();
  });

  test('explains the 400 when no category carries seed keywords', async ({ page }) => {
    await page.route(`${API}/discover*`, (route) =>
      route.fulfill(
        json(
          {
            statusCode: 400,
            message:
              'No seed keywords configured. Add keywords to at least one category before running discovery.',
          },
          400,
        ),
      ),
    );

    await page.goto('/market');
    await page.getByRole('button', { name: 'Discover New Topics' }).click();

    await expect(page.getByText(/No seed keywords configured/)).toBeVisible();
  });

  test('blocks discovery until a category and a style exist', async ({ page }) => {
    await page.route(`${API}/categories`, (route) => route.fulfill(json([])));
    await page.route(`${API}/styles`, (route) => route.fulfill(json([])));

    await page.goto('/market');
    await page.getByRole('button', { name: 'Discover New Topics' }).click();

    await expect(
      page.getByText(/add at least one Category and one Style/i),
    ).toBeVisible();
  });

  test('renders real GDELT metrics on the topic row', async ({ page }) => {
    await page.goto('/market');

    // Walk up from the title to the row container that also holds the score badge.
    const row = page
      .locator('h4', { hasText: TOPICS[0].title })
      .locator('xpath=ancestor::div[contains(@class,"p-5")][1]');

    await expect(row).toContainText('Trend: 58%');
    await expect(row).toContainText('Demand: 79%');
    await expect(row).toContainText('Volume: 47');
    await expect(row).toContainText('Competition: 21%');
    await expect(row).toContainText('63.1');
  });
});

/**
 * Live smoke test against the real stack. Needs the API, Postgres and network
 * access to GDELT. Enable with:
 *
 *   MARKET_LIVE=1 pnpm test:web
 *
 * Allow a generous timeout — a full run is ~3 GDELT requests per keyword.
 */
test.describe('Market panel — live stack', () => {
  test.skip(!process.env.MARKET_LIVE, 'Set MARKET_LIVE=1 to run against the real API.');
  test.setTimeout(5 * 60 * 1000);

  test('runs a real discovery end to end', async ({ page }) => {
    await page.goto('/market');

    // The seed script must have run, so at least one keyword chip is present.
    await expect(page.locator('text=/sustainable packaging/i').first()).toBeVisible();

    await page.getByRole('button', { name: 'Discover New Topics' }).click();

    await expect(page.getByText(/Scored \d+ keyword\(s\)/)).toBeVisible({
      timeout: 4 * 60 * 1000,
    });
  });
});
