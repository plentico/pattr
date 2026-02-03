import { test, expect } from '@playwright/test';

test.describe('p-model directive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('binds text input value', async ({ page }) => {
    const nameInput = page.locator('input[p-model="name"]').first();
    
    // Initial value
    await expect(nameInput).toHaveValue('Bob');
  });

  test('binds number input value', async ({ page }) => {
    const countInput = page.locator('input[type="number"][p-model="count"]');
    
    // Initial value
    await expect(countInput).toHaveValue('2');
  });

  test('two-way binding updates display', async ({ page }) => {
    const nameInput = page.locator('input[p-model="name"]').first();
    const coolnameDisplay = page.locator('[p-text="coolname"]');
    
    await nameInput.fill('Alice');
    await expect(coolnameDisplay).toHaveText('Alicecool');
  });

  test('number input updates computed values', async ({ page }) => {
    const countInput = page.locator('input[type="number"][p-model="count"]');
    const parentDiv = page.locator('[p-attr\\:number]');
    
    // Change count to 5
    await countInput.fill('5');
    
    // count * 3 = 5 * 3 = 15
    await expect(parentDiv).toHaveAttribute('number', '15');
  });

  test('typing updates bound elements in real-time', async ({ page }) => {
    const nameInput = page.locator('input[p-model="name"]').first();
    const coolnameDisplay = page.locator('[p-text="coolname"]');
    
    // Clear and type character by character
    await nameInput.fill('');
    await nameInput.type('J');
    await expect(coolnameDisplay).toHaveText('Jcool');
    
    await nameInput.type('o');
    await expect(coolnameDisplay).toHaveText('Jocool');
    
    await nameInput.type('e');
    await expect(coolnameDisplay).toHaveText('Joecool');
  });

  test('text input syncs with display', async ({ page }) => {
    const nameInput = page.locator('input[p-model="name"]').first();
    const coolnameDisplay = page.locator('[p-text="coolname"]');

    // Verify initial state
    await expect(nameInput).toHaveValue('Bob');
    await expect(coolnameDisplay).toHaveText('Bobcool');

    // Clear and type new value
    await nameInput.fill('');
    await expect(coolnameDisplay).toHaveText('cool');

    await nameInput.fill('Alice');
    await expect(coolnameDisplay).toHaveText('Alicecool');
  });

  test('number input syncs with display and computed values', async ({ page }) => {
    const countInput = page.locator('input[type="number"][p-model="count"]');
    const numberAttr = page.locator('[p-attr\\:number]');

    // Initial: count = 2, number attr = 6
    await expect(countInput).toHaveValue('2');
    await expect(numberAttr).toHaveAttribute('number', '6');

    // Change to 10
    await countInput.fill('10');
    await expect(numberAttr).toHaveAttribute('number', '30');
  });
});
