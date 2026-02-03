import { test, expect } from '@playwright/test';

test.describe('p-for directive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders initial items from template', async ({ page }) => {
    // Show the cats list first
    const toggleButton = page.locator('button:has(span[p-show])');
    await toggleButton.click();

    // Check initial cats are rendered
    const catsList = page.locator('.cats-list');
    await expect(catsList.locator('[p-for-key="0"]')).toContainText('Ralph');
    await expect(catsList.locator('[p-for-key="1"]')).toContainText('Betsy');
    await expect(catsList.locator('[p-for-key="2"]')).toContainText('Drago');
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
    await expect(catsList.locator('[p-for-key="0"]')).toContainText('Ralph');
    await expect(catsList.locator('[p-for-key="1"]')).toContainText('Betsy');
    await expect(catsList.locator('[p-for-key="2"]')).toContainText('Drago');

    // Remove Betsy (click X button in her row)
    const betsyRow = catsList.locator('[p-for-key="1"]');
    await betsyRow.locator('button:has-text("X")').click();

    // Verify Betsy is removed - now should have Ralph, Drago
    await expect(catsList.locator('[p-for-key="0"]')).toContainText('Ralph');
    await expect(catsList.locator('[p-for-key="1"]')).toContainText('Drago');
    await expect(catsList.locator('[p-for-key="2"]')).not.toBeVisible();
  });

  test('add a cat works', async ({ page }) => {
    const toggleButton = page.locator('button:has(span[p-show])');
    const catsList = page.locator('.cats-list');
    const addCatInput = page.locator('input[placeholder="Cat name"]');
    const addCatButton = page.locator('button:has-text("Add Cat")');

    // Show cats
    await toggleButton.click();

    // Verify initial 3 cats
    await expect(catsList.locator('[p-for-key="2"]')).toContainText('Drago');
    await expect(catsList.locator('[p-for-key="3"]')).not.toBeVisible();

    // Add a new cat named "Whiskers"
    await addCatInput.fill('Whiskers');
    await addCatButton.click();

    // Verify new cat is added
    await expect(catsList.locator('[p-for-key="3"]')).toContainText('Whiskers');

    // Input should be cleared
    await expect(addCatInput).toHaveValue('');
  });

  test('modify cat name with ! button', async ({ page }) => {
    const toggleButton = page.locator('button:has(span[p-show])');
    const catsList = page.locator('.cats-list');

    // Show cats
    await toggleButton.click();

    // Click ! on Ralph
    const ralphRow = catsList.locator('[p-for-key="0"]');
    await ralphRow.locator('button:has-text("!")').click();

    // Ralph should now be Ralph!
    await expect(catsList.locator('[p-for-key="0"]')).toContainText('Ralph!');
  });

  test('duplicate character button works', async ({ page }) => {
    const toggleButton = page.locator('button:has(span[p-show])');
    await toggleButton.click();

    const catsList = page.locator('.cats-list');
    const ralphRow = catsList.locator('[p-for-key="0"]');
    
    // Click + to duplicate last character
    await ralphRow.locator('button:has-text("+")').click();
    await expect(catsList.locator('[p-for-key="0"]')).toContainText('Ralphh');
    
    await ralphRow.locator('button:has-text("+")').click();
    await expect(catsList.locator('[p-for-key="0"]')).toContainText('Ralphhh');
  });

  test('remove character button works', async ({ page }) => {
    const toggleButton = page.locator('button:has(span[p-show])');
    await toggleButton.click();

    const catsList = page.locator('.cats-list');
    const ralphRow = catsList.locator('[p-for-key="0"]');
    
    // Click - to remove last character
    await ralphRow.locator('button:has-text("-")').click();
    await expect(catsList.locator('[p-for-key="0"]')).toContainText('Ralp');
    
    await ralphRow.locator('button:has-text("-")').click();
    await expect(catsList.locator('[p-for-key="0"]')).toContainText('Ral');
  });
});
