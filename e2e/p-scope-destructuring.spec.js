import { test, expect } from '@playwright/test';

test.describe('p-scope array destructuring', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('array destructuring in p-scope works correctly', async ({ page }) => {
    // The p-scope has: [one, two, three] = ['destructuring', 'arrays', 'test']
    const container = page.locator('div[p-scope*="[one, two, three]"]');
    const spans = container.locator('span');

    // Check that all three values are correctly destructured
    await expect(spans.nth(0)).toHaveText('destructuring');
    await expect(spans.nth(1)).toHaveText('arrays');
    await expect(spans.nth(2)).toHaveText('test');
  });

  test('array destructuring creates independent variables', async ({ page }) => {
    // Verify that the destructured variables are accessible individually
    const container = page.locator('div[p-scope*="[one, two, three]"]');
    
    // Each span should display its own value
    const oneSpan = container.locator('span[p-text="one"]');
    const twoSpan = container.locator('span[p-text="two"]');
    const threeSpan = container.locator('span[p-text="three"]');

    await expect(oneSpan).toHaveText('destructuring');
    await expect(twoSpan).toHaveText('arrays');
    await expect(threeSpan).toHaveText('test');
  });

  test('array destructuring with correct count of variables', async ({ page }) => {
    // Verify we have exactly 3 spans rendered
    const container = page.locator('div[p-scope*="[one, two, three]"]');
    const spans = container.locator('span');
    
    await expect(spans).toHaveCount(3);
  });
});
