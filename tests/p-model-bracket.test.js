import { describe, test, expect, vi, afterEach } from 'vitest';
import { setupPattr } from './setup.js';

/**
 * p-model bracket-notation tests
 *
 * Demonstrates the recommended approach for editing individual array items:
 *
 *   <template p-for="[i, item] of items.entries()">
 *     <input type="text" p-model="items[i]" />
 *   </template>
 *
 * No hidden input or manual array-sync workaround is needed.
 * The bracket-notation handler splits at the LAST '[' to evaluate the
 * container and key separately, avoiding the `with`-statement variable-
 * shadowing bug that occurs when a loop variable is also named `value`.
 */
describe('p-model bracket notation', () => {
  // Helper: fire an input event on an element with a new value
  function fireInput(window, el, newValue) {
    el.value = newValue;
    el.dispatchEvent(new window.Event('input', { bubbles: true }));
  }

  test('p-model="items[i]" in a loop edits the correct array item', () => {
    const { window, document, Pattr } = setupPattr(`<!DOCTYPE html>
      <html>
        <head>
          <script id="p-root-data" type="application/json">
            {"items": ["cat", "dog", "pig"]}
          </script>
        </head>
        <body>
          <template p-for="[i, item] of items.entries()">
            <div>
              <input type="text" p-model="items[i]" />
              <span p-text="item"></span>
            </div>
          </template>
        </body>
      </html>
    `);

    Pattr.start();

    // Three inputs should exist after hydration
    const inputs = document.querySelectorAll('input[p-model]');
    expect(inputs.length).toBe(3);
    expect(inputs[0].value).toBe('cat');
    expect(inputs[1].value).toBe('dog');
    expect(inputs[2].value).toBe('pig');

    // Edit the second item
    fireInput(window, inputs[1], 'wolf');

    // Re-query after re-render
    const updatedInputs = document.querySelectorAll('input[p-model]');
    expect(updatedInputs[1].value).toBe('wolf');

    // The span next to it should also update
    const spans = document.querySelectorAll('span[p-text]');
    expect(spans[1].innerText).toBe('wolf');

    // Other items unchanged
    expect(updatedInputs[0].value).toBe('cat');
    expect(updatedInputs[2].value).toBe('pig');
  });

  test('p-model="items[0]" (static index, no loop) edits the correct item', () => {
    const { window, document, Pattr } = setupPattr(`<!DOCTYPE html>
      <html>
        <head>
          <script id="p-root-data" type="application/json">
            {"items": ["alpha", "beta", "gamma"]}
          </script>
        </head>
        <body>
          <input id="first" type="text" p-model="items[0]" />
          <span id="display" p-text="items[0]"></span>
        </body>
      </html>
    `);

    Pattr.start();

    const input = document.querySelector('#first');
    expect(input.value).toBe('alpha');

    fireInput(window, input, 'zeta');

    expect(document.querySelector('#first').value).toBe('zeta');
    expect(document.querySelector('#display').innerText).toBe('zeta');
  });

  test('loop variable named "value" does not shadow the new input value', () => {
    // This guards against the with-statement shadowing bug:
    // `for [key, value] of Object.entries(data)` puts `value` in scope,
    // so `eval("with (scope) { data[key] = value }")` would silently write
    // the loop variable back to itself instead of the new input text.
    const { window, document, Pattr } = setupPattr(`<!DOCTYPE html>
      <html>
        <head>
          <script id="p-root-data" type="application/json">
            {"content": {"name": "Alice", "age": 30}}
          </script>
        </head>
        <body>
          <template p-for="[key, value] of Object.entries(content)">
            <div>
              <input type="text" p-model="content[key]" />
              <span p-text="\`\${key}: \${content[key]}\`"></span>
            </div>
          </template>
        </body>
      </html>
    `);

    Pattr.start();

    const inputs = document.querySelectorAll('input[p-model]');
    // Find the "name" input (order depends on Object.entries)
    const nameInput = Array.from(inputs).find(el => el.value === 'Alice');
    expect(nameInput).toBeTruthy();

    fireInput(window, nameInput, 'Bob');

    // The loop variable `value` must NOT have been used as the assigned value.
    // After re-render, the input must show "Bob", not "Alice" (the old loop variable).
    const updatedInputs = document.querySelectorAll('input[p-model]');
    const updatedName = Array.from(updatedInputs).find(el => el.value === 'Bob');
    expect(updatedName).toBeTruthy();

    // A stale "Alice" input would mean the bug is back
    const staleInput = Array.from(updatedInputs).find(el => el.value === 'Alice');
    expect(staleInput).toBeUndefined();
  });

  test('cursor position and focus are restored after loop re-render', () => {
    // When an input inside a p-for loop fires an `input` event, refreshLoop tears
    // down and recreates all loop elements, losing focus and cursor position.
    // Pattr saves selectionStart/selectionEnd before the re-render and restores
    // them via requestAnimationFrame (polyfilled synchronously in tests) after
    // refocusing the new input element.
    const { window, document, Pattr } = setupPattr(`<!DOCTYPE html>
      <html>
        <head>
          <script id="p-root-data" type="application/json">
            {"items": ["hello", "world"]}
          </script>
        </head>
        <body>
          <template p-for="[i, item] of items.entries()">
            <div>
              <input type="text" p-model="items[i]" />
            </div>
          </template>
        </body>
      </html>
    `);

    Pattr.start();

    const inputs = document.querySelectorAll('input[p-model]');
    const first = inputs[0];
    expect(first.value).toBe('hello');

    // Place cursor at position 3 ("hel|lo") then simulate deleting one character
    first.value = 'helo';
    first.setSelectionRange(3, 3);   // cursor after the deletion point

    // Fire the input event — this triggers:
    //   1. data update  (items[0] = 'helo')
    //   2. walkDom / refreshLoop  (loop re-creates all elements)
    //   3. requestAnimationFrame callback (synchronous in test env via setup.js polyfill)
    //      → focus() + setSelectionRange(3, 3) on the new input
    first.dispatchEvent(new window.Event('input', { bubbles: true }));

    // After the synchronous rAF polyfill ran, the new input should have cursor at 3
    const restored = document.querySelectorAll('input[p-model]')[0];
    expect(restored.value).toBe('helo');
    expect(restored.selectionStart).toBe(3);
    expect(restored.selectionEnd).toBe(3);
  });

  test('cursor position is restored in a NESTED loop (inner template scope ID stays stable)', () => {
    // Regression test: when an outer refreshLoop clones outerTemplate.content, the
    // inner <template p-for> clone loses its _forScopeId JS property (cloneNode does
    // not copy JS properties).  Without the data-p-for-scope-id attribute fix, each
    // refresh mints a NEW scope ID for the inner template, so p-for-key values change
    // on every render (e.g. "s0:1-s1:0" → "s0:1-s2:0") and the rAF querySelector
    // finds nothing → focus is dropped entirely.
    //
    // The HTML below mimics SSR output: the outer template has p-for-key siblings and
    // the inner template has p-for-key items inside each outer iteration.
    const { window, document, Pattr } = setupPattr(`<!DOCTYPE html>
      <html>
        <head>
          <script id="p-root-data" type="application/json">
            {"content": {"tags": ["js", "css", "html"]}}
          </script>
        </head>
        <body>
          <!-- outer loop template + SSR-rendered div.field elements -->
          <template p-for="[key, value] of Object.entries(content)">
            <div class="field">
              <div class="array-container" p-show="Array.isArray(value)">
                <!-- inner loop template (present in template content) -->
                <template p-for="[i, item] of content[key].entries()">
                  <div class="array-item">
                    <input type="text" p-model="content[key][i]" />
                  </div>
                </template>
                <!-- SSR-rendered inner items for the "tags" entry (outer key s0:0) -->
                <div class="array-item" p-for-key="s0:0-s1:0">
                  <input type="text" value="js" p-model="content[key][i]" />
                </div>
                <div class="array-item" p-for-key="s0:0-s1:1">
                  <input type="text" value="css" p-model="content[key][i]" />
                </div>
                <div class="array-item" p-for-key="s0:0-s1:2">
                  <input type="text" value="html" p-model="content[key][i]" />
                </div>
              </div>
            </div>
          </template>
          <!-- SSR-rendered outer item for "tags" -->
          <div class="field" p-for-key="s0:0">
            <div class="array-container" p-show="Array.isArray(value)">
              <template p-for="[i, item] of content[key].entries()">
                <div class="array-item">
                  <input type="text" p-model="content[key][i]" />
                </div>
              </template>
              <div class="array-item" p-for-key="s0:0-s1:0">
                <input type="text" value="js" p-model="content[key][i]" />
              </div>
              <div class="array-item" p-for-key="s0:0-s1:1">
                <input type="text" value="css" p-model="content[key][i]" />
              </div>
              <div class="array-item" p-for-key="s0:0-s1:2">
                <input type="text" value="html" p-model="content[key][i]" />
              </div>
            </div>
          </div>
        </body>
      </html>
    `);

    Pattr.start();

    // After start(), refreshAllLoops() re-renders from the outer template.
    // With the data-p-for-scope-id fix the inner scope ID "s1" is preserved from the
    // SSR HTML, so inner items keep p-for-key "s0:0-s1:0" etc.
    const inputs = document.querySelectorAll('input[p-model]');
    expect(inputs.length).toBe(3);
    expect(inputs[0].value).toBe('js');

    // Simulate editing "js" → "jsx", cursor at position 3
    inputs[0].value = 'jsx';
    inputs[0].setSelectionRange(3, 3);
    inputs[0].dispatchEvent(new window.Event('input', { bubbles: true }));

    // rAF is synchronous in tests (see setup.js polyfill).
    // The restored input must have the updated value AND cursor at position 3.
    const restored = document.querySelectorAll('input[p-model]')[0];
    expect(restored.value).toBe('jsx');
    expect(restored.selectionStart).toBe(3);
    expect(restored.selectionEnd).toBe(3);
  });

  test('nested brackets: p-model="content[key][i]" edits correct array element', () => {
    const { window, document, Pattr } = setupPattr(`<!DOCTYPE html>
      <html>
        <head>
          <script id="p-root-data" type="application/json">
            {"content": {"tags": ["js", "css", "html"]}}
          </script>
        </head>
        <body>
          <template p-for="[key, value] of Object.entries(content)">
            <div p-show="Array.isArray(value)">
              <template p-for="[i, item] of content[key].entries()">
                <input type="text" p-model="content[key][i]" />
              </template>
            </div>
          </template>
        </body>
      </html>
    `);

    Pattr.start();

    const inputs = document.querySelectorAll('input[p-model]');
    expect(inputs.length).toBe(3);
    expect(inputs[0].value).toBe('js');
    expect(inputs[1].value).toBe('css');
    expect(inputs[2].value).toBe('html');

    // Edit the middle item
    fireInput(window, inputs[1], 'sass');

    const updated = document.querySelectorAll('input[p-model]');
    expect(updated[0].value).toBe('js');
    expect(updated[1].value).toBe('sass');
    expect(updated[2].value).toBe('html');
  });
});
