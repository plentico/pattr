import { describe, test, expect, vi } from 'vitest';
import { setupPattr } from './setup.js';

describe('p-for array updates propagate to elements outside loop', () => {
  test('event handler calls walkDom and refreshAllLoops', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <script id="p-root-data" type="application/json">
            {"items": ["a", "b", "c"]}
          </script>
        </head>
        <body>
          <input p-model="items" />
          <template p-for="[i, item] of items.entries()">
            <div>
              <button p-on:click="items[i] = item + '!'">Add !</button>
            </div>
          </template>
        </body>
      </html>
    `;
    
    const { window, Pattr } = setupPattr(html);
    
    // Spy on walkDom to verify it's called after event handlers
    const walkDomSpy = vi.spyOn(Pattr, 'walkDom');
    
    // Initialize Pattr
    Pattr.start();
    
    // Get the button
    const button = Array.from(window.document.querySelectorAll('button')).find(el => el.hasAttribute('p-on:click'));
    
    // Clear spy after initialization
    walkDomSpy.mockClear();
    
    // Simulate clicking the button
    button.click();
    
    // Verify walkDom was called after event handler
    expect(walkDomSpy).toHaveBeenCalled();
    expect(walkDomSpy).toHaveBeenCalledWith(
      expect.any(Object), // root
      expect.any(Object), // data
      false               // isHydrating = false (refresh mode)
    );
    
    walkDomSpy.mockRestore();
  });

  test('array modifications trigger DOM refresh for p-model elements', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <script id="p-root-data" type="application/json">
            {"items": ["x", "y"]}
          </script>
        </head>
        <body>
          <input id="test-input" p-model="items" />
          <button id="test-btn" p-on:click="items[0] = 'z'">Change</button>
        </body>
      </html>
    `;
    
    const { window, document, Pattr } = setupPattr(html);
    
    Pattr.start();
    
    const input = document.querySelector('#test-input');
    const button = document.querySelector('#test-btn');
    
    // Initial value should be joined array
    expect(input.value).toBe('x, y');
    
    // Click button to change first item
    button.click();
    
    // The input should update
    expect(input.value).toBe('z, y');
  });
});
