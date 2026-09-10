import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom } from '../helpers/dom.js';
import { parseRoute, createRouter } from '../../assets/js/admin/router.js';

test('parseRoute maps each hash pattern to a route name, params and query', () => {
  assert.deepEqual(parseRoute('#/students'), { name: 'students', params: {}, query: {} });
  assert.deepEqual(parseRoute('#/students?tab=old'), { name: 'students', params: {}, query: { tab: 'old' } });
  assert.deepEqual(parseRoute('#/students/u1'), { name: 'student', params: { uid: 'u1' }, query: {} });
  assert.deepEqual(parseRoute('#/students/u1/results/python-1'), {
    name: 'results', params: { uid: 'u1', courseId: 'python-1' }, query: {}
  });
});

test('parseRoute returns null for empty and unknown hashes', () => {
  assert.equal(parseRoute(''), null);
  assert.equal(parseRoute('#'), null);
  assert.equal(parseRoute('#/nope'), null);
  assert.equal(parseRoute('#/students/u1/extra'), null);
});

let dom, log, routes, ctx;
beforeEach(() => {
  dom = setupDom();
  log = [];
  const view = name => ({
    mount(root, route) {
      log.push(['mount', name, route.params, route.query]);
      root.innerHTML = `<p>${name}</p>`;
      return { dispose: () => log.push(['dispose', name]), ready: Promise.resolve() };
    }
  });
  routes = { students: view('students'), student: view('student'), results: view('results') };
  ctx = {};
});

test('start with no hash mounts the students view and writes the default hash', async () => {
  const router = createRouter({ window: dom.window, root: dom.root, routes, ctx });
  await router.start();
  assert.deepEqual(log, [['mount', 'students', {}, {}]]);
  assert.equal(dom.window.location.hash, '#/students');
  assert.equal(dom.root.textContent, 'students');
  assert.equal(ctx.navigate, router.navigate);
});

test('start on a deep link mounts that view directly', async () => {
  dom.window.location.hash = '#/students/u1/results/linux';
  const router = createRouter({ window: dom.window, root: dom.root, routes, ctx });
  await router.start();
  assert.deepEqual(log, [['mount', 'results', { uid: 'u1', courseId: 'linux' }, {}]]);
});

test('navigate disposes the current view before mounting the next and updates the hash', async () => {
  const router = createRouter({ window: dom.window, root: dom.root, routes, ctx });
  await router.start();
  await router.navigate('#/students/u1');
  assert.deepEqual(log, [
    ['mount', 'students', {}, {}],
    ['dispose', 'students'],
    ['mount', 'student', { uid: 'u1' }, {}]
  ]);
  assert.equal(dom.window.location.hash, '#/students/u1');
  assert.equal(dom.root.textContent, 'student');
});

test('a hashchange from the browser (back button) mounts the matching view once', async () => {
  const router = createRouter({ window: dom.window, root: dom.root, routes, ctx });
  await router.start();
  await router.navigate('#/students/u1');
  dom.window.location.hash = '#/students?tab=old';
  await new Promise(resolve => setTimeout(resolve, 0));
  await router.ready();
  assert.deepEqual(log.slice(3), [['dispose', 'student'], ['mount', 'students', {}, { tab: 'old' }]]);
});

test('an unknown hash falls back to the students view', async () => {
  dom.window.location.hash = '#/bogus';
  const router = createRouter({ window: dom.window, root: dom.root, routes, ctx });
  await router.start();
  assert.deepEqual(log, [['mount', 'students', {}, {}]]);
  assert.equal(dom.window.location.hash, '#/students');
});

test('stop removes the hashchange listener', async () => {
  const router = createRouter({ window: dom.window, root: dom.root, routes, ctx });
  await router.start();
  router.stop();
  dom.window.location.hash = '#/students/u1';
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(log.length, 1);
});
