import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom } from '../helpers/dom.js';
import { parseRoute, createRouter } from '../../assets/js/admin/router.js';

test('parseRoute maps each hash pattern to a route name, params and query', () => {
  assert.deepEqual(parseRoute('#/today'), { name: 'today', params: {}, query: {} });
  assert.deepEqual(parseRoute('#/queue'), { name: 'queue', params: {}, query: {} });
  assert.deepEqual(parseRoute('#/queue?course=python-1&student=jane'), {
    name: 'queue', params: {}, query: { course: 'python-1', student: 'jane' }
  });
  assert.deepEqual(parseRoute('#/grade/u1__python-1_unit-1-test__1'), {
    name: 'grade', params: { id: 'u1__python-1_unit-1-test__1' }, query: {}
  });
  assert.deepEqual(parseRoute('#/students'), { name: 'students', params: {}, query: {} });
  assert.deepEqual(parseRoute('#/students?tab=old'), { name: 'students', params: {}, query: { tab: 'old' } });
  assert.deepEqual(parseRoute('#/students/u1'), { name: 'student', params: { uid: 'u1' }, query: {} });
  assert.deepEqual(parseRoute('#/students/u1/results/python-1'), {
    name: 'results', params: { uid: 'u1', courseId: 'python-1' }, query: {}
  });
  assert.deepEqual(parseRoute('#/activity'), { name: 'activity', params: {}, query: {} });
  assert.deepEqual(parseRoute('#/activity?type=account_approved&student=jane'), {
    name: 'activity', params: {}, query: { type: 'account_approved', student: 'jane' }
  });
});

test('parseRoute returns null for empty and unknown hashes', () => {
  assert.equal(parseRoute(''), null);
  assert.equal(parseRoute('#'), null);
  assert.equal(parseRoute('#/nope'), null);
  assert.equal(parseRoute('#/students/u1/extra'), null);
  assert.equal(parseRoute('#/activity/x'), null);
});

let dom, log, routed, routes, ctx;
beforeEach(() => {
  dom = setupDom();
  log = [];
  routed = [];
  const view = name => ({
    mount(root, route) {
      log.push(['mount', name, route.params, route.query]);
      root.innerHTML = `<h1>${name}</h1>`;
      return { dispose: () => log.push(['dispose', name]), ready: Promise.resolve() };
    }
  });
  routes = {
    today: view('today'), queue: view('queue'), grade: view('grade'),
    students: view('students'), student: view('student')
  };
  ctx = {};
});

const makeRouter = () => createRouter({
  window: dom.window, root: dom.root, routes, ctx, onRoute: route => routed.push(route.name)
});

test('start with no hash mounts the today view and writes the default hash', async () => {
  const router = makeRouter();
  await router.start();
  assert.deepEqual(log, [['mount', 'today', {}, {}]]);
  assert.equal(dom.window.location.hash, '#/today');
  assert.equal(dom.root.textContent, 'today');
  assert.equal(ctx.navigate, router.navigate);
});

test('start on a deep grade link mounts that view directly', async () => {
  dom.window.location.hash = '#/grade/u1__python-1_unit-1-test__1';
  const router = makeRouter();
  await router.start();
  assert.deepEqual(log, [['mount', 'grade', { id: 'u1__python-1_unit-1-test__1' }, {}]]);
});

test('an old results bookmark redirects to the student view and rewrites the hash', async () => {
  dom.window.location.hash = '#/students/u1/results/python-1';
  const router = makeRouter();
  await router.start();
  assert.deepEqual(log, [['mount', 'student', { uid: 'u1' }, {}]]);
  assert.equal(dom.window.location.hash, '#/students/u1');
  assert.deepEqual(routed, ['student']);
});

test('onRoute fires with the mounted route on every render, including the fallback redirect', async () => {
  dom.window.location.hash = '#/bogus';
  const router = makeRouter();
  await router.start();
  assert.deepEqual(routed, ['today']);
  await router.navigate('#/queue');
  assert.deepEqual(routed, ['today', 'queue']);
});

test('focus lands on the mounted view heading', async () => {
  const router = makeRouter();
  await router.start();
  const h1 = dom.root.querySelector('h1');
  assert.equal(dom.document.activeElement, h1);
  assert.equal(h1.getAttribute('tabindex'), '-1');
});

test('navigate disposes the current view before mounting the next and updates the hash', async () => {
  const router = makeRouter();
  await router.start();
  await router.navigate('#/students/u1');
  assert.deepEqual(log, [
    ['mount', 'today', {}, {}],
    ['dispose', 'today'],
    ['mount', 'student', { uid: 'u1' }, {}]
  ]);
  assert.equal(dom.window.location.hash, '#/students/u1');
  assert.equal(dom.root.textContent, 'student');
});

test('a hashchange from the browser (back button) mounts the matching view once', async () => {
  const router = makeRouter();
  await router.start();
  await router.navigate('#/students/u1');
  dom.window.location.hash = '#/students?tab=old';
  await new Promise(resolve => setTimeout(resolve, 0));
  await router.ready();
  assert.deepEqual(log.slice(3), [['dispose', 'student'], ['mount', 'students', {}, { tab: 'old' }]]);
});

test('an unknown hash falls back to the today view', async () => {
  dom.window.location.hash = '#/bogus';
  const router = makeRouter();
  await router.start();
  assert.deepEqual(log, [['mount', 'today', {}, {}]]);
  assert.equal(dom.window.location.hash, '#/today');
});

test('stop removes the hashchange listener', async () => {
  const router = makeRouter();
  await router.start();
  router.stop();
  dom.window.location.hash = '#/students/u1';
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(log.length, 1);
});
