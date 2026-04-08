import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';

// Load pattr.js source
export const pattrSource = readFileSync('./pattr.js', 'utf-8');

export function setupPattr(html) {
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'http://localhost/',
  });
  const window = dom.window;
  const document = window.document;

  // JSDOM does not provide requestAnimationFrame.
  // Polyfill it to invoke callbacks synchronously: by the time pattr calls rAF the
  // DOM has already been updated by walkDom, so immediate invocation is correct
  // and avoids any async/timer complexity in tests.
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (callback) => { callback(0); return 1; };
    window.cancelAnimationFrame = () => {};
  }

  // Execute pattr.js in the JSDOM context (without auto-start)
  const script = document.createElement('script');
  script.textContent = pattrSource.replace('window.Pattr.start()', '// Auto-start disabled for tests');
  document.head.appendChild(script);
  
  return { dom, window, document, Pattr: window.Pattr };
}
