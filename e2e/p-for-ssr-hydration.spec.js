import { test, expect } from '@playwright/test';

test.describe('p-for SSR hydration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should not duplicate p-for entries when using .entries()', async ({ page }) => {
    // Cats list uses: p-for="[i, cat] of cats.entries()"
    const catsList = page.locator('.cats-list');
    
    // Show cats
    await page.click('button:has-text("Show cats")');
    
    // Count divs with p-for-key (excluding the old SSR divs that should be removed)
    const catDivs = catsList.locator('div[p-for-key]');
    
    // Should have 3 cats (Ralph, Betsy, Drago), not 6
    await expect(catDivs).toHaveCount(3);
    
    // Verify no duplicate content
    const allText = await catDivs.allTextContents();
    const uniqueText = [...new Set(allText)];
    expect(allText.length).toBe(uniqueText.length);
  });

  test('should maintain unique p-for-key values', async ({ page }) => {
    // Show cats to ensure all loops are active
    await page.click('button:has-text("Show cats")');

    // Check uniqueness within the cats list, which uses a single-root-child template
    // (one <div> per iteration), so each iteration gets its own unique p-for-key.
    //
    // Note: templates with multiple root children (e.g. the unsynced-scope loop that
    // renders a <div> AND an <input> per iteration) intentionally assign the same
    // p-for-key to sibling elements within the same iteration — they are not duplicates
    // in the error sense.  We therefore scope this check to the cats-list, where
    // sibling-key sharing does not occur.
    const forKeyElements = page.locator('.cats-list > [p-for-key]');
    const count = await forKeyElements.count();

    // Extract all keys
    const keys = [];
    for (let i = 0; i < count; i++) {
      const key = await forKeyElements.nth(i).getAttribute('p-for-key');
      keys.push(key);
    }

    // All keys within the cats list should be unique
    const uniqueKeys = [...new Set(keys)];
    expect(keys.length).toBe(uniqueKeys.length);
  });

  test('should hydrate and make SSR elements reactive', async ({ page }) => {
    const catsList = page.locator('.cats-list');
    
    // Show cats
    await page.click('button:has-text("Show cats")');
    
    // Get the first cat div
    const firstCatDiv = catsList.locator('div[p-for-key]').first();
    await expect(firstCatDiv).toContainText('Ralph');
    
    // Click the "!" button to modify the first cat
    const exclamButton = firstCatDiv.locator('button:has-text("!")');
    await exclamButton.click();
    
    // The cat name should be updated to "Ralph!"
    await expect(firstCatDiv).toContainText('Ralph!');
  });

  test('should properly handle adding new items to SSR-hydrated list', async ({ page }) => {
    const catsList = page.locator('.cats-list');
    
    // Show cats
    await page.click('button:has-text("Show cats")');
    
    // Initial count
    const initialCats = catsList.locator('div[p-for-key]');
    const initialCount = await initialCats.count();
    
    // Add a new cat
    await page.fill('input[placeholder="Cat name"]', 'NewCat');
    await page.click('button:has-text("Add Cat")');
    
    // Should have one more cat
    const finalCats = catsList.locator('div[p-for-key]');
    await expect(finalCats).toHaveCount(initialCount + 1);
    
    // New cat should be at the end
    const lastCat = finalCats.last();
    await expect(lastCat).toContainText('NewCat');
  });

  test('should properly handle removing items from SSR-hydrated list', async ({ page }) => {
    const catsList = page.locator('.cats-list');
    
    // Show cats
    await page.click('button:has-text("Show cats")');
    
    // Initial count
    const initialCats = catsList.locator('div[p-for-key]');
    const initialCount = await initialCats.count();
    
    // Remove first cat (Ralph)
    const firstCat = initialCats.first();
    await firstCat.locator('button:has-text("X")').click();
    
    // Should have one fewer cat
    const finalCats = catsList.locator('div[p-for-key]');
    await expect(finalCats).toHaveCount(initialCount - 1);
    
    // Ralph should be gone, Betsy should now be first
    await expect(finalCats.first()).toContainText('Betsy');
  });
});
