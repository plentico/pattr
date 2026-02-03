import { test, expect } from '@playwright/test';

test.describe('p-text directive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays text from expression', async ({ page }) => {
    // coolname = name + 'cool' = 'Bobcool'
    await expect(page.locator('[p-text="coolname"]')).toHaveText('Bobcool');
  });

  test('updates when bound value changes', async ({ page }) => {
    const nameInput = page.locator('input[p-model="name"]').first();
    await nameInput.fill('Test');
    await expect(page.locator('[p-text="coolname"]')).toHaveText('Testcool');
  });

  test('supports template literals', async ({ page }) => {
    const textElement = page.locator('[p-text\\:trim\\.25="`${name} can count to: ${count}`"]');
    await expect(textElement).toContainText('Bob can count to: 2');
  });

  test('trim modifier truncates text', async ({ page }) => {
    const trimmedText = page.locator('[p-text\\:trim\\.25]');
    const text = await trimmedText.innerText();
    expect(text.length).toBeLessThanOrEqual(28); // 25 + "..."
  });

  test('updates template literal when variables change', async ({ page }) => {
    const textElement = page.locator('[p-text\\:trim\\.25="`${name} can count to: ${count}`"]');
    const nameInput = page.locator('input[p-model="name"]').first();
    const plusButton = page.locator('body > button').first();

    await expect(textElement).toContainText('Bob can count to: 2');

    await nameInput.fill('Jo');
    await expect(textElement).toContainText('Jo can count to: 2');

    await plusButton.click();
    await expect(textElement).toContainText('Jo can count to: 3');
  });

  test('nested scope template literals update correctly', async ({ page }) => {
    const childSection = page.locator('section[p-id="ek753"]');
    const childText = childSection.locator('[p-text]').first();
    const childInput = childSection.locator('> input[p-model="name"]');

    await expect(childText).toContainText('Bobo');

    await childInput.fill('Charlie');
    await expect(childText).toContainText('Charlie');
  });
});
