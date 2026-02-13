import { test, expect } from '@playwright/test';

test.describe('p-model array support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Show the cats list (it's hidden by default)
    await page.locator('button:has-text("Show cats")').click();
  });

  test('displays array as comma-separated values', async ({ page }) => {
    // cats = ['Ralph', 'Betsy', 'Drago']
    const arrayInput = page.locator('input[p-model="cats"]');
    
    // Should display as "Ralph, Betsy, Drago"
    await expect(arrayInput).toHaveValue('Ralph, Betsy, Drago');
  });

  test('updates array when typing comma-separated values', async ({ page }) => {
    const arrayInput = page.locator('input[p-model="cats"]');
    
    // Type new values
    await arrayInput.fill('Whiskers, Mittens, Felix');
    
    // Check that the first cat in the list updated (p-text="cat" in the loop)
    const firstCat = page.locator('.cats-list div[p-for-key$=":0"]').locator('div').first();
    await expect(firstCat).toHaveText('Whiskers');
  });

  test('trims whitespace from array items', async ({ page }) => {
    const arrayInput = page.locator('input[p-model="cats"]');
    
    // Type values with extra spaces
    await arrayInput.fill('  Cat1  ,  Cat2  ,  Cat3  ');
    
    // Check first cat (should be trimmed)
    const firstCat = page.locator('.cats-list div[p-for-key$=":0"]').locator('div').first();
    await expect(firstCat).toHaveText('Cat1');
  });

  test('filters out empty strings from trailing commas', async ({ page }) => {
    const arrayInput = page.locator('input[p-model="cats"]');
    
    // Type with trailing comma
    await arrayInput.fill('Cat1, Cat2,');
    
    // The trailing comma creates an empty string that gets filtered
    // Check that we still have 2 cats (not 3)
    const catRows = page.locator('.cats-list > div').filter({ has: page.locator('button') });
    await expect(catRows).toHaveCount(2);
  });

  test('handles single item array', async ({ page }) => {
    const arrayInput = page.locator('input[p-model="cats"]');
    
    await arrayInput.fill('SoloCat');
    
    // Should only show one cat
    const catRows = page.locator('.cats-list > div').filter({ has: page.locator('button') });
    await expect(catRows).toHaveCount(1);
  });
});
