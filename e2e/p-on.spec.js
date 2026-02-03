import { test, expect } from '@playwright/test';

test.describe('p-on directive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('click event increments value', async ({ page }) => {
    const parentPlusButton = page.locator('body > button').first();
    const countInput = page.locator('input[type="number"][p-model="count"]');
    
    await expect(countInput).toHaveValue('2');
    await parentPlusButton.click();
    await expect(countInput).toHaveValue('3');
    await parentPlusButton.click();
    await expect(countInput).toHaveValue('4');
  });

  test('click event decrements value', async ({ page }) => {
    const parentMinusButton = page.locator('body > button:has-text("-")').first();
    const countInput = page.locator('input[type="number"][p-model="count"]');
    
    await expect(countInput).toHaveValue('2');
    await parentMinusButton.click();
    await expect(countInput).toHaveValue('1');
  });

  test('focus event triggers', async ({ page }) => {
    const nameInput = page.locator('input[p-model="name"]').first();
    const emoji = page.locator('span[p-show="emoji"]');
    
    // Initially hidden
    await expect(emoji).toHaveCSS('display', 'none');
    
    // Focus shows emoji
    await nameInput.focus();
    await expect(emoji).toHaveCSS('display', 'inline');
  });

  test('blur event triggers', async ({ page }) => {
    const nameInput = page.locator('input[p-model="name"]').first();
    const emoji = page.locator('span[p-show="emoji"]');
    
    // Focus shows emoji
    await nameInput.focus();
    await expect(emoji).toHaveCSS('display', 'inline');
    
    // Blur hides emoji
    await nameInput.blur();
    await expect(emoji).toHaveCSS('display', 'none');
  });

  test('toggle event works', async ({ page }) => {
    const toggleButton = page.locator('button:has(span[p-show])');
    const showSpan = toggleButton.locator('span:has-text("Show cats")');
    const hideSpan = toggleButton.locator('span:has-text("Hide cats")');
    
    // Initial state
    await expect(showSpan).toHaveCSS('display', 'inline');
    await expect(hideSpan).toHaveCSS('display', 'none');
    
    // Toggle
    await toggleButton.click();
    await expect(showSpan).toHaveCSS('display', 'none');
    await expect(hideSpan).toHaveCSS('display', 'inline');
  });

  test('p-model and p-on work together', async ({ page }) => {
    const nameInput = page.locator('input[p-model="name"]').first();
    const emoji = page.locator('span[p-show="emoji"]');

    // Input has both p-model and p-on:focus/blur
    await expect(emoji).toHaveCSS('display', 'none');

    await nameInput.focus();
    await expect(emoji).toHaveCSS('display', 'inline');

    // Type something (p-model should still work)
    await nameInput.fill('NewName');
    const coolname = page.locator('[p-text="coolname"]');
    await expect(coolname).toHaveText('NewNamecool');

    // Blur to hide emoji
    await nameInput.blur();
    await expect(emoji).toHaveCSS('display', 'none');
  });
});
