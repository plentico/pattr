import { test, expect } from '@playwright/test';

test.describe('p-attr directive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('sets single attribute with modifier syntax', async ({ page }) => {
    // p-attr:number="count * 3" -> 2 * 3 = 6
    const parentDiv = page.locator('[p-attr\\:number]');
    await expect(parentDiv).toHaveAttribute('number', '6');
  });

  test('sets multiple attributes with object syntax', async ({ page }) => {
    // p-attr="{'data-name': name + 'woah'}" -> "Bobwoah"
    const parentDiv = page.locator('[p-attr]').first();
    await expect(parentDiv).toHaveAttribute('data-name', 'Bobwoah');
  });

  test('updates attributes when value changes', async ({ page }) => {
    const nameInput = page.locator('input[p-model="name"]').first();
    const parentDiv = page.locator('[p-attr]').first();
    
    await nameInput.fill('Test');
    await expect(parentDiv).toHaveAttribute('data-name', 'Testwoah');
  });

  test('updates computed attribute when source changes', async ({ page }) => {
    const parentPlusButton = page.locator('body > button').first();
    const parentDiv = page.locator('[p-attr\\:number]');
    
    // Initial: count * 3 = 2 * 3 = 6
    await expect(parentDiv).toHaveAttribute('number', '6');
    
    // Click + to make count = 3, so 3 * 3 = 9
    await parentPlusButton.click();
    await expect(parentDiv).toHaveAttribute('number', '9');
  });

  test('computed attribute updates with expressions', async ({ page }) => {
    const parentDiv = page.locator('[p-attr\\:number]');
    const plusButton = page.locator('body > button').first();
    const minusButton = page.locator('body > button:has-text("-")').first();

    // Initial: count * 3 = 2 * 3 = 6
    await expect(parentDiv).toHaveAttribute('number', '6');

    // Increment to 3, then 3 * 3 = 9
    await plusButton.click();
    await expect(parentDiv).toHaveAttribute('number', '9');

    // Decrement to 2, then 2 * 3 = 6
    await minusButton.click();
    await expect(parentDiv).toHaveAttribute('number', '6');

    // Decrement to 1, then 1 * 3 = 3
    await minusButton.click();
    await expect(parentDiv).toHaveAttribute('number', '3');
  });

  test('object attribute syntax updates correctly', async ({ page }) => {
    const parentDiv = page.locator('[p-attr]').first();
    const nameInput = page.locator('input[p-model="name"]').first();

    // Initial
    await expect(parentDiv).toHaveAttribute('data-name', 'Bobwoah');

    // Change name
    await nameInput.fill('Jim');
    await expect(parentDiv).toHaveAttribute('data-name', 'Jimwoah');
  });

  test('multiple directives on same element work together', async ({ page }) => {
    // The div has both p-attr and p-attr:number
    const parentDiv = page.locator('[p-attr\\:number]');

    await expect(parentDiv).toHaveAttribute('data-name', 'Bobwoah');
    await expect(parentDiv).toHaveAttribute('number', '6');
  });
});
