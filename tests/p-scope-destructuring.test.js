import { describe, it, expect } from 'vitest';
import { setupPattr } from './setup.js';

describe('p-scope destructuring', () => {
  describe('Array Destructuring', () => {
    it('should destructure arrays in p-scope statements', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{
              "_p_children": {
                "child1": {
                  "_p_scope": "[a, b, c] = ['first', 'second', 'third']"
                }
              }
            }</script>
          </head>
          <body>
            <section p-id="child1" p-scope="[a, b, c] = ['first', 'second', 'third'];">
              <div id="a" p-text="a"></div>
              <div id="b" p-text="b"></div>
              <div id="c" p-text="c"></div>
            </section>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      expect(document.getElementById('a').innerText).toBe('first');
      expect(document.getElementById('b').innerText).toBe('second');
      expect(document.getElementById('c').innerText).toBe('third');
    });

    it('should destructure arrays with sequential statements', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{
              "_p_children": {
                "child1": {
                  "_p_scope": "[x, y] = [5, 10]; sum = x + y"
                }
              }
            }</script>
          </head>
          <body>
            <section p-id="child1" p-scope="[x, y] = [5, 10]; sum = x + y;">
              <div id="x" p-text="x"></div>
              <div id="y" p-text="y"></div>
              <div id="sum" p-text="sum"></div>
            </section>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      expect(document.getElementById('x').innerText).toBe('5');
      expect(document.getElementById('y').innerText).toBe('10');
      expect(document.getElementById('sum').innerText).toBe('15');
    });

    it('should destructure arrays from parent variables', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{
              "data": ["apple", "banana", "cherry"],
              "_p_children": {
                "child1": {
                  "_p_scope": "[first, second, third] = data"
                }
              }
            }</script>
          </head>
          <body>
            <section p-id="child1" p-scope="[first, second, third] = data;">
              <div id="first" p-text="first"></div>
              <div id="second" p-text="second"></div>
              <div id="third" p-text="third"></div>
            </section>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      expect(document.getElementById('first').innerText).toBe('apple');
      expect(document.getElementById('second').innerText).toBe('banana');
      expect(document.getElementById('third').innerText).toBe('cherry');
    });

    it('should handle partial array destructuring', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{
              "_p_children": {
                "child1": {
                  "_p_scope": "[first, second] = ['one', 'two', 'three', 'four']"
                }
              }
            }</script>
          </head>
          <body>
            <section p-id="child1" p-scope="[first, second] = ['one', 'two', 'three', 'four'];">
              <div id="first" p-text="first"></div>
              <div id="second" p-text="second"></div>
            </section>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      expect(document.getElementById('first').innerText).toBe('one');
      expect(document.getElementById('second').innerText).toBe('two');
    });
  });

  describe('Object Destructuring', () => {
    it('should destructure objects in p-scope statements', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{
              "_p_children": {
                "child1": {
                  "_p_scope": "{name, age} = {name: 'Alice', age: 30}"
                }
              }
            }</script>
          </head>
          <body>
            <section p-id="child1" p-scope="{name, age} = {name: 'Alice', age: 30};">
              <div id="name" p-text="name"></div>
              <div id="age" p-text="age"></div>
            </section>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      expect(document.getElementById('name').innerText).toBe('Alice');
      expect(document.getElementById('age').innerText).toBe('30');
    });

    it('should destructure objects with sequential statements', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{
              "_p_children": {
                "child1": {
                  "_p_scope": "{width, height} = {width: 100, height: 50}; area = width * height"
                }
              }
            }</script>
          </head>
          <body>
            <section p-id="child1" p-scope="{width, height} = {width: 100, height: 50}; area = width * height;">
              <div id="width" p-text="width"></div>
              <div id="height" p-text="height"></div>
              <div id="area" p-text="area"></div>
            </section>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      expect(document.getElementById('width').innerText).toBe('100');
      expect(document.getElementById('height').innerText).toBe('50');
      expect(document.getElementById('area').innerText).toBe('5000');
    });

    it('should destructure objects from parent variables', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{
              "user": {"name": "Bob", "role": "admin"},
              "_p_children": {
                "child1": {
                  "_p_scope": "{name, role} = user"
                }
              }
            }</script>
          </head>
          <body>
            <section p-id="child1" p-scope="{name, role} = user;">
              <div id="name" p-text="name"></div>
              <div id="role" p-text="role"></div>
            </section>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      expect(document.getElementById('name').innerText).toBe('Bob');
      expect(document.getElementById('role').innerText).toBe('admin');
    });

    it('should handle partial object destructuring', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{
              "_p_children": {
                "child1": {
                  "_p_scope": "{name, age} = {name: 'Charlie', age: 25, city: 'NYC', country: 'USA'}"
                }
              }
            }</script>
          </head>
          <body>
            <section p-id="child1" p-scope="{name, age} = {name: 'Charlie', age: 25, city: 'NYC', country: 'USA'};">
              <div id="name" p-text="name"></div>
              <div id="age" p-text="age"></div>
            </section>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      expect(document.getElementById('name').innerText).toBe('Charlie');
      expect(document.getElementById('age').innerText).toBe('25');
    });
  });

  describe('Mixed Destructuring', () => {
    it('should handle both array and object destructuring in same scope', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{
              "_p_children": {
                "child1": {
                  "_p_scope": "[x, y] = [1, 2]; {a, b} = {a: 'hello', b: 'world'}; result = x + y"
                }
              }
            }</script>
          </head>
          <body>
            <section p-id="child1" p-scope="[x, y] = [1, 2]; {a, b} = {a: 'hello', b: 'world'}; result = x + y;">
              <div id="x" p-text="x"></div>
              <div id="y" p-text="y"></div>
              <div id="a" p-text="a"></div>
              <div id="b" p-text="b"></div>
              <div id="result" p-text="result"></div>
            </section>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      expect(document.getElementById('x').innerText).toBe('1');
      expect(document.getElementById('y').innerText).toBe('2');
      expect(document.getElementById('a').innerText).toBe('hello');
      expect(document.getElementById('b').innerText).toBe('world');
      expect(document.getElementById('result').innerText).toBe('3');
    });

    it('should use destructured variables in subsequent statements', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
        <html>
          <head>
            <script id="p-root-data" type="application/json">{
              "_p_children": {
                "child1": {
                  "_p_scope": "[first, second] = ['Hello', 'World']; greeting = first + ' ' + second"
                }
              }
            }</script>
          </head>
          <body>
            <section p-id="child1" p-scope="[first, second] = ['Hello', 'World']; greeting = first + ' ' + second;">
              <div id="greeting" p-text="greeting"></div>
            </section>
          </body>
        </html>
      `);
      
      await Pattr.start();
      
      expect(document.getElementById('greeting').innerText).toBe('Hello World');
    });
  });
});
