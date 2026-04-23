import { test, expect } from '@playwright/test';

test.describe('p-model checkbox directive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('checkbox initial unchecked state from false boolean', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"][p-model="show_cats"]').first();
    await expect(checkbox).not.toBeChecked();
  });

  test('checkbox toggles on and updates display', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"][p-model="show_cats"]').first();
    const catList = page.locator('.cats-list');

    // Initially unchecked (show_cats = false from p-scope)
    await expect(checkbox).not.toBeChecked();

    // Check it
    await checkbox.check();

    // The cats list should be visible (max-height: 300px)
    await expect(catList).toHaveCSS('max-height', '300px');
  });

  test('checkbox toggles off and updates display', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"][p-model="show_cats"]').first();
    const catList = page.locator('.cats-list');

    // Check first
    await checkbox.check();
    await expect(checkbox).toBeChecked();

    // Uncheck it
    await checkbox.uncheck();

    // The cats list should be hidden (max-height: 0)
    await expect(catList).toHaveCSS('max-height', '0px');
  });
});
