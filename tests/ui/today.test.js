import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom, click, settle, text } from '../helpers/dom.js';
import { makeCtx, seed } from '../helpers/admin-ctx.js';
import { todayView } from '../../assets/js/admin/views/today.js';

let dom, fs, ctx, calls, view;
beforeEach(() => {
  dom = setupDom();
  ({ fs, ctx, calls } = makeCtx());
});

const route = { name: 'today', params: {}, query: {} };

async function mount() {
  ctx.store.subscribeQueue(ctx.submissions);
  view = todayView.mount(dom.root, route, ctx);
  await view.ready;
  await settle();
}

const items = () => [...dom.root.querySelectorAll('.attention-item')];

test('tiles show awaiting grading, pending approvals and certificates this month', async () => {
  await mount();
  assert.equal(text(dom.root.querySelector('h1')), 'Today');
  assert.equal(text(dom.root.querySelector('#today-awaiting')), '2');
  assert.equal(text(dom.root.querySelector('#today-pending')), '1');
  assert.equal(text(dom.root.querySelector('#today-certs')), '1');
});

test('the attention list shows pending students first, then the oldest queue entries, one button each', async () => {
  await mount();
  const rows = items();
  assert.equal(rows.length, 3);
  assert.match(text(rows[0]), /Pat Pending/);
  assert.equal(text(rows[0].querySelector('button')), 'Approve');
  assert.match(text(rows[1]), /Evil/);
  assert.equal(text(rows[1].querySelector('button')), 'Grade');
  assert.match(text(rows[2]), /Cee Current/);
  assert.deepEqual(rows.map(r => r.querySelectorAll('button').length), [1, 1, 1]);
});

test('Approve confirms, writes, and removes the row without a reload', async () => {
  await mount();
  click(items()[0].querySelector('button'));
  await settle();
  assert.equal(calls.confirms.length, 1);
  assert.ok(fs.writes.some(w => w.type === 'update' && w.path === 'users/p1'));
  assert.equal(items().length, 2);
  assert.equal(text(dom.root.querySelector('#today-pending')), '0');
});

test('Grade navigates to the grade screen for that submission', async () => {
  await mount();
  click(items()[1].querySelector('button'));
  assert.deepEqual(calls.navigate, ['#/grade/c2__python-1_unit-1-test__1']);
});

test('a queue arriving after mount updates the tile and list live', async () => {
  view = todayView.mount(dom.root, route, ctx);
  await view.ready;
  assert.equal(text(dom.root.querySelector('#today-awaiting')), '—');
  ctx.store.subscribeQueue(ctx.submissions);
  await settle();
  assert.equal(text(dom.root.querySelector('#today-awaiting')), '2');
  assert.equal(items().length, 3);
});

test('student names render as text, never markup', async () => {
  await mount();
  assert.equal(dom.root.querySelector('img'), null);
});

test('with no pending students and an empty queue the view says nothing needs you', async () => {
  const quiet = Object.fromEntries(Object.entries(seed())
    .filter(([path]) => !path.startsWith('submissions/') && path !== 'users/p1'));
  ({ fs, ctx, calls } = makeCtx({ seed: quiet }));
  await mount();
  assert.equal(items().length, 0);
  assert.match(text(dom.root.querySelector('#attention-list')), /Nothing needs you right now/);
});

test('dispose removes the store listener', async () => {
  await mount();
  view.dispose();
  ctx.store.students = ctx.store.students.filter(s => s.id !== 'p1');
  ctx.store.emit();
  assert.equal(items().length, 3);
});
