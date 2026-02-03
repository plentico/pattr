import { test, expect } from '@playwright/test';

test.describe('p-style directive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('applies conditional styles', async ({ page }) => {
    const catsList = page.locator('.cats-list');
    
    // Initially hidden
    await expect(catsList).toHaveCSS('max-height', '0px');
    
    // Show cats
    const toggleButton = page.locator('button:has(span[p-show])');
    await toggleButton.click();
    
    // Now visible
    await expect(catsList).toHaveCSS('max-height', '300px');
  });

  test('updates styles dynamically', async ({ page }) => {
    const catsList = page.locator('.cats-list');
    const toggleButton = page.locator('button:has(span[p-show])');
    
    // Toggle show/hide multiple times
    await toggleButton.click();
    await expect(catsList).toHaveCSS('max-height', '300px');
    
    await toggleButton.click();
    await expect(catsList).toHaveCSS('max-height', '0px');
    
    await toggleButton.click();
    await expect(catsList).toHaveCSS('max-height', '300px');
  });
});
