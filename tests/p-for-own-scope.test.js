import { describe, it, expect } from 'vitest';
import { setupPattr } from './setup.js';

// A loop can carry a p-scope of its own. Pico puts a component's scope on its
// first element, which is the loop itself when the component is just a loop,
// as in Plenti's pages layout: {for let {name, fields} of components}.
describe('p-for with its own p-scope', () => {
  const page = (data, body) => `<!DOCTYPE html><html><head>
    <script id="p-root-data" type="application/json">${JSON.stringify(data)}</script></head>
    <body>${body}</body></html>`;
  const start = async (data, body) => {
    const errors = [];
    const env = setupPattr(page(data, body));
    env.window.console.error = (...a) => errors.push(a.join(' '));
    await env.Pattr.start();
    return { ...env, errors };
  };
  const texts = (document) => Array.from(document.querySelectorAll('li[p-for-key]')).map((li) => li.innerText ?? li.textContent);

  it('reads its list from its own scope, and follows live edits', async () => {
    const { document, Pattr, errors } = await start({ content: { fields: { items: ['a', 'b'] } } }, `
      <ul>
        <template p-for="item of items" p-scope="items = (content.fields)['items'];"><li p-text="item"></li></template>
        <li p-for-key="s0:0" p-text="item">a</li>
        <li p-for-key="s0:1" p-text="item">b</li>
      </ul>`);
    expect(errors).toEqual([]);
    Pattr.data.content = { fields: { items: ['c', 'd', 'e'] } };
    expect(texts(document)).toEqual(['c', 'd', 'e']);
    expect(errors).toEqual([]);
  });

  it('renders dynamic components from a list in its own scope', async () => {
    const comps = [{ name: 'hero', fields: { title: 'Hi' } }, { name: 'quote', fields: { text: 'Nice' } }];
    const { document, Pattr, errors } = await start({ content: { fields: { components: comps } } }, `
      <main>
        <template p-for="{name, fields} of components" p-scope="components = (content.fields)['components'];">
          <template p-comp="name"></template>
        </template>
        <template p-comp="name" p-for-key="s0:0"></template><section class="hero" p-comp-node="hero" p-for-key="s0:0"><h2 p-text="fields.title">Hi</h2></section>
        <template p-comp="name" p-for-key="s0:1"></template><blockquote class="quote" p-comp-node="quote" p-for-key="s0:1" p-text="fields.text">Nice</blockquote>
      </main>
      <template p-comp-src="hero"><section class="hero"><h2 p-text="fields.title"></h2></section></template>
      <template p-comp-src="quote"><blockquote class="quote" p-text="fields.text"></blockquote></template>`);
    expect(errors).toEqual([]);
    const order = () => Array.from(document.querySelectorAll('main > section, main > blockquote')).map((e) => e.className);
    expect(order()).toEqual(['hero', 'quote']);
    Pattr.data.content = { fields: { components: [comps[1], { name: 'hero', fields: { title: 'Edited' } }] } };
    expect(order()).toEqual(['quote', 'hero']);
    expect(document.querySelector('main > section.hero h2').innerText).toBe('Edited');
    expect(errors).toEqual([]);
  });
});
