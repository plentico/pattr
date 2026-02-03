import { test, expect } from '@playwright/test';

test.describe('p-html directive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders HTML content', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1.locator('strong')).toBeVisible();
    await expect(h1.locator('em')).toHaveText('Pattr');
  });

  test('allow modifier filters tags', async ({ page }) => {
    const h1 = page.locator('h1');
    // iframe should be filtered out
    await expect(h1.locator('iframe')).not.toBeVisible();
    const iframeCount = await h1.locator('iframe').count();
    expect(iframeCount).toBe(0);
  });

  test('trim modifier limits text length while preserving HTML', async ({ page }) => {
    const h1 = page.locator('h1');
    const text = await h1.innerText();
    // Should be truncated with "..."
    expect(text.length).toBeLessThanOrEqual(21); // 18 + "..."
    expect(text).toContain('...');
  });
});
