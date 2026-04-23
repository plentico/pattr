import { describe, test, expect, vi, afterEach } from 'vitest';
import { setupPattr } from './setup.js';

describe('p-model checkbox', () => {
  function fireChange(window, el, checked) {
    el.checked = checked;
    el.dispatchEvent(new window.Event('change', { bubbles: true }));
  }

  test('checkbox initial checked state from true boolean', () => {
    const { document, Pattr } = setupPattr(`<!DOCTYPE html>
      <html>
        <head>
          <script id="p-root-data" type="application/json">
            {"active": true}
          </script>
        </head>
        <body>
          <input type="checkbox" p-model="active" />
        </body>
      </html>
    `);

    Pattr.start();

    const checkbox = document.querySelector('input[type="checkbox"]');
    expect(checkbox.checked).toBe(true);
  });

  test('checkbox initial checked state from false boolean', () => {
    const { document, Pattr } = setupPattr(`<!DOCTYPE html>
      <html>
        <head>
          <script id="p-root-data" type="application/json">
            {"active": false}
          </script>
        </head>
        <body>
          <input type="checkbox" p-model="active" />
        </body>
      </html>
    `);

    Pattr.start();

    const checkbox = document.querySelector('input[type="checkbox"]');
    expect(checkbox.checked).toBe(false);
  });

  test('checkbox change event updates bound boolean', () => {
    const { window, document, Pattr } = setupPattr(`<!DOCTYPE html>
      <html>
        <head>
          <script id="p-root-data" type="application/json">
            {"active": false}
          </script>
        </head>
        <body>
          <input type="checkbox" p-model="active" />
          <span id="display" p-text="active"></span>
        </body>
      </html>
    `);

    Pattr.start();

    const checkbox = document.querySelector('input[type="checkbox"]');
    expect(checkbox.checked).toBe(false);

    fireChange(window, checkbox, true);

    expect(checkbox.checked).toBe(true);
    expect(document.querySelector('#display').innerText).toBe('true');
  });

  test('checkbox reactive update from data change', () => {
    const { document, Pattr } = setupPattr(`<!DOCTYPE html>
      <html>
        <head>
          <script id="p-root-data" type="application/json">
            {"active": false}
          </script>
        </head>
        <body>
          <input type="checkbox" p-model="active" />
          <button p-on:click="active = true">Activate</button>
        </body>
      </html>
    `);

    Pattr.start();

    const checkbox = document.querySelector('input[type="checkbox"]');
    expect(checkbox.checked).toBe(false);

    const button = document.querySelector('button');
    button.click();

    expect(checkbox.checked).toBe(true);
  });

  test('checkbox in a loop binds to correct array item', () => {
    const { window, document, Pattr } = setupPattr(`<!DOCTYPE html>
      <html>
        <head>
          <script id="p-root-data" type="application/json">
            {"items": [true, false, true]}
          </script>
        </head>
        <body>
          <template p-for="[i, item] of items.entries()">
            <div>
              <input type="checkbox" p-model="items[i]" />
            </div>
          </template>
        </body>
      </html>
    `);

    Pattr.start();

    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(3);
    expect(checkboxes[0].checked).toBe(true);
    expect(checkboxes[1].checked).toBe(false);
    expect(checkboxes[2].checked).toBe(true);

    // Toggle the middle checkbox
    fireChange(window, checkboxes[1], true);

    const updated = document.querySelectorAll('input[type="checkbox"]');
    expect(updated[0].checked).toBe(true);
    expect(updated[1].checked).toBe(true);
    expect(updated[2].checked).toBe(true);
  });

  test('checkbox truthy/falsy values coerce correctly', () => {
    const { document, Pattr } = setupPattr(`<!DOCTYPE html>
      <html>
        <head>
          <script id="p-root-data" type="application/json">
            {"a": 1, "b": 0, "c": "yes", "d": ""}
          </script>
        </head>
        <body>
          <input id="a" type="checkbox" p-model="a" />
          <input id="b" type="checkbox" p-model="b" />
          <input id="c" type="checkbox" p-model="c" />
          <input id="d" type="checkbox" p-model="d" />
        </body>
      </html>
    `);

    Pattr.start();

    expect(document.querySelector('#a').checked).toBe(true);
    expect(document.querySelector('#b').checked).toBe(false);
    expect(document.querySelector('#c').checked).toBe(true);
    expect(document.querySelector('#d').checked).toBe(false);
  });
});
