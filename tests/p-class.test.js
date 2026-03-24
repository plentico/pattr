import { describe, it, expect } from 'vitest';
import { setupPattr } from './setup.js';

describe('p-class directive', () => {
  it('should apply class from string', async () => {
    const { document, Pattr } = setupPattr(`<!DOCTYPE html>
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
    const { document, Pattr } = setupPattr(`<!DOCTYPE html>
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
    const { document, Pattr } = setupPattr(`<!DOCTYPE html>
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
    const { document, Pattr } = setupPattr(`<!DOCTYPE html>
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

  describe('merging behavior', () => {
    it('should preserve static classes', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{"isActive": true}</script>
          </head>
          <body>
            <div id="test" class="animals p-xIdmCU" p-class="{'active': isActive}"></div>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      const className = document.getElementById('test').className;
      expect(className).toContain('animals');
      expect(className).toContain('p-xIdmCU');
      expect(className).toContain('active');
    });

    it('should merge string classes with static classes', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{"dynamicClass": "highlight"}</script>
          </head>
          <body>
            <div id="test" class="base-class" p-class="dynamicClass"></div>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      const className = document.getElementById('test').className;
      expect(className).toContain('base-class');
      expect(className).toContain('highlight');
    });

    it('should merge array classes with static classes', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{"dynamicClasses": ["dynamic1", "dynamic2"]}</script>
          </head>
          <body>
            <div id="test" class="static1 static2" p-class="dynamicClasses"></div>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      const className = document.getElementById('test').className;
      expect(className).toContain('static1');
      expect(className).toContain('static2');
      expect(className).toContain('dynamic1');
      expect(className).toContain('dynamic2');
    });

    it('should handle class collision - p-class takes precedence', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{"showAnimals": true}</script>
          </head>
          <body>
            <div id="test" class="animals collapsed" p-class="{'collapsed': !showAnimals}"></div>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      // Initially showAnimals=true, so collapsed should be removed (even though statically defined)
      const className = document.getElementById('test').className;
      expect(className).toContain('animals');
      expect(className).not.toContain('collapsed');
    });

    it('should add colliding class when condition becomes true', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{"isExpanded": false}</script>
          </head>
          <body>
            <div id="test" class="base expanded" p-class="{'expanded': isExpanded}"></div>
            <button id="btn" p-on:click="isExpanded = true">Expand</button>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      // Initially isExpanded=false, so expanded should be removed
      let className = document.getElementById('test').className;
      expect(className).toContain('base');
      expect(className).not.toContain('expanded');
      
      // Click to expand
      document.getElementById('btn').click();
      
      // Now expanded should be added back
      className = document.getElementById('test').className;
      expect(className).toContain('base');
      expect(className).toContain('expanded');
    });
  });

  describe('.replace modifier', () => {
    it('should replace all classes when using .replace modifier', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{"themeClass": "dark-theme"}</script>
          </head>
          <body>
            <div id="test" class="static-class another-static" p-class:replace="themeClass"></div>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      const className = document.getElementById('test').className;
      // Static classes should be replaced
      expect(className).toBe('dark-theme');
      expect(className).not.toContain('static-class');
    });

    it('should replace with object classes using .replace modifier', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{"isDark": true, "isLarge": false}</script>
          </head>
          <body>
            <div id="test" class="old-class" p-class:replace="{'dark-theme': isDark, 'large': isLarge}"></div>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      const className = document.getElementById('test').className;
      // Only dark-theme should be present, old-class should be gone
      expect(className).toBe('dark-theme');
    });
  });
});
