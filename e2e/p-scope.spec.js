import { test, expect } from '@playwright/test';

test.describe('p-scope directive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // Sequential Execution
  test('initial values are computed sequentially', async ({ page }) => {
    // Sequential Scope: count = count + 1; count = count * 2
    // With parent count = 2: (2+1)*2 = 6
    await expect(page.locator('#sequential-scope [p-text]').first()).toHaveText(/6/);
  });

  test('child scope inherits from parent correctly', async ({ page }) => {
    // Parent count = 2
    // Child (*2): 2 * 2 = 4
    await expect(page.locator('#child-scope [p-text]').first()).toContainText('4');
  });

  test('grandchild scope chains correctly', async ({ page }) => {
    // Parent count = 2
    // Child (*2): 4
    // Grandchild (+1): 5
    await expect(page.locator('#grandchild-scope [p-text]').first()).toContainText('5');
  });

  // Local Increment
  test('sequential scope increment works correctly', async ({ page }) => {
    const sequentialSection = page.locator('#sequential-scope');
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
    const childSection = page.locator('#child-scope');
    const countDisplay = childSection.locator('[p-text]').first();
    const plusButton = childSection.locator('button').first();

    // Initial: 4
    await expect(countDisplay).toContainText('4');

    // Click + should give 5 (not re-execute to get 10)
    await plusButton.click();
    await expect(countDisplay).toContainText('5');
  });

  test('sibling scopes are independent', async ({ page }) => {
    const sequentialSection = page.locator('#sequential-scope');
    const childSection = page.locator('#child-scope');

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

  // Parent Change Propagation
  test('parent count change updates child scopes', async ({ page }) => {
    const parentPlusButton = page.locator('body > button').first();
    const sequentialDisplay = page.locator('#sequential-scope [p-text]').first();
    const childDisplay = page.locator('#child-scope [p-text]').first();
    const grandchildDisplay = page.locator('#grandchild-scope [p-text]').first();

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
    const coolnameDisplay = page.locator('span[p-text="coolname"]');
    const nameInput = page.locator('input[p-model="name"]').first();
    const childNameDisplay = page.locator('#child-scope [p-text]').first();
    const grandchildNameDisplay = page.locator('#grandchild-scope [p-text]').first();

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

  // Edge Cases
  test('multiple increments then parent change works correctly', async ({ page }) => {
    const parentPlusButton = page.locator('body > button').first();
    const sequentialSection = page.locator('#sequential-scope');
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
    const childSection = page.locator('#child-scope');
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
