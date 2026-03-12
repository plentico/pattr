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

  test('allow modifier preserves nested allowed tags when parent is disallowed', async ({ page }) => {
    // This tests the fix for: when only <strong> is allowed but content is <em>some<strong>thing</strong></em>,
    // the <strong> tag should still be preserved after filtering out the <em> tag
    const firstSpan = page.locator('span.allow-strong');
    // Should contain a strong tag around "thi..."
    await expect(firstSpan.locator('strong')).toBeVisible();
    const strongText = await firstSpan.locator('strong').innerText();
    expect(strongText).toBe('thi...');
    // The full text should be "somethi..."
    const fullText = await firstSpan.innerText();
    expect(fullText).toBe('somethi...');
  });

  test('allow modifier with multiple tags preserves all allowed tags', async ({ page }) => {
    // When both em and strong are allowed, both should be preserved
    const secondSpan = page.locator('span.allow-strong-and-em');
    await expect(secondSpan.locator('em')).toBeVisible();
    await expect(secondSpan.locator('em strong')).toBeVisible();
    const strongText = await secondSpan.locator('em strong').innerText();
    expect(strongText).toBe('thi...');
  });
});
