import { JSDOM } from 'jsdom';

const GLOBALS = ['document', 'HTMLElement', 'DOMParser', 'Event', 'KeyboardEvent', 'MouseEvent', 'Node'];

export function setupDom() {
  const dom = new JSDOM(
    '<!doctype html><main id="main-content" class="dashboard"><div id="app"></div></main>',
    { url: 'http://localhost/site/admin.html' }
  );
  const { window } = dom;
  globalThis.window = window;
  for (const key of GLOBALS) globalThis[key] = window[key];
  return { window, document: window.document, root: window.document.getElementById('app') };
}

export function click(el) {
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
}

export function keydown(el, key) {
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

export function setValue(el, value) {
  el.value = value;
  el.dispatchEvent(new window.Event('input', { bubbles: true }));
}

export const text = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

const tick = () => new Promise(resolve => setTimeout(resolve, 0));

// Lets the view's awaited repo calls and re-render finish.
export async function settle() {
  for (let i = 0; i < 4; i++) await tick();
}
