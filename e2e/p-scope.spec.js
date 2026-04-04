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

  // Sync Scope Tests
  test('sync scope propagates count changes to parent', async ({ page }) => {
    const syncedSection = page.locator('#synced-scope');
    const syncedCountDisplay = syncedSection.locator('[p-text]').first();
    const syncedPlusButton = syncedSection.locator('button').first();
    // Use parent section to get parent count display
    const parentSection = page.locator('body');
    const parentCountDisplay = parentSection.locator('div').filter({ hasText: /can count to:/ }).first();

    // Initial: Parent count = 2
    await expect(parentCountDisplay).toContainText('2');
    await expect(syncedCountDisplay).toContainText('2');

    // Click + in synced scope - should update both synced and parent
    await syncedPlusButton.click();
    await expect(syncedCountDisplay).toContainText('3');
    await expect(parentCountDisplay).toContainText('3');

    // Click + again
    await syncedPlusButton.click();
    await expect(syncedCountDisplay).toContainText('4');
    await expect(parentCountDisplay).toContainText('4');
  });

  test('sync scope propagates name changes to parent via p-model', async ({ page }) => {
    const syncedSection = page.locator('#synced-scope');
    const syncedNameInput = syncedSection.locator('input[p-model="name"]');
    const parentNameDisplay = page.locator('span[p-text="coolname"]');

    // Initial: name = Bob, coolname = Bobcool
    await expect(parentNameDisplay).toHaveText('Bobcool');

    // Change name in synced scope input
    await syncedNameInput.fill('Alice');

    // Parent coolname should update (name + 'cool')
    await expect(parentNameDisplay).toHaveText('Alicecool');
  });

  test('parent name change updates synced child scope', async ({ page }) => {
    const parentNameInput = page.locator('input[p-model="name"]').first();
    const syncedSection = page.locator('#synced-scope');
    const syncedNameInput = syncedSection.locator('input[p-model="name"]');

    // Initial: name = Bob
    await expect(syncedNameInput).toHaveValue('Bob');

    // Change name in parent scope
    await parentNameInput.fill('Charlie');
    
    // Wait a bit for updates
    await page.waitForTimeout(100);

    // Synced scope should update
    await expect(syncedNameInput).toHaveValue('Charlie');
  });

  test('local scope variable (name2) does not propagate to parent', async ({ page }) => {
    const syncedSection = page.locator('#synced-scope');
    const name2Input = syncedSection.locator('input[p-model="name2"]');
    const parentName2Display = page.locator('div').filter({ hasText: /Other name is:/ }).first();

    // Initial: name2 = Ted
    await expect(parentName2Display).toContainText('Ted');

    // Change name2 in synced scope (should stay local since it's from p-scope, not p-scope:sync)
    await name2Input.fill('Changed');

    // Parent name2 should still be Ted (not synced)
    await expect(parentName2Display).toContainText('Ted');
  });

  test('p-scope handles semicolons in strings correctly', async ({ page }) => {
    // The cats array in index.html has items like 'Ralph', 'Betsy', 'Drago'
    // Test that the p-for loop with semicolon-containing strings works
    const catsList = page.locator('.cats-list');
    const toggleButton = page.locator('button:has(span[p-show])');
    
    // Show cats
    await toggleButton.click();
    
    // Check that cats are displayed (this tests the smart semicolon parser)
    await expect(catsList).toContainText('Ralph');
    await expect(catsList).toContainText('Betsy');
    await expect(catsList).toContainText('Drago');
  });

  test('deep sync - content object property updates propagate to parent', async ({ page }) => {
    // This test verifies that modifying a property on a synced object
    // updates the corresponding parent scope variable
    const syncedSection = page.locator('#synced-scope');
    const pathInput = syncedSection.locator('input[p-model="content.path"]');
    const titleInput = syncedSection.locator('input[p-model="content.title"]');
    const parentPathDisplay = page.locator('div').filter({ hasText: /Path:/ }).first();
    const parentTitleDisplay = page.locator('div').filter({ hasText: /Title:/ }).first();
    
    // Initial: content.path = /test, content.title = My page
    await expect(parentPathDisplay).toContainText('/test');
    await expect(parentTitleDisplay).toContainText('My page');
    
    // Update content.path in synced scope - this tests deep sync
    await pathInput.fill('/updated-path');
    
    // Parent path should update
    await expect(parentPathDisplay).toContainText('/updated-path');
    
    // Update content.title in synced scope
    await titleInput.fill('Updated Title');
    
    // Parent title should update
    await expect(parentTitleDisplay).toContainText('Updated Title');
  });

  test('sync scope decrement also updates parent', async ({ page }) => {
    const syncedSection = page.locator('#synced-scope');
    const syncedCountDisplay = syncedSection.locator('[p-text]').first();
    const syncedMinusButton = syncedSection.locator('button').nth(1);
    // Use parent section to get parent count display
    const parentSection = page.locator('body');
    const parentCountDisplay = parentSection.locator('div').filter({ hasText: /can count to:/ }).first();

    // Initial: Parent count = 2
    await expect(parentCountDisplay).toContainText('2');
    await expect(syncedCountDisplay).toContainText('2');

    // Click - in synced scope
    await syncedMinusButton.click();
    await expect(syncedCountDisplay).toContainText('1');
    await expect(parentCountDisplay).toContainText('1');
  });

  test('non-sync scope does not propagate to parent', async ({ page }) => {
    const childSection = page.locator('#child-scope');
    const childCountDisplay = childSection.locator('[p-text]').first();
    const childPlusButton = childSection.locator('button').first();
    // Use parent section to get parent count display
    const parentSection = page.locator('body');
    const parentCountDisplay = parentSection.locator('div').filter({ hasText: /can count to:/ }).first();

    // Initial: Parent count = 2, Child count = 4 (2 * 2)
    await expect(parentCountDisplay).toContainText('2');
    await expect(childCountDisplay).toContainText('4');

    // Click + in child scope (non-sync) - only child updates
    await childPlusButton.click();
    await expect(childCountDisplay).toContainText('5');
    await expect(parentCountDisplay).toContainText('2'); // Parent unchanged
  });

  test('p-model with bracket notation in p-for loop updates object property', async ({ page }) => {
    // Test p-model="content[key]" inside a p-for loop
    // The index.html has: <template p-for="[key, value] in Object.entries(content)">
    //                      <input type="text" p-model="content[key]" />
    //                      <span p-text="`${key}: ${content[key]}`"></span>
    
    // Get the first input that uses bracket notation (path input)
    const bracketInputs = page.locator('input[p-model="content[key]"]');
    const firstInput = bracketInputs.first();
    
    // Get the display span that shows the value (it displays "path: /test")
    const displaySpan = page.locator('span').filter({ hasText: 'path:' }).first();
    
    // Initial values
    await expect(firstInput).toHaveValue('/test');
    await expect(displaySpan).toContainText('path: /test');
    
    // Update the input using bracket notation
    await firstInput.fill('/new-path');
    
    // Verify both the input value AND the display span updated
    // This confirms the data binding actually works (not just native input behavior)
    await expect(firstInput).toHaveValue('/new-path');
    await expect(displaySpan).toContainText('path: /new-path');
  });
});
