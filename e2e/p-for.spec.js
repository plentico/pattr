import { test, expect } from '@playwright/test';

test.describe('p-for directive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // Helper to get elements by their loop index (handles scoped keys like "s0:0", "s0:1", etc.)
  const getByLoopIndex = (container, index) => {
    // Match keys that end with ":index" (scoped format like "s0:0") 
    // or are exactly the index (legacy format like "0")
    return container.locator(`div[p-for-key$=":${index}"], div[p-for-key="${index}"]`).first();
  };

  test('renders initial items from template', async ({ page }) => {
    // Show the cats list first
    const toggleButton = page.locator('button:has(span[p-show])');
    await toggleButton.click();

    // Check initial cats are rendered
    const catsList = page.locator('.cats-list');
    await expect(getByLoopIndex(catsList, 0)).toContainText('Ralph');
    await expect(getByLoopIndex(catsList, 1)).toContainText('Betsy');
    await expect(getByLoopIndex(catsList, 2)).toContainText('Drago');
  });

  test('show/hide toggle works', async ({ page }) => {
    const toggleButton = page.locator('button:has(span[p-show])');
    const showSpan = toggleButton.locator('span:has-text("Show cats")');
    const hideSpan = toggleButton.locator('span:has-text("Hide cats")');
    const catsList = page.locator('.cats-list');

    // Initially hidden (max-height: 0)
    await expect(showSpan).toHaveCSS('display', 'inline');
    await expect(hideSpan).toHaveCSS('display', 'none');
    await expect(catsList).toHaveCSS('max-height', '0px');

    // Click to show cats
    await toggleButton.click();
    await expect(showSpan).toHaveCSS('display', 'none');
    await expect(hideSpan).toHaveCSS('display', 'inline');
    await expect(catsList).toHaveCSS('max-height', '300px');

    // Click to hide cats again
    await toggleButton.click();
    await expect(showSpan).toHaveCSS('display', 'inline');
    await expect(hideSpan).toHaveCSS('display', 'none');
    await expect(catsList).toHaveCSS('max-height', '0px');
  });

  test('remove a cat works', async ({ page }) => {
    const toggleButton = page.locator('button:has(span[p-show])');
    const catsList = page.locator('.cats-list');

    // Show cats
    await toggleButton.click();

    // Verify initial cats
    await expect(getByLoopIndex(catsList, 0)).toContainText('Ralph');
    await expect(getByLoopIndex(catsList, 1)).toContainText('Betsy');
    await expect(getByLoopIndex(catsList, 2)).toContainText('Drago');

    // Remove Betsy (click X button in her row)
    const betsyRow = getByLoopIndex(catsList, 1);
    await betsyRow.locator('button:has-text("X")').click();

    // Verify Betsy is removed - now should have Ralph, Drago
    await expect(getByLoopIndex(catsList, 0)).toContainText('Ralph');
    await expect(getByLoopIndex(catsList, 1)).toContainText('Drago');
    // Third element should not exist anymore
    await expect(catsList.locator('div[p-for-key$=":2"], div[p-for-key="2"]')).toHaveCount(0);
  });

  test('add a cat works', async ({ page }) => {
    const toggleButton = page.locator('button:has(span[p-show])');
    const catsList = page.locator('.cats-list');
    const addCatInput = page.locator('input[placeholder="Cat name"]');
    const addCatButton = page.locator('button:has-text("Add Cat")');

    // Show cats
    await toggleButton.click();

    // Verify initial 3 cats
    await expect(getByLoopIndex(catsList, 2)).toContainText('Drago');
    // Fourth element should not exist yet
    await expect(catsList.locator('div[p-for-key$=":3"], div[p-for-key="3"]')).toHaveCount(0);

    // Add a new cat named "Whiskers"
    await addCatInput.fill('Whiskers');
    await addCatButton.click();

    // Verify new cat is added
    await expect(getByLoopIndex(catsList, 3)).toContainText('Whiskers');

    // Input should be cleared
    await expect(addCatInput).toHaveValue('');
  });

  test('modify cat name with ! button', async ({ page }) => {
    const toggleButton = page.locator('button:has(span[p-show])');
    const catsList = page.locator('.cats-list');

    // Show cats
    await toggleButton.click();

    // Click ! on Ralph
    const ralphRow = getByLoopIndex(catsList, 0);
    await ralphRow.locator('button:has-text("!")').click();

    // Ralph should now be Ralph!
    await expect(getByLoopIndex(catsList, 0)).toContainText('Ralph!');
  });

  test('duplicate character button works', async ({ page }) => {
    const toggleButton = page.locator('button:has(span[p-show])');
    await toggleButton.click();

    const catsList = page.locator('.cats-list');
    const ralphRow = getByLoopIndex(catsList, 0);
    
    // Click + to duplicate last character
    await ralphRow.locator('button:has-text("+")').click();
    await expect(getByLoopIndex(catsList, 0)).toContainText('Ralphh');
    
    await ralphRow.locator('button:has-text("+")').click();
    await expect(getByLoopIndex(catsList, 0)).toContainText('Ralphhh');
  });

  test('remove character button works', async ({ page }) => {
    const toggleButton = page.locator('button:has(span[p-show])');
    await toggleButton.click();

    const catsList = page.locator('.cats-list');
    const ralphRow = getByLoopIndex(catsList, 0);
    
    // Click - to remove last character
    await ralphRow.locator('button:has-text("-")').click();
    await expect(getByLoopIndex(catsList, 0)).toContainText('Ralp');
    
    await ralphRow.locator('button:has-text("-")').click();
    await expect(getByLoopIndex(catsList, 0)).toContainText('Ral');
  });

  test('nested p-for renders letter buttons for each cat', async ({ page }) => {
    const toggleButton = page.locator('button:has(span[p-show])');
    await toggleButton.click();

    const catsList = page.locator('.cats-list');
    
    // Check that Ralph's letters are rendered as buttons (R, a, l, p, h)
    // The nested loop should render 5 letter buttons after Ralph's row
    const letterButtons = catsList.locator('button[p-text="l"]');
    
    // There should be letter buttons for each cat (Ralph=5, Betsy=5, Drago=5 = 15 total)
    await expect(letterButtons).toHaveCount(15);
    
    // Check first cat's first letter button text
    await expect(letterButtons.nth(0)).toHaveText('R');
    await expect(letterButtons.nth(1)).toHaveText('a');
    await expect(letterButtons.nth(2)).toHaveText('l');
    await expect(letterButtons.nth(3)).toHaveText('p');
    await expect(letterButtons.nth(4)).toHaveText('h');
    
    // Check second cat's letter buttons
    await expect(letterButtons.nth(5)).toHaveText('B');
    await expect(letterButtons.nth(6)).toHaveText('e');
    await expect(letterButtons.nth(7)).toHaveText('t');
    await expect(letterButtons.nth(8)).toHaveText('s');
    await expect(letterButtons.nth(9)).toHaveText('y');
  });

  test('nested p-for click adds letter to cat name', async ({ page }) => {
    const toggleButton = page.locator('button:has(span[p-show])');
    await toggleButton.click();

    const catsList = page.locator('.cats-list');
    
    // Click the first letter button (R) to add 'R' to Ralph
    const letterButtons = catsList.locator('button[p-text="l"]');
    await letterButtons.nth(0).click();
    
    // Ralph should now be RalphR
    await expect(getByLoopIndex(catsList, 0)).toContainText('RalphR');
    
    // Click 'h' button to add 'h' to Ralph
    // After the name change, letter buttons are re-rendered
    const updatedLetterButtons = catsList.locator('button[p-text="l"]');
    // Find the 'h' button (should be at position 4 of the first cat, which now has 6 letters)
    // Actually, we need to find the button with text 'h' in the first cat's buttons
    // The first 6 buttons belong to RalphR now
    await updatedLetterButtons.nth(4).click(); // This is 'h' from RalphR
    
    // Ralph should now be RalphRh
    await expect(getByLoopIndex(catsList, 0)).toContainText('RalphRh');
  });
});
