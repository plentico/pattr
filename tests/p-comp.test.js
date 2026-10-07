import { describe, test, expect, vi } from 'vitest';
import { setupPattr } from './setup.js';

// Shared component registry (inert templates Pico would emit at the end of <body>)
const REGISTRY = `
  <template p-comp-src="hero">
    <section class="hero-comp">
      <h2 p-text="comp.fields.title"></h2>
      <button class="shout" p-on:click="comp.fields.title = comp.fields.title + '!'">Append !</button>
      <button class="remove-me" p-on:click="comps = comps.filter(c => c !== comp)">Remove me</button>
    </section>
  </template>
  <template p-comp-src="quote">
    <blockquote class="quote-comp" p-text="comp.fields.text"></blockquote>
  </template>
  <template p-comp-src="multi">
    <h3 class="multi-a" p-text="comp.fields.title"></h3>
    <p class="multi-b" p-text="comp.fields.text"></p>
  </template>
  <template p-comp-src="listy">
    <ul class="listy-comp">
      <template p-for="item of comp.fields.items">
        <li p-text="item"></li>
      </template>
    </ul>
  </template>
  <template p-comp-src="banner">
    <div class="banner" p-text="title"></div>
  </template>
  <template p-comp-src="other">
    <span class="other" p-text="title"></span>
  </template>
`;

const COMPS_DATA = {
  comps: [
    { name: 'hero', fields: { title: 'Welcome', text: 'Hero text' } },
    { name: 'quote', fields: { text: 'A nice quote' } }
  ]
};

function buildHtml({ data = {}, body = '' } = {}) {
  return `<!DOCTYPE html>
    <html>
      <head>
        <script id="p-root-data" type="application/json">${JSON.stringify(data)}</script>
      </head>
      <body>
        ${body}
        ${REGISTRY}
      </body>
    </html>
  `;
}

const COMPS_LOOP = `
  <div id="comps">
    <template p-for="comp of comps">
      <template p-comp="comp.name"></template>
    </template>
  </div>
`;

