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

test.describe('p-model input types', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
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

test.describe('p-attr edge cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
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
});

test.describe('p-show edge cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('negation expression works', async ({ page }) => {
    const toggleButton = page.locator('button:has(span[p-show])');
    const showSpan = toggleButton.locator('span[p-show="!show_cats"]');
    const hideSpan = toggleButton.locator('span[p-show="show_cats"]');

    // Initial: show_cats = false
    await expect(showSpan).toHaveCSS('display', 'inline');
    await expect(hideSpan).toHaveCSS('display', 'none');

    // Toggle
    await toggleButton.click();
    await expect(showSpan).toHaveCSS('display', 'none');
    await expect(hideSpan).toHaveCSS('display', 'inline');
  });

  test('comparison expression with boundary values', async ({ page }) => {
    const plusButton = page.locator('body > button').first();
    const minusButton = page.locator('body > button:has-text("-")').first();
    const greaterThan = page.locator('span:has-text("Greater than 2")');
    const lessThan = page.locator('span:has-text("Less than 2")');

    // Initial: count = 2 (neither > 2 nor < 2)
    await expect(greaterThan).toHaveCSS('display', 'none');
    await expect(lessThan).toHaveCSS('display', 'none');

    // count = 3 (> 2)
    await plusButton.click();
    await expect(greaterThan).toHaveCSS('display', 'inline');
    await expect(lessThan).toHaveCSS('display', 'none');

    // count = 2 again
    await minusButton.click();
    await expect(greaterThan).toHaveCSS('display', 'none');
    await expect(lessThan).toHaveCSS('display', 'none');

    // count = 1 (< 2)
    await minusButton.click();
    await expect(greaterThan).toHaveCSS('display', 'none');
    await expect(lessThan).toHaveCSS('display', 'inline');

    // count = 0 (still < 2)
    await minusButton.click();
    await expect(lessThan).toHaveCSS('display', 'inline');
  });
});

test.describe('p-text with template literals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('updates template literal when variables change', async ({ page }) => {
    const textElement = page.locator('[p-text\\:trim\\.25="`${name} can count to: ${count}`"]');
    const nameInput = page.locator('input[p-model="name"]').first();
    const plusButton = page.locator('body > button').first();

    // Initial
    await expect(textElement).toContainText('Bob can count to: 2');

    // Change name
    await nameInput.fill('Jo');
    await expect(textElement).toContainText('Jo can count to: 2');

    // Change count
    await plusButton.click();
    await expect(textElement).toContainText('Jo can count to: 3');
  });

  test('nested scope template literals update correctly', async ({ page }) => {
    const childSection = page.locator('section[p-id="ek753"]');
    const childText = childSection.locator('[p-text]').first();
    // Use first() to get the child's input, not grandchild's
    const childInput = childSection.locator('> input[p-model="name"]');

    // Initial: name = "Bobo" (parent "Bob" + "o")
    await expect(childText).toContainText('Bobo');

    // Change child name locally
    await childInput.fill('Charlie');
    await expect(childText).toContainText('Charlie');
  });
});

test.describe('p-html directive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders HTML with allowed tags only', async ({ page }) => {
    const h1 = page.locator('h1');

    // Should have strong and em tags
    await expect(h1.locator('strong')).toBeVisible();
    await expect(h1.locator('em')).toHaveText('Pattr');

    // iframe should be filtered out
    const iframeCount = await h1.locator('iframe').count();
    expect(iframeCount).toBe(0);
  });

  test('trim modifier limits visible text', async ({ page }) => {
    const h1 = page.locator('h1');
    const text = await h1.innerText();

    // p-html:trim.18 should limit text to approximately 18 chars + "..."
    expect(text.length).toBeLessThanOrEqual(21);
    expect(text).toContain('...');
  });
});

test.describe('Multiple directives on same element', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('p-attr and p-text work together', async ({ page }) => {
    // The div has both p-attr and p-attr:number
    const parentDiv = page.locator('[p-attr\\:number]');

    await expect(parentDiv).toHaveAttribute('data-name', 'Bobwoah');
    await expect(parentDiv).toHaveAttribute('number', '6');
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
