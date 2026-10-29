import { describe, it, expect, vi } from 'vitest';
import { setupPattr } from './setup.js';

describe('external root data', () => {
  it('loads shared props before hydrating the root scope', async () => {
    const { window, document, Pattr } = setupPattr(`<!DOCTYPE html>
      <html>
        <head>
          <script id="p-root-data" type="application/json"
            data-external-props='{"allContent":"/core/allContent.json"}'>{"content":{"fields":{"title":"Blog"}}}</script>
        </head>
        <body>
          <h1 p-text="content.fields.title"></h1>
          <p id="post" p-text="allContent[0].fields.title"></p>
        </body>
      </html>
    `);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ fields: { title: 'Hello' } }]
    });
    window.fetch = fetchMock;

    await Pattr.start();

    expect(fetchMock).toHaveBeenCalledWith('/core/allContent.json');
    expect(document.querySelector('h1').innerText).toBe('Blog');
    expect(document.getElementById('post').innerText).toBe('Hello');
    expect(Pattr.rawData.allContent).toHaveLength(1);
  });

  it('continues hydrating inline props when external data cannot be loaded', async () => {
    const { window, document, Pattr } = setupPattr(`<!DOCTYPE html>
      <html><head><script id="p-root-data" type="application/json"
        data-external-props='{"allContent":"/missing.json"}'>{"title":"Still here"}</script></head>
        <body><p p-text="title"></p></body></html>
    `);
    window.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' });
    vi.spyOn(window.console, 'error').mockImplementation(() => {});

    await Pattr.start();

    expect(document.querySelector('p').innerText).toBe('Still here');
  });
});