describe('p-comp directive', () => {
  describe('standalone anchors', () => {
    test('inflates a component from the registry after the anchor', async () => {
      const { document, Pattr } = setupPattr(buildHtml({
        data: { title: 'Hello', current: 'banner' },
        body: `<div id="slot"><template p-comp="current"></template></div>`
      }));

      await Pattr.start();

      const banner = document.querySelector('.banner');
      expect(banner).toBeTruthy();
      expect(banner.innerText).toBe('Hello');
      // No wrapper: the component root is a direct child of the anchor's parent
      expect(banner.parentElement.id).toBe('slot');
      // Anchor stays in the DOM, content inserted right after it
      const anchor = document.querySelector('template[p-comp]');
      expect(anchor).toBeTruthy();
      expect(anchor.nextElementSibling).toBe(banner);
    });

    test('renders nothing when the name is falsy', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { document, Pattr } = setupPattr(buildHtml({
        data: { title: 'Hello', current: null },
        body: `<div id="slot"><template p-comp="current"></template></div>`
      }));

      await Pattr.start();

      expect(document.querySelector('#slot').children.length).toBe(1); // anchor only
      expect(errSpy).not.toHaveBeenCalled();
      errSpy.mockRestore();
    });
    test('swaps the component when the name changes', async () => {
      const { document, Pattr } = setupPattr(buildHtml({
        data: { title: 'Hello', current: 'banner' },
        body: `
          <div id="slot"><template p-comp="current"></template></div>
          <button id="to-other" p-on:click="current = 'other'">Other</button>
          <button id="to-banner" p-on:click="current = 'banner'">Banner</button>
        `
      }));

      await Pattr.start();
      expect(document.querySelector('.banner')).toBeTruthy();

      document.getElementById('to-other').click();
      expect(document.querySelector('.banner')).toBeFalsy();
      expect(document.querySelector('.other')).toBeTruthy();
      expect(document.querySelector('.other').innerText).toBe('Hello');

      document.getElementById('to-banner').click();
      expect(document.querySelector('.other')).toBeFalsy();
      expect(document.querySelector('.banner')).toBeTruthy();
    });

    test('removes the component when the name becomes falsy', async () => {
      const { document, Pattr } = setupPattr(buildHtml({
        data: { title: 'Hello', current: 'banner' },
        body: `
          <div id="slot"><template p-comp="current"></template></div>
          <button id="clear" p-on:click="current = null">Clear</button>
        `
      }));

      await Pattr.start();
      expect(document.querySelector('.banner')).toBeTruthy();

      document.getElementById('clear').click();
      expect(document.querySelector('.banner')).toBeFalsy();
      // Only the anchor remains
      expect(document.querySelector('#slot').children.length).toBe(1);
    });

    test('appears later when a falsy name resolves to a registered name', async () => {
      const { document, Pattr } = setupPattr(buildHtml({
        data: { title: 'Hello', current: null },
        body: `
          <div id="slot"><template p-comp="current"></template></div>
          <button id="set" p-on:click="current = 'banner'">Set</button>
        `
      }));

      await Pattr.start();
      expect(document.querySelector('.banner')).toBeFalsy();

      document.getElementById('set').click();
      expect(document.querySelector('.banner')).toBeTruthy();
      expect(document.querySelector('.banner').innerText).toBe('Hello');
    });

    test('logs an error for a missing registry entry and does not crash', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { document, Pattr } = setupPattr(buildHtml({
        data: {},
        body: `<div id="slot"><template p-comp="'nope'"></template></div>`
      }));

      await Pattr.start();

      expect(errSpy).toHaveBeenCalledWith(
        expect.stringContaining('no component registered under name "nope"')
      );
      expect(document.querySelector('#slot').children.length).toBe(1); // anchor only
      errSpy.mockRestore();
    });

    test('warns when p-comp is used on a non-template element', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { Pattr } = setupPattr(buildHtml({
        data: {},
        body: `<div p-comp="'banner'"></div>`
      }));

      await Pattr.start();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('p-comp is only supported on <template> elements'),
        expect.anything()
      );
      warnSpy.mockRestore();
    });
  });


  describe('inside p-for loops', () => {
    test('renders a component per item with loop scope bindings', async () => {
      const { document, Pattr } = setupPattr(buildHtml({
        data: COMPS_DATA,
        body: COMPS_LOOP
      }));

      await Pattr.start();

      const hero = document.querySelector('.hero-comp');
      const quote = document.querySelector('.quote-comp');
      expect(hero).toBeTruthy();
      expect(hero.querySelector('h2').innerText).toBe('Welcome');
      expect(quote).toBeTruthy();
      expect(quote.innerText).toBe('A nice quote');

      // No wrapper: component roots are direct children of the loop container
      expect(hero.parentElement.id).toBe('comps');
      expect(quote.parentElement.id).toBe('comps');

      // Anchors stay in the DOM, one per item
      expect(document.querySelectorAll('#comps > template[p-comp]').length).toBe(2);

      // Structure: p-for template, anchor, hero, anchor, quote
      const children = Array.from(document.getElementById('comps').children);
      expect(children[0].tagName).toBe('TEMPLATE'); // p-for
      expect(children[1].tagName).toBe('TEMPLATE'); // anchor 0
      expect(children[2].className).toBe('hero-comp');
      expect(children[3].tagName).toBe('TEMPLATE'); // anchor 1
      expect(children[4].className).toBe('quote-comp');
    });

    test('adds a component when an item is added', async () => {
      const { document, Pattr } = setupPattr(buildHtml({
        data: COMPS_DATA,
        body: COMPS_LOOP + `
          <button id="add" p-on:click="comps = [...comps, {name: 'quote', fields: {text: 'Added at runtime'}}]">Add</button>
        `
      }));

      await Pattr.start();
      document.getElementById('add').click();

      const quotes = document.querySelectorAll('.quote-comp');
      expect(quotes.length).toBe(2);
      expect(quotes[1].innerText).toBe('Added at runtime');

      // Order preserved: hero, quote, quote
      const children = Array.from(document.getElementById('comps').children);
      const rendered = children.filter(el => el.className);
      expect(rendered.map(el => el.className)).toEqual(['hero-comp', 'quote-comp', 'quote-comp']);
    });

    test('removes a component when its item is removed (button inside component)', async () => {
      const { document, Pattr } = setupPattr(buildHtml({
        data: COMPS_DATA,
        body: COMPS_LOOP
      }));

      await Pattr.start();
      document.querySelector('.hero-comp .remove-me').click();

      expect(document.querySelector('.hero-comp')).toBeFalsy();
      expect(document.querySelector('.quote-comp')).toBeTruthy();
      expect(document.querySelectorAll('#comps > template[p-comp]').length).toBe(1);
    });

    test('reorders components when items are reordered', async () => {
      const { document, Pattr } = setupPattr(buildHtml({
        data: COMPS_DATA,
        body: COMPS_LOOP + `
          <button id="reverse" p-on:click="comps = [...comps].reverse()">Reverse</button>
        `
      }));

      await Pattr.start();
      document.getElementById('reverse').click();

      const rendered = Array.from(document.getElementById('comps').children).filter(el => el.className);
      expect(rendered.map(el => el.className)).toEqual(['quote-comp', 'hero-comp']);
    });


    test('updates bindings inside a component without re-inflating it', async () => {
      const { document, Pattr } = setupPattr(buildHtml({
        data: COMPS_DATA,
        body: COMPS_LOOP
      }));

      await Pattr.start();

      const heroBefore = document.querySelector('.hero-comp');
      document.querySelector('.hero-comp .shout').click();

      const heroAfter = document.querySelector('.hero-comp');
      expect(heroAfter.querySelector('h2').innerText).toBe('Welcome!');
      // Field update did not tear down / re-inflate the component (local state preserved)
      expect(heroAfter).toBe(heroBefore);
    });

    test('does not duplicate components on unrelated state changes', async () => {
      const { document, Pattr } = setupPattr(buildHtml({
        data: { ...COMPS_DATA, count: 0 },
        body: COMPS_LOOP + `
          <button id="bump" p-on:click="count++">Bump</button>
        `
      }));

      await Pattr.start();
      document.getElementById('bump').click();
      document.getElementById('bump').click();

      expect(document.querySelectorAll('.hero-comp').length).toBe(1);
      expect(document.querySelectorAll('.quote-comp').length).toBe(1);
      expect(document.querySelectorAll('#comps > template[p-comp]').length).toBe(2);
    });

    test('renders multi-root components as siblings after the anchor', async () => {
      const { document, Pattr } = setupPattr(buildHtml({
        data: { comps: [{ name: 'multi', fields: { title: 'Title', text: 'Body' } }] },
        body: COMPS_LOOP
      }));

      await Pattr.start();

      const anchor = document.querySelector('#comps template[p-comp]');
      expect(anchor.nextElementSibling.className).toBe('multi-a');
      expect(anchor.nextElementSibling.nextElementSibling.className).toBe('multi-b');
      expect(document.querySelector('.multi-a').innerText).toBe('Title');
      expect(document.querySelector('.multi-b').innerText).toBe('Body');
    });

    test('hydrates nested p-for templates inside components', async () => {
      const { document, Pattr } = setupPattr(buildHtml({
        data: { comps: [{ name: 'listy', fields: { items: ['a', 'b'] } }] },
        body: COMPS_LOOP
      }));

      await Pattr.start();

      const items = document.querySelectorAll('.listy-comp li');
      expect(items.length).toBe(2);
      expect(items[0].innerText).toBe('a');
      expect(items[1].innerText).toBe('b');
    });

    test('works when the anchor is nested inside a loop item wrapper', async () => {
      const { document, Pattr } = setupPattr(buildHtml({
        data: COMPS_DATA,
        body: `
          <div id="comps">
            <template p-for="comp of comps">
              <div class="item">
                <template p-comp="comp.name"></template>
              </div>
            </template>
          </div>
        `
      }));

      await Pattr.start();

      const items = document.querySelectorAll('#comps > .item');
      expect(items.length).toBe(2);
      expect(items[0].querySelector('.hero-comp')).toBeTruthy();
      expect(items[1].querySelector('.quote-comp')).toBeTruthy();
      // Content is inside the wrapper, right after the anchor
      expect(items[0].querySelector('template[p-comp]').nextElementSibling.className).toBe('hero-comp');
    });
  });


  describe('SSR hydration', () => {
    test('adopts standalone SSR siblings marked p-comp-node instead of re-inflating', async () => {
      const { document, Pattr } = setupPattr(buildHtml({
        data: { title: 'Hello', current: 'banner' },
        body: `
          <div id="slot">
            <template p-comp="current"></template>
            <div class="banner" p-comp-node="banner" id="ssr-banner" p-text="title"></div>
          </div>
        `
      }));

      await Pattr.start();

      // The SSR node is adopted (kept), not duplicated
      const banners = document.querySelectorAll('.banner');
      expect(banners.length).toBe(1);
      expect(banners[0].id).toBe('ssr-banner');
      // Its bindings were hydrated against scope
      expect(banners[0].innerText).toBe('Hello');
    });

    test('hydrates SSR components inside p-for without duplicating', async () => {
      const { document, Pattr } = setupPattr(buildHtml({
        data: COMPS_DATA,
        body: `
          <div id="comps">
            <template p-for="comp of comps">
              <template p-comp="comp.name"></template>
            </template>
            <template p-comp="comp.name" p-for-key="s3:0"></template>
            <section class="hero-comp" p-comp-node="hero" p-for-key="s3:0"><h2>SSR Hero</h2></section>
            <template p-comp="comp.name" p-for-key="s3:1"></template>
            <blockquote class="quote-comp" p-comp-node="quote" p-for-key="s3:1">SSR quote</blockquote>
          </div>
        `
      }));

      await Pattr.start();

      // No duplicates
      expect(document.querySelectorAll('.hero-comp').length).toBe(1);
      expect(document.querySelectorAll('.quote-comp').length).toBe(1);
      // Content ends up driven by scope data (same as any other loop re-render)
      expect(document.querySelector('.hero-comp h2').innerText).toBe('Welcome');
      expect(document.querySelector('.quote-comp').innerText).toBe('A nice quote');
      expect(document.querySelectorAll('#comps > template[p-comp]').length).toBe(2);
    });

    test('adopted SSR content is torn down when the item is removed', async () => {
      const { document, Pattr } = setupPattr(buildHtml({
        data: COMPS_DATA,
        body: `
          <div id="comps">
            <template p-for="comp of comps">
              <template p-comp="comp.name"></template>
            </template>
            <template p-comp="comp.name" p-for-key="s3:0"></template>
            <section class="hero-comp" p-comp-node="hero" p-for-key="s3:0">
              <h2>SSR Hero</h2>
              <button class="remove-me" p-on:click="comps = comps.filter(c => c !== comp)">Remove me</button>
            </section>
            <template p-comp="comp.name" p-for-key="s3:1"></template>
            <blockquote class="quote-comp" p-comp-node="quote" p-for-key="s3:1">SSR quote</blockquote>
          </div>
        `
      }));

      await Pattr.start();
      document.querySelector('.hero-comp .remove-me').click();

      expect(document.querySelector('.hero-comp')).toBeFalsy();
      expect(document.querySelector('.quote-comp')).toBeTruthy();
    });
  });
});

