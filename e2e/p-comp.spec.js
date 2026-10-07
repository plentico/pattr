import { test, expect } from '@playwright/test';

test.describe('p-comp dynamic components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders initial components from the registry', async ({ page }) => {
    const demo = page.locator('.comps-demo');

    const hero = demo.locator('.hero-comp');
    const quote = demo.locator('.quote-comp');

    await expect(hero).toHaveCount(1);
    await expect(hero.locator('h2')).toHaveText('Welcome Hero');
    await expect(hero.locator('p')).toHaveText('Rendered from the registry');
    await expect(quote).toHaveCount(1);
    await expect(quote).toHaveText('A nice dynamic quote');

    // Anchors stay in the DOM, one per item, with no wrapper around components
    await expect(demo.locator(':scope > template[p-comp]')).toHaveCount(2);
    await expect(demo.locator(':scope > .hero-comp')).toHaveCount(1);
    await expect(demo.locator(':scope > .quote-comp')).toHaveCount(1);
  });

  test('add hero and add quote buttons append components in order', async ({ page }) => {
    const demo = page.locator('.comps-demo');

    await page.locator('#add-hero').click();
    await expect(demo.locator('.hero-comp')).toHaveCount(2);
    await expect(demo.locator('.hero-comp').nth(1).locator('h2')).toHaveText('Added Hero');

    await page.locator('#add-quote').click();
    await expect(demo.locator('.quote-comp')).toHaveCount(2);
    await expect(demo.locator('.quote-comp').nth(1)).toHaveText('Quote added at runtime');

    // Order: hero, quote, hero, quote (anchors interleaved between them)
    const rendered = demo.locator(':scope > .hero-comp, :scope > .quote-comp');
    await expect(rendered.nth(0)).toHaveClass('hero-comp');
    await expect(rendered.nth(1)).toHaveClass('quote-comp');
    await expect(rendered.nth(2)).toHaveClass('hero-comp');
    await expect(rendered.nth(3)).toHaveClass('quote-comp');
  });

  test('remove last button removes the last component', async ({ page }) => {
    const demo = page.locator('.comps-demo');

    await page.locator('#remove-last').click();
    await expect(demo.locator('.quote-comp')).toHaveCount(0);
    await expect(demo.locator('.hero-comp')).toHaveCount(1);
    await expect(demo.locator(':scope > template[p-comp]')).toHaveCount(1);
  });

  test('remove me button inside a component removes it', async ({ page }) => {
    const demo = page.locator('.comps-demo');

    await demo.locator('.hero-comp .remove-me').click();
    await expect(demo.locator('.hero-comp')).toHaveCount(0);
    await expect(demo.locator('.quote-comp')).toHaveCount(1);
  });

  test('bindings inside a component stay live without re-inflating', async ({ page }) => {
    const demo = page.locator('.comps-demo');
    const hero = demo.locator('.hero-comp');

    await hero.locator('.shout').click();
    await expect(hero.locator('h2')).toHaveText('Welcome Hero!');

    await hero.locator('.shout').click();
    await expect(hero.locator('h2')).toHaveText('Welcome Hero!!');

    // Still exactly one of each component (no duplication on refresh)
    await expect(demo.locator('.hero-comp')).toHaveCount(1);
    await expect(demo.locator('.quote-comp')).toHaveCount(1);
  });
});
