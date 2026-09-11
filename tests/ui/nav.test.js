import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom, text } from '../helpers/dom.js';
import { createStore } from '../../assets/js/admin/store.js';
import { mountNav } from '../../assets/js/admin/nav.js';

let dom, container, store, nav;
beforeEach(() => {
  dom = setupDom();
  container = dom.document.getElementById('admin-nav');
  store = createStore();
  nav = mountNav(container, store);
});

const links = () => [...container.querySelectorAll('a')];
const label = a => text(a.querySelector('.admin-nav-label'));
const active = () => links().filter(a => a.getAttribute('aria-current') === 'page').map(label);
const badge = () => container.querySelector('.nav-badge');

test('renders three links in fixed order with their hashes', () => {
  assert.equal(container.querySelector('nav').getAttribute('aria-label'), 'Admin');
  assert.deepEqual(links().map(label), ['Today', 'Grading Queue', 'Students']);
  assert.deepEqual(links().map(a => a.getAttribute('href')), ['#/today', '#/queue', '#/students']);
});

test('active state follows the route name, mapping detail routes to their section', () => {
  nav.setRoute({ name: 'today' });
  assert.deepEqual(active(), ['Today']);
  for (const name of ['queue', 'grade']) {
    nav.setRoute({ name });
    assert.deepEqual(active(), ['Grading Queue']);
  }
  for (const name of ['students', 'student']) {
    nav.setRoute({ name });
    assert.deepEqual(active(), ['Students']);
  }
});

test('the queue badge is hidden at zero, shows the count, and caps at 200+', () => {
  assert.equal(badge().hidden, true);
  store.queue = [];
  store.emit();
  assert.equal(badge().hidden, true);
  store.queue = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  store.emit();
  assert.equal(badge().hidden, false);
  assert.equal(text(badge()), '3');
  store.queue = Array.from({ length: 200 }, (_, i) => ({ id: `s${i}` }));
  store.emit();
  assert.equal(text(badge()), '200+');
});

test('a re-render keeps the active route highlighted', () => {
  nav.setRoute({ name: 'queue' });
  store.queue = [{ id: 'a' }];
  store.emit();
  assert.deepEqual(active(), ['Grading Queue']);
  assert.equal(text(badge()), '1');
});

test('dispose removes the store listener', () => {
  nav.dispose();
  store.queue = [{ id: 'a' }];
  store.emit();
  assert.equal(badge().hidden, true);
});
