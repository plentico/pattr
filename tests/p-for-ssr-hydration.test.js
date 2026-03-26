import { describe, it, expect } from 'vitest';
import { setupPattr } from './setup.js';

describe('p-for SSR hydration', () => {
  describe('Scope ID Reuse', () => {
    it('should reuse SSR scope IDs instead of generating new ones', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{
              "items": ["a", "b", "c"]
            }</script>
          </head>
          <body>
            <template p-for="item of items">
              <div p-text="item"></div>
            </template>
            <div p-for-key="s5:0">a</div>
            <div p-for-key="s5:1">b</div>
            <div p-for-key="s5:2">c</div>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      // Should only have 3 divs (hydrated from SSR), not 6 (duplicated)
      const divs = document.querySelectorAll('div[p-for-key]');
      expect(divs.length).toBe(3);
      
      // All keys should maintain the SSR scope ID (s5)
      expect(divs[0].getAttribute('p-for-key')).toBe('s5:0');
      expect(divs[1].getAttribute('p-for-key')).toBe('s5:1');
      expect(divs[2].getAttribute('p-for-key')).toBe('s5:2');
      
      // Content should remain correct
      expect(divs[0].innerText).toBe('a');
      expect(divs[1].innerText).toBe('b');
      expect(divs[2].innerText).toBe('c');
    });

    it('should hydrate SSR array destructuring without duplicating', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{
              "entries": [["name", "Alice"], ["age", 30]]
            }</script>
          </head>
          <body>
            <template p-for="[k, v] of entries">
              <div p-text="\`\${k}: \${v}\`"></div>
            </template>
            <div p-for-key="s10:0">name: Alice</div>
            <div p-for-key="s10:1">age: 30</div>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      // Should only have 2 divs (hydrated), not 4 (duplicated)
      const divs = document.querySelectorAll('div[p-for-key]');
      expect(divs.length).toBe(2);
      
      // Check content is correct
      expect(divs[0].innerText).toBe('name: Alice');
      expect(divs[1].innerText).toBe('age: 30');
      
      // Check scope IDs are maintained
      expect(divs[0].getAttribute('p-for-key')).toBe('s10:0');
      expect(divs[1].getAttribute('p-for-key')).toBe('s10:1');
    });

    it('should hydrate SSR object destructuring without duplicating', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{
              "people": [
                {"name": "Alice", "age": 25},
                {"name": "Bob", "age": 30}
              ]
            }</script>
          </head>
          <body>
            <template p-for="{name, age} of people">
              <div p-text="\`\${name}: \${age}\`"></div>
            </template>
            <div p-for-key="s7:0">Alice: 25</div>
            <div p-for-key="s7:1">Bob: 30</div>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      // Should only have 2 divs (hydrated), not 4 (duplicated)
      const divs = document.querySelectorAll('div[p-for-key]');
      expect(divs.length).toBe(2);
      
      // Check content
      expect(divs[0].innerText).toBe('Alice: 25');
      expect(divs[1].innerText).toBe('Bob: 30');
    });
  });

  describe('Mixed Loops and SSR', () => {
    it('should hydrate some items from SSR and create new ones as needed', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{
              "items": ["a", "b", "c", "d"]
            }</script>
          </head>
          <body>
            <template p-for="item of items">
              <div p-text="item"></div>
            </template>
            <div p-for-key="s6:0">a</div>
            <div p-for-key="s6:1">b</div>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      // Should have 4 divs total (2 hydrated + 2 created)
      const divs = document.querySelectorAll('div[p-for-key]');
      expect(divs.length).toBe(4);
      
      // First 2 should be hydrated SSR elements
      expect(divs[0].innerText).toBe('a');
      expect(divs[1].innerText).toBe('b');
      
      // Last 2 should be newly created
      expect(divs[2].innerText).toBe('c');
      expect(divs[3].innerText).toBe('d');
      
      // All should have same scope prefix
      expect(divs[0].getAttribute('p-for-key')).toBe('s6:0');
      expect(divs[1].getAttribute('p-for-key')).toBe('s6:1');
      expect(divs[2].getAttribute('p-for-key')).toBe('s6:2');
      expect(divs[3].getAttribute('p-for-key')).toBe('s6:3');
    });

    it('should remove extra SSR elements when data has fewer items', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{
              "items": ["a", "b"]
            }</script>
          </head>
          <body>
            <template p-for="item of items">
              <div p-text="item"></div>
            </template>
            <div p-for-key="s8:0">a</div>
            <div p-for-key="s8:1">b</div>
            <div p-for-key="s8:2">c</div>
            <div p-for-key="s8:3">d</div>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      // Should only have 2 divs (extra SSR elements removed)
      const divs = document.querySelectorAll('div[p-for-key]');
      expect(divs.length).toBe(2);
      
      expect(divs[0].innerText).toBe('a');
      expect(divs[1].innerText).toBe('b');
    });
  });

  describe('Nested Loops with SSR', () => {
    it('should maintain hierarchical scope IDs in nested loops', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{
              "groups": [
                {"name": "Group A", "items": ["a1", "a2"]}
              ]
            }</script>
          </head>
          <body>
            <template p-for="{name, items} of groups">
              <div p-text="name"></div>
              <template p-for="item of items">
                <span p-text="item"></span>
              </template>
            </template>
            <div p-for-key="s9:0">Group A</div>
            <span p-for-key="s9:0-s10:0">a1</span>
            <span p-for-key="s9:0-s10:1">a2</span>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      // Check outer loop elements
      const outerDivs = document.querySelectorAll('div[p-for-key^="s9:"]');
      expect(outerDivs.length).toBe(1);
      
      // Check nested loop elements maintain hierarchical keys
      const nestedSpans = document.querySelectorAll('span[p-for-key*="-"]');
      expect(nestedSpans.length).toBe(2); // a1, a2
      
      // Verify no duplicates
      const allForKeys = document.querySelectorAll('[p-for-key]');
      const uniqueKeys = new Set(Array.from(allForKeys).map(el => el.getAttribute('p-for-key')));
      expect(allForKeys.length).toBe(uniqueKeys.size); // No duplicate keys
    });
  });
});
