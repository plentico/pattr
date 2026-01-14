import { test, expect } from '@playwright/test';

test.describe('p-scope Sequential Execution', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('initial values are computed sequentially', async ({ page }) => {
    // Sequential Scope: count = count + 1; count = count * 2
    // With parent count = 2: (2+1)*2 = 6
    await expect(page.locator('section[p-id="l1r96"] [p-text]').first()).toHaveText(/6/);
  });

  test('child scope inherits from parent correctly', async ({ page }) => {
    // Parent count = 2
    // Child (*2): 2 * 2 = 4
    await expect(page.locator('section[p-id="ek753"] [p-text]').first()).toContainText('4');
  });

  test('grandchild scope chains correctly', async ({ page }) => {
    // Parent count = 2
    // Child (*2): 4
    // Grandchild (+1): 5
    await expect(page.locator('section[p-id="xf9g3"] [p-text]').first()).toContainText('5');
  });
});

test.describe('p-scope Local Increment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('sequential scope increment works correctly', async ({ page }) => {
    const sequentialSection = page.locator('section[p-id="l1r96"]');
    const countDisplay = sequentialSection.locator('[p-text]').first();
    const plusButton = sequentialSection.locator('button').first();

    // Initial: 6
    await expect(countDisplay).toHaveText(/6/);

    // Click + should give 7 (not re-execute p-scope to get 14)
    await plusButton.click();
    await expect(countDisplay).toHaveText(/7/);

    // Another click should give 8
    await plusButton.click();
    await expect(countDisplay).toHaveText(/8/);
  });

  test('child scope increment works correctly', async ({ page }) => {
    const childSection = page.locator('section[p-id="ek753"]');
    const countDisplay = childSection.locator('[p-text]').first();
    const plusButton = childSection.locator('button').first();

    // Initial: 4
    await expect(countDisplay).toContainText('4');

    // Click + should give 5 (not re-execute to get 10)
    await plusButton.click();
    await expect(countDisplay).toContainText('5');
  });

  test('sibling scopes are independent', async ({ page }) => {
    const sequentialSection = page.locator('section[p-id="l1r96"]');
    const childSection = page.locator('section[p-id="ek753"]');

    const seqCountDisplay = sequentialSection.locator('[p-text]').first();
    const childCountDisplay = childSection.locator('[p-text]').first();
    const seqPlusButton = sequentialSection.locator('button').first();

    // Initial values
    await expect(seqCountDisplay).toHaveText(/6/);
    await expect(childCountDisplay).toContainText('4');

    // Click sequential +
    await seqPlusButton.click();

    // Sequential should be 7, Child should still be 4
    await expect(seqCountDisplay).toHaveText(/7/);
    await expect(childCountDisplay).toContainText('4');
  });
});

test.describe('p-scope Parent Change Propagation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('parent count change updates child scopes', async ({ page }) => {
    const parentPlusButton = page.locator('body > button').first();
    const sequentialDisplay = page.locator('section[p-id="l1r96"] [p-text]').first();
    const childDisplay = page.locator('section[p-id="ek753"] [p-text]').first();
    const grandchildDisplay = page.locator('section[p-id="xf9g3"] [p-text]').first();

    // Initial: Parent=2, Sequential=(2+1)*2=6, Child=2*2=4, Grandchild=4+1=5
    await expect(sequentialDisplay).toHaveText(/6/);
    await expect(childDisplay).toContainText('4');
    await expect(grandchildDisplay).toContainText('5');

    // Click parent +
    await parentPlusButton.click();

    // After Parent=3: Sequential=(3+1)*2=8, Child=3*2=6, Grandchild=6+1=7
    await expect(sequentialDisplay).toHaveText(/8/);
    await expect(childDisplay).toContainText('6');
    await expect(grandchildDisplay).toContainText('7');
  });

  test('parent name change updates derived values', async ({ page }) => {
    const coolnameDisplay = page.locator('body > div[p-text="coolname"]');
    const nameInput = page.locator('input[p-model="name"]').first();
    const childNameDisplay = page.locator('section[p-id="ek753"] [p-text]').first();
    const grandchildNameDisplay = page.locator('section[p-id="xf9g3"] [p-text]').first();

    // Initial: name=Bob, coolname=Bobcool, child=Bobo, grandchild=Bobo Burns
    await expect(coolnameDisplay).toHaveText('Bobcool');
    await expect(childNameDisplay).toContainText('Bobo');
    await expect(grandchildNameDisplay).toContainText('Bobo Burns');

    // Change name to Bobby
    await nameInput.fill('Bobby');

    // After: coolname=Bobbycool, child=Bobbyo, grandchild=Bobbyo Burns
    await expect(coolnameDisplay).toHaveText('Bobbycool');
    await expect(childNameDisplay).toContainText('Bobbyo');
    await expect(grandchildNameDisplay).toContainText('Bobbyo Burns');
  });
});

test.describe('p-for Cats List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('show/hide cats toggle works', async ({ page }) => {
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

    // Verify initial cats (3 from p-scope: Ralph, Betsy, Drago)
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
});

test.describe('p-scope Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('multiple increments then parent change works correctly', async ({ page }) => {
    const parentPlusButton = page.locator('body > button').first();
    const sequentialSection = page.locator('section[p-id="l1r96"]');
    const seqCountDisplay = sequentialSection.locator('[p-text]').first();
    const seqPlusButton = sequentialSection.locator('button').first();

    // Initial: 6
    await expect(seqCountDisplay).toHaveText(/6/);

    // Click sequential + twice: 6 -> 7 -> 8
    await seqPlusButton.click();
    await seqPlusButton.click();
    await expect(seqCountDisplay).toHaveText(/8/);

    // Click parent +: should re-compute from new parent value
    // Parent=3, Sequential=(3+1)*2=8
    await parentPlusButton.click();
    await expect(seqCountDisplay).toHaveText(/8/);
  });

  test('decrement works correctly', async ({ page }) => {
    const childSection = page.locator('section[p-id="ek753"]');
    const countDisplay = childSection.locator('[p-text]').first();
    // Get the second button (minus button) within child section
    const minusButton = childSection.locator('button').nth(1);

    // Initial: 4
    await expect(countDisplay).toContainText('4');

    // Click - should give 3
    await minusButton.click();
    await expect(countDisplay).toContainText('3');
  });
});
