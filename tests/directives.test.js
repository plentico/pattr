import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';

// Load pattr.js source
const pattrSource = readFileSync('./pattr.js', 'utf-8');

describe('Pattr Directive Unit Tests', () => {
  let dom;
  let window;
  let document;
  let Pattr;

  function setupPattr(html) {
    dom = new JSDOM(html, {
      runScripts: 'dangerously',
      url: 'http://localhost/',
    });
    window = dom.window;
    document = window.document;
    
    // Execute pattr.js in the JSDOM context (without auto-start)
    const script = document.createElement('script');
    script.textContent = pattrSource.replace('window.Pattr.start()', '// Auto-start disabled for tests');
    document.head.appendChild(script);
    
    Pattr = window.Pattr;
    return Pattr;
  }

  describe('p-class directive', () => {
    it('should apply class from string', async () => {
      setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{"myClass": "active"}</script>
          </head>
          <body>
            <div id="test" p-class="myClass"></div>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      expect(document.getElementById('test').className).toBe('active');
    });

    it('should apply classes from array', async () => {
      setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{"classes": ["one", "two", "three"]}</script>
          </head>
          <body>
            <div id="test" p-class="classes"></div>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      expect(document.getElementById('test').className).toBe('one two three');
    });

    it('should apply conditional classes from object', async () => {
      setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{"isActive": true, "isDisabled": false}</script>
          </head>
          <body>
            <div id="test" p-class="{'active': isActive, 'disabled': isDisabled}"></div>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      const className = document.getElementById('test').className;
      expect(className).toContain('active');
      expect(className).not.toContain('disabled');
    });

    it('should update classes when value changes', async () => {
      setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{"isActive": false}</script>
          </head>
          <body>
            <div id="test" p-class="{'active': isActive}"></div>
            <button id="btn" p-on:click="isActive = !isActive">Toggle</button>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      expect(document.getElementById('test').className).not.toContain('active');
      
      document.getElementById('btn').click();
      
      expect(document.getElementById('test').className).toContain('active');
    });
  });

  describe('p-style directive', () => {
    it('should apply styles from object', async () => {
      setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{"bgColor": "red", "fontSize": "20px"}</script>
          </head>
          <body>
            <div id="test" p-style="{'backgroundColor': bgColor, 'fontSize': fontSize}"></div>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      const style = document.getElementById('test').style;
      expect(style.backgroundColor).toBe('red');
      expect(style.fontSize).toBe('20px');
    });

    it('should apply styles from string', async () => {
      setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{"visible": true}</script>
          </head>
          <body>
            <div id="test" p-style="visible ? 'color: green' : 'color: red'"></div>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      expect(document.getElementById('test').style.color).toBe('green');
    });
  });

  describe('p-attr directive', () => {
    it('should remove attribute when value is null', async () => {
      setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{"isDisabled": null}</script>
          </head>
          <body>
            <button id="test" disabled p-attr:disabled="isDisabled">Click</button>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      expect(document.getElementById('test').hasAttribute('disabled')).toBe(false);
    });

    it('should remove attribute when value is false', async () => {
      setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{"isDisabled": false}</script>
          </head>
          <body>
            <button id="test" disabled p-attr:disabled="isDisabled">Click</button>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      expect(document.getElementById('test').hasAttribute('disabled')).toBe(false);
    });

    it('should set multiple attributes with object', async () => {
      setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{"id": "123", "role": "button"}</script>
          </head>
          <body>
            <div id="test" p-attr="{'data-id': id, 'data-role': role}"></div>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      const el = document.getElementById('test');
      expect(el.getAttribute('data-id')).toBe('123');
      expect(el.getAttribute('data-role')).toBe('button');
    });
  });

  describe('p-text directive', () => {
    it('should display computed expression', async () => {
      setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{"a": 5, "b": 3}</script>
          </head>
          <body>
            <div id="test" p-text="a + b"></div>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      expect(document.getElementById('test').innerText).toBe('8');
    });

    it('should handle null/undefined gracefully', async () => {
      setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{"value": null}</script>
          </head>
          <body>
            <div id="test" p-text="value"></div>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      expect(document.getElementById('test').innerText).toBe('null');
    });
  });

  describe('p-html directive', () => {
    it('should render HTML content', async () => {
      setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{"content": "<strong>Bold</strong> text"}</script>
          </head>
          <body>
            <div id="test" p-html="content"></div>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      const el = document.getElementById('test');
      expect(el.innerHTML).toBe('<strong>Bold</strong> text');
      expect(el.querySelector('strong')).not.toBeNull();
    });

    it('should filter tags with allow modifier', async () => {
      setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{"content": "<strong>Bold</strong><script>alert('xss')<\\/script>"}</script>
          </head>
          <body>
            <div id="test" p-html:allow.strong="content"></div>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      const el = document.getElementById('test');
      expect(el.querySelector('strong')).not.toBeNull();
      expect(el.querySelector('script')).toBeNull();
    });

    it('should trim HTML while preserving structure', async () => {
      setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{"content": "<em>This is a long text that should be trimmed</em>"}</script>
          </head>
          <body>
            <div id="test" p-html:trim.10="content"></div>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      const el = document.getElementById('test');
      // Use textContent instead of innerText (JSDOM compatibility)
      expect(el.textContent.length).toBeLessThanOrEqual(13); // 10 + "..."
      expect(el.querySelector('em')).not.toBeNull();
    });
  });

  describe('p-show directive', () => {
    it('should show element when true', async () => {
      setupPattr(`<!DOCTYPE html>
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
      setupPattr(`<!DOCTYPE html>
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
      setupPattr(`<!DOCTYPE html>
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

  describe('parseDirectiveModifiers', () => {
    it('should parse single modifier', () => {
      setupPattr(`<!DOCTYPE html><html><head></head><body></body></html>`);
      
      const result = Pattr.parseDirectiveModifiers('p-html:trim.100');
      
      expect(result.directive).toBe('p-html');
      expect(result.modifiers.trim).toEqual(['100']);
    });

    it('should parse multiple modifiers', () => {
      setupPattr(`<!DOCTYPE html><html><head></head><body></body></html>`);
      
      const result = Pattr.parseDirectiveModifiers('p-html:allow.strong.em:trim.50');
      
      expect(result.directive).toBe('p-html');
      expect(result.modifiers.allow).toEqual(['strong', 'em']);
      expect(result.modifiers.trim).toEqual(['50']);
    });

    it('should handle directive without modifiers', () => {
      setupPattr(`<!DOCTYPE html><html><head></head><body></body></html>`);
      
      const result = Pattr.parseDirectiveModifiers('p-text');
      
      expect(result.directive).toBe('p-text');
      expect(result.modifiers).toEqual({});
    });
  });
});

// NOTE: p-model advanced input types and p-for tests are better suited for 
// Playwright e2e tests due to JSDOM limitations with template.content and 
// input event simulation. See e2e/directives.spec.js for those tests.
