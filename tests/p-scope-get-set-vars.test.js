import { describe, it, expect } from 'vitest';
import { setupPattr } from './setup.js';

/**
 * Tests for getter/setter object prop passing (one-way vs two-way binding).
 *
 * Pico compiles `{content}` to `p-scope="content = content;"` and
 * `{*content}` to `p-scope:sync="content = content;"`.
 *
 * The getter/setter objects produced by pico look like:
 *   { get name() { return name; }, set name(v) { name = v; }, ... }
 *
 * Without a shadow these setters write back to the parent scope's closure
 * variables, which would bypass p-scope isolation for non-sync props.
 *
 * Key invariants:
 *   • p-scope (non-sync)  — child reads live parent values but writes are local
 *   • p-scope:sync        — child reads AND writes propagate to parent
 *   • After a parent value changes and the DOM refreshes, the child's local
 *     overrides must be PRESERVED (no re-linking after parent update).
 */
describe('p-scope getter/setter object props', () => {

  // ---------------------------------------------------------------------------
  // Helper: build a minimal HTML doc that matches the real pico/pattr setup:
  //   • name and cats come from rawData (NOT set via p-scope on the html element)
  //     → they are NOT in outputVars, so parent-scope re-execution of
  //       `get_set_vars = {...}` can be triggered by a changedLocalVar "name".
  //   • html p-scope only defines get_set_vars (the getter/setter proxy)
  //   • child section uses the supplied p-scope attribute
  // ---------------------------------------------------------------------------
  function makeDoc(childPScope) {
    return `<!DOCTYPE html>
<html p-scope="get_set_vars = {get name() { return name; }, set name(v) { name = v; }, get cats() { return cats; }, set cats(v) { cats = v; }};">
  <head>
    <script id="p-root-data" type="application/json">{"name": "Bob", "cats": ["Ralph", "Betsy"]}</script>
  </head>
  <body>
    <div id="parent-name" p-text="name"></div>
    <button id="parent-change-name" p-on:click="name = 'Alice'">Change name</button>
    <button id="parent-change-cats" p-on:click="cats = ['Ralph', 'Betsy', 'NewCat']">Change cats</button>
    <section p-scope="${childPScope}">
      <div id="child-name" p-text="get_set_vars.name"></div>
      <input id="child-name-input" p-model="get_set_vars.name" />
    </section>
  </body>
</html>`;
  }

  // ---------------------------------------------------------------------------
  describe('non-sync (p-scope) — child writes are isolated from parent', () => {

    it('initial values read through live from parent', async () => {
      const { document, Pattr } = setupPattr(makeDoc('get_set_vars = get_set_vars;'));
      await Pattr.start();

      expect(document.getElementById('parent-name').innerText).toBe('Bob');
      expect(document.getElementById('child-name').innerText).toBe('Bob');
    });

    it('child write does NOT update the parent', async () => {
      const { document, window, Pattr } = setupPattr(makeDoc('get_set_vars = get_set_vars;'));
      await Pattr.start();

      const input = document.getElementById('child-name-input');
      input.value = 'ChildBob';
      input.dispatchEvent(new window.Event('input'));

      expect(document.getElementById('parent-name').innerText).toBe('Bob');     // parent unchanged
      expect(document.getElementById('child-name').innerText).toBe('ChildBob'); // child updated locally
    });

    it('parent update propagates to child display (getter reads live)', async () => {
      const { document, Pattr } = setupPattr(makeDoc('get_set_vars = get_set_vars;'));
      await Pattr.start();

      document.getElementById('parent-change-name').click();

      expect(document.getElementById('parent-name').innerText).toBe('Alice');
      // Child has no local override yet → getter reads through to parent
      expect(document.getElementById('child-name').innerText).toBe('Alice');
    });

    it('parent re-change propagates to child, clearing previous local override', async () => {
      const { document, window, Pattr } = setupPattr(makeDoc('get_set_vars = get_set_vars;'));
      await Pattr.start();

      // Step 1: child sets a local override
      const input = document.getElementById('child-name-input');
      input.value = 'ChildBob';
      input.dispatchEvent(new window.Event('input'));

      expect(document.getElementById('parent-name').innerText).toBe('Bob');
      expect(document.getElementById('child-name').innerText).toBe('ChildBob');

      // Step 2: parent changes its name — child's local override should be CLEARED
      // so the child reflects the new parent value (one-way binding: parent always wins)
      document.getElementById('parent-change-name').click();
      expect(document.getElementById('parent-name').innerText).toBe('Alice');
      expect(document.getElementById('child-name').innerText).toBe('Alice');

      // Step 3: child changes its value again — parent must NOT be updated
      input.value = 'ChildAlice';
      input.dispatchEvent(new window.Event('input'));

      expect(document.getElementById('parent-name').innerText).toBe('Alice'); // parent unchanged
      expect(document.getElementById('child-name').innerText).toBe('ChildAlice');
    });

    it('array writes are isolated from parent', async () => {
      const { document, window, Pattr } = setupPattr(`<!DOCTYPE html>
<html p-scope="cats = cats; get_set_vars = {get cats() { return cats; }, set cats(v) { cats = v; }};">
  <head>
    <script id="p-root-data" type="application/json">{"cats": ["Ralph", "Betsy"]}</script>
  </head>
  <body>
    <div id="parent-cats" p-text="cats.join(',')"></div>
    <section p-scope="get_set_vars = get_set_vars;">
      <div id="child-cats" p-text="get_set_vars.cats.join(',')"></div>
      <button id="child-add-cat" p-on:click="get_set_vars.cats = [...get_set_vars.cats, 'NewCat']">Add</button>
    </section>
  </body>
</html>`);
      await Pattr.start();

      expect(document.getElementById('parent-cats').innerText).toBe('Ralph,Betsy');
      expect(document.getElementById('child-cats').innerText).toBe('Ralph,Betsy');

      // Child adds a cat — parent's array should NOT change
      document.getElementById('child-add-cat').click();

      expect(document.getElementById('parent-cats').innerText).toBe('Ralph,Betsy'); // parent unchanged
      expect(document.getElementById('child-cats').innerText).toBe('Ralph,Betsy,NewCat');
    });

    it('in-place array element write does NOT propagate to parent', async () => {
      const { document, window, Pattr } = setupPattr(`<!DOCTYPE html>
<html p-scope="cats = cats; get_set_vars = {get cats() { return cats; }, set cats(v) { cats = v; }};">
  <head>
    <script id="p-root-data" type="application/json">{"cats": ["Ralph", "Betsy"]}</script>
  </head>
  <body>
    <div id="parent-cats" p-text="cats[0]"></div>
    <section p-scope="get_set_vars = get_set_vars;">
      <template p-for="[i, cat] of get_set_vars.cats.entries()">
        <input p-model="get_set_vars.cats[i]" />
      </template>
    </section>
  </body>
</html>`);
      await Pattr.start();

      const inputs = document.querySelectorAll('input');
      // First input corresponds to cats[0] = "Ralph"
      inputs[0].value = 'Kitty';
      inputs[0].dispatchEvent(new window.Event('input'));

      expect(document.getElementById('parent-cats').innerText).toBe('Ralph'); // parent unchanged
    });
  });

  // ---------------------------------------------------------------------------
  describe('sync (p-scope:sync) — child writes propagate to parent', () => {

    it('initial values read through live from parent', async () => {
      const { document, Pattr } = setupPattr(makeDoc('get_set_vars = get_set_vars;'));
      await Pattr.start();

      expect(document.getElementById('parent-name').innerText).toBe('Bob');
      expect(document.getElementById('child-name').innerText).toBe('Bob');
    });

    it('child write DOES update the parent (sync)', async () => {
      const { document, window, Pattr } = setupPattr(makeDoc(''));

      // Build doc with :sync version
      const { document: doc2, window: win2, Pattr: Pattr2 } = setupPattr(`<!DOCTYPE html>
<html p-scope="name = name; get_set_vars = {get name() { return name; }, set name(v) { name = v; }};">
  <head>
    <script id="p-root-data" type="application/json">{"name": "Bob"}</script>
  </head>
  <body>
    <div id="parent-name" p-text="name"></div>
    <section p-scope:sync="get_set_vars = get_set_vars;">
      <div id="child-name" p-text="get_set_vars.name"></div>
      <input id="child-name-input" p-model="get_set_vars.name" />
    </section>
  </body>
</html>`);
      await Pattr2.start();

      const input = doc2.getElementById('child-name-input');
      input.value = 'SyncChild';
      input.dispatchEvent(new win2.Event('input'));

      expect(doc2.getElementById('parent-name').innerText).toBe('SyncChild'); // parent updated
      expect(doc2.getElementById('child-name').innerText).toBe('SyncChild');
    });

    it('parent update reflects in both parent and synced child', async () => {
      const { document, Pattr } = setupPattr(`<!DOCTYPE html>
<html p-scope="name = name; get_set_vars = {get name() { return name; }, set name(v) { name = v; }};">
  <head>
    <script id="p-root-data" type="application/json">{"name": "Bob"}</script>
  </head>
  <body>
    <div id="parent-name" p-text="name"></div>
    <button id="parent-btn" p-on:click="name = 'Alice'">Change</button>
    <section p-scope:sync="get_set_vars = get_set_vars;">
      <div id="child-name" p-text="get_set_vars.name"></div>
    </section>
  </body>
</html>`);
      await Pattr.start();

      document.getElementById('parent-btn').click();

      expect(document.getElementById('parent-name').innerText).toBe('Alice');
      expect(document.getElementById('child-name').innerText).toBe('Alice');
    });
  });

});
