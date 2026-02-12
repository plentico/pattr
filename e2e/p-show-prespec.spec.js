import { test, expect } from '@playwright/test';

test.describe('p-show.pre-scope modifier', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('pre-scope is visible when parent condition is true', async ({ page }) => {
    // Initially count is 2, so p-show:pre-scope="count < 4" should be visible
    const preScopeBox = page.locator('#pre-scope-box');
    
    // Box should be visible initially (count = 2, which is < 4)
    await expect(preScopeBox).toBeVisible();
    await expect(preScopeBox).toContainText('Only show when parent count < 4');
    // Inside scope, count is doubled (2 * 2 = 4)
    await expect(preScopeBox).toContainText('Inside scope (doubled) count = 4');
  });

  test('pre-scope hides when parent count exceeds threshold', async ({ page }) => {
    const preScopeBox = page.locator('#pre-scope-box');
    const countInput = page.locator('input[type="number"]').first();
    
    // Set count to 5 - box should be hidden (5 is not < 4)
    await countInput.fill('5');
    await expect(preScopeBox).toBeHidden();
  });

  test('pre-scope shows when parent count drops below threshold', async ({ page }) => {
    const preScopeBox = page.locator('#pre-scope-box');
    const countInput = page.locator('input[type="number"]').first();
    
    // First make it hidden
    await countInput.fill('5');
    await expect(preScopeBox).toBeHidden();
    
    // Then show it again (count = 3, which is < 4)
    await countInput.fill('3');
    await expect(preScopeBox).toBeVisible();
    await expect(preScopeBox).toContainText('Only show when parent count < 4');
    // Inside scope, count is doubled (3 * 2 = 6)
    await expect(preScopeBox).toContainText('Inside scope (doubled) count = 6');
  });
});
