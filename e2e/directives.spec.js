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
    // "${name} can count to: ${count}" = "Bob can count to: 2"
    // Use the parent div that has the trim modifier
    const textElement = page.locator('[p-text\\:trim\\.25="`${name} can count to: ${count}`"]');
    await expect(textElement).toContainText('Bob can count to: 2');
  });

  test('trim modifier truncates text', async ({ page }) => {
    // p-text:trim.25 should truncate to 25 chars + "..."
    const trimmedText = page.locator('[p-text\\:trim\\.25]');
    const text = await trimmedText.innerText();
    expect(text.length).toBeLessThanOrEqual(28); // 25 + "..."
  });
});

test.describe('p-html directive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders HTML content', async ({ page }) => {
    // title contains <strong><em>Pattr</em></strong>
    const h1 = page.locator('h1');
    await expect(h1.locator('strong')).toBeVisible();
    await expect(h1.locator('em')).toHaveText('Pattr');
  });

  test('allow modifier filters tags', async ({ page }) => {
    // p-html:allow.strong.em should only allow <strong> and <em>
    const h1 = page.locator('h1');
    // iframe should be filtered out
    await expect(h1.locator('iframe')).not.toBeVisible();
  });

  test('trim modifier limits text length while preserving HTML', async ({ page }) => {
    // p-html:allow.strong.em:trim.18 should trim text to 18 chars
    const h1 = page.locator('h1');
    const text = await h1.innerText();
    // Should be truncated
    expect(text.length).toBeLessThanOrEqual(21); // 18 + "..."
  });
});

test.describe('p-show directive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows element when condition is true', async ({ page }) => {
    // count = 2, so "Greater than 2" should be hidden, "Less than 2" should be hidden
    const greaterThan = page.locator('span:has-text("Greater than 2")');
    const lessThan = page.locator('span:has-text("Less than 2")');
    
    await expect(greaterThan).toHaveCSS('display', 'none');
    await expect(lessThan).toHaveCSS('display', 'none');
  });

  test('hides element when condition is false', async ({ page }) => {
    const parentPlusButton = page.locator('body > button').first();
    
    // Click + to make count = 3
    await parentPlusButton.click();
    
    const greaterThan = page.locator('span:has-text("Greater than 2")');
    await expect(greaterThan).toHaveCSS('display', 'inline');
  });

  test('toggles visibility dynamically', async ({ page }) => {
    const parentPlusButton = page.locator('body > button').first();
    const parentMinusButton = page.locator('body > button:has-text("-")').first();
    const greaterThan = page.locator('span:has-text("Greater than 2")');
    
    // Initial: count = 2, greater than hidden
    await expect(greaterThan).toHaveCSS('display', 'none');
    
    // Click + to make count = 3
    await parentPlusButton.click();
    await expect(greaterThan).toHaveCSS('display', 'inline');
    
    // Click - twice to make count = 1
    await parentMinusButton.click();
    await parentMinusButton.click();
    await expect(greaterThan).toHaveCSS('display', 'none');
    
    // "Less than 2" should now be visible
    const lessThan = page.locator('span:has-text("Less than 2")');
    await expect(lessThan).toHaveCSS('display', 'inline');
  });
});

test.describe('p-style directive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('applies conditional styles', async ({ page }) => {
    const catsList = page.locator('.cats-list');
    
    // Initially hidden
    await expect(catsList).toHaveCSS('max-height', '0px');
    
    // Show cats
    const toggleButton = page.locator('button:has(span[p-show])');
    await toggleButton.click();
    
    // Now visible
    await expect(catsList).toHaveCSS('max-height', '300px');
  });

  test('updates styles dynamically', async ({ page }) => {
    const catsList = page.locator('.cats-list');
    const toggleButton = page.locator('button:has(span[p-show])');
    
    // Toggle show/hide multiple times
    await toggleButton.click();
    await expect(catsList).toHaveCSS('max-height', '300px');
    
    await toggleButton.click();
    await expect(catsList).toHaveCSS('max-height', '0px');
    
    await toggleButton.click();
    await expect(catsList).toHaveCSS('max-height', '300px');
  });
});

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
});

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
});

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
});
