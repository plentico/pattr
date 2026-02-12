import { describe, it, expect } from 'vitest';
import { setupPattr } from './setup.js';

describe('p-show.pre-scope modifier', () => {
  it('should evaluate before p-scope runs', async () => {
    const { document, Pattr } = setupPattr(`<!DOCTYPE html>
      <html p-id="root" p-scope="count = 2">
        <head>
          <script id="p-root-data" type="application/json">{}</script>
        </head>
        <body>
          <div id="test" p-id="child" p-show:pre-scope="count > 3" p-scope="doubled = count * 2">Content</div>
        </body>
      </html>
    `);
    
    await Pattr.start();
    
    // count is 2, which is not > 3, so element should be hidden
    expect(document.getElementById('test').style.display).toBe('none');
  });

  it('should show element when pre-scope condition is true', async () => {
    const { document, Pattr } = setupPattr(`<!DOCTYPE html>
      <html p-id="root" p-scope="count = 5">
        <head>
          <script id="p-root-data" type="application/json">{}</script>
        </head>
        <body>
          <div id="test" p-id="child" p-show:pre-scope="count > 3" p-scope="doubled = count * 2">Content</div>
        </body>
      </html>
    `);
    
    await Pattr.start();
    
    // count is 5, which is > 3, so element should be visible
    expect(document.getElementById('test').style.display).not.toBe('none');
  });

  it('should evaluate pre-scope using parent scope, not scoped variables', async () => {
    const { document, Pattr } = setupPattr(`<!DOCTYPE html>
      <html p-id="root" p-scope="value = 10">
        <head>
          <script id="p-root-data" type="application/json">{}</script>
        </head>
        <body>
          <div id="test" p-id="child" p-show:pre-scope="value === 10" p-scope="value = 5">Content</div>
        </body>
      </html>
    `);
    
    await Pattr.start();
    
    // p-show.pre-scope should evaluate using parent value (10), not scoped value (5)
    expect(document.getElementById('test').style.display).not.toBe('none');
  });
});

describe('p-show directive', () => {
  it('should show element when true', async () => {
    const { document, Pattr } = setupPattr(`<!DOCTYPE html>
      <html>
        <head>
          <script id="p-root-data" type="application/json">{"visible": true}</script>
        </head>
        <body>
          <div id="test" p-show="visible">Content</div>
        </body>
      </html>
    `);
    
    await Pattr.start();
    
    expect(document.getElementById('test').style.display).not.toBe('none');
  });

  it('should hide element when false', async () => {
    const { document, Pattr } = setupPattr(`<!DOCTYPE html>
      <html>
        <head>
          <script id="p-root-data" type="application/json">{"visible": false}</script>
        </head>
        <body>
          <div id="test" p-show="visible">Content</div>
        </body>
      </html>
    `);
    
    await Pattr.start();
    
    expect(document.getElementById('test').style.display).toBe('none');
  });

  it('should evaluate expressions', async () => {
    const { document, Pattr } = setupPattr(`<!DOCTYPE html>
      <html>
        <head>
          <script id="p-root-data" type="application/json">{"count": 5}</script>
        </head>
        <body>
          <div id="test" p-show="count > 3">Content</div>
        </body>
      </html>
    `);
    
    await Pattr.start();
    
    expect(document.getElementById('test').style.display).not.toBe('none');
  });
});
