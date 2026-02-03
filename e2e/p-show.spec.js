import { test, expect } from '@playwright/test';

test.describe('p-show directive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows element when condition is true', async ({ page }) => {
    // count = 2, so "Greater than 2" should be hidden, "Less than 2" should be hidden
    const greaterThan = page.locator('span:has-text("Greater than 2")');
    const lessThan = page.locator('span:has-text("Less than 2")');
    
    await expect(greaterThan).toHaveCSS('display', 'none');
    await expect(lessThan).toHaveCSS('display', 'none');
  });

  test('hides element when condition is false', async ({ page }) => {
    const parentPlusButton = page.locator('body > button').first();
    
    // Click + to make count = 3
    await parentPlusButton.click();
    
    const greaterThan = page.locator('span:has-text("Greater than 2")');
    await expect(greaterThan).toHaveCSS('display', 'inline');
  });

  test('toggles visibility dynamically', async ({ page }) => {
    const parentPlusButton = page.locator('body > button').first();
    const parentMinusButton = page.locator('body > button:has-text("-")').first();
    const greaterThan = page.locator('span:has-text("Greater than 2")');
    
    // Initial: count = 2, greater than hidden
    await expect(greaterThan).toHaveCSS('display', 'none');
    
    // Click + to make count = 3
    await parentPlusButton.click();
    await expect(greaterThan).toHaveCSS('display', 'inline');
    
    // Click - twice to make count = 1
    await parentMinusButton.click();
    await parentMinusButton.click();
    await expect(greaterThan).toHaveCSS('display', 'none');
    
    // "Less than 2" should now be visible
    const lessThan = page.locator('span:has-text("Less than 2")');
    await expect(lessThan).toHaveCSS('display', 'inline');
  });

  test('negation expression works', async ({ page }) => {
    const toggleButton = page.locator('button:has(span[p-show])');
    const showSpan = toggleButton.locator('span[p-show="!show_cats"]');
    const hideSpan = toggleButton.locator('span[p-show="show_cats"]');

    // Initial: show_cats = false
    await expect(showSpan).toHaveCSS('display', 'inline');
    await expect(hideSpan).toHaveCSS('display', 'none');

    // Toggle
    await toggleButton.click();
    await expect(showSpan).toHaveCSS('display', 'none');
    await expect(hideSpan).toHaveCSS('display', 'inline');
  });

  test('comparison expression with boundary values', async ({ page }) => {
    const plusButton = page.locator('body > button').first();
    const minusButton = page.locator('body > button:has-text("-")').first();
    const greaterThan = page.locator('span:has-text("Greater than 2")');
    const lessThan = page.locator('span:has-text("Less than 2")');

    // Initial: count = 2 (neither > 2 nor < 2)
    await expect(greaterThan).toHaveCSS('display', 'none');
    await expect(lessThan).toHaveCSS('display', 'none');

    // count = 3 (> 2)
    await plusButton.click();
    await expect(greaterThan).toHaveCSS('display', 'inline');
    await expect(lessThan).toHaveCSS('display', 'none');

    // count = 2 again
    await minusButton.click();
    await expect(greaterThan).toHaveCSS('display', 'none');
    await expect(lessThan).toHaveCSS('display', 'none');

    // count = 1 (< 2)
    await minusButton.click();
    await expect(greaterThan).toHaveCSS('display', 'none');
    await expect(lessThan).toHaveCSS('display', 'inline');

    // count = 0 (still < 2)
    await minusButton.click();
    await expect(lessThan).toHaveCSS('display', 'inline');
  });
});
