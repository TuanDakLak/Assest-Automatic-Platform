import { test, expect } from '@playwright/test';

test('has title and landing page content', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/AI Asset Factory/);
  await expect(page.locator('h1')).toContainText('AI Asset Factory');
});
