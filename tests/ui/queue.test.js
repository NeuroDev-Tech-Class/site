import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom, click, keydown, setValue, settle, text } from '../helpers/dom.js';
import { makeCtx } from '../helpers/admin-ctx.js';
import { queueView } from '../../assets/js/admin/views/queue.js';

let dom, fs, ctx, calls, view;
beforeEach(() => {
  dom = setupDom();
  ({ fs, ctx, calls } = makeCtx());
});

async function mount(query = {}) {
  ctx.store.subscribeQueue(ctx.submissions);
  view = queueView.mount(dom.root, { name: 'queue', params: {}, query }, ctx);
  await view.ready;
  await settle();
}

const rows = () => [...dom.root.querySelectorAll('tbody tr[data-id]')];
const ids = () => rows().map(r => r.dataset.id);

test('lists ungraded submissions oldest first with student, item and waiting time', async () => {
  await mount();
  assert.equal(text(dom.root.querySelector('h1')), 'Grading Queue');
  assert.deepEqual(ids(), ['c2__python-1_unit-1-test__1', 'c1__python-1_unit-2-test__1']);
  assert.match(text(rows()[0]), /Evil/);
  assert.match(text(rows()[0]), /Unit 1 Test/);
  assert.match(text(rows()[0]), /99 days/);
  assert.match(text(rows()[1]), /97 days/);
  assert.match(text(rows()[1]), /Not graded/);
});

test('the course filter narrows the list and lands in the query string', async () => {
  await mount();
  setValue(dom.root.querySelector('#queue-course'), 'linux');
  await settle();
  assert.equal(rows().length, 0);
  assert.match(text(dom.root.querySelector('tbody')), /Nothing waiting for grading/);
  assert.equal(dom.window.location.hash, '#/queue?course=linux');
  setValue(dom.root.querySelector('#queue-course'), 'python-1');
  await settle();
  assert.equal(rows().length, 2);
});

test('the student filter matches name or email, case-insensitive', async () => {
  await mount();
  setValue(dom.root.querySelector('#queue-student'), 'EVIL');
  await settle();
  assert.deepEqual(ids(), ['c2__python-1_unit-1-test__1']);
  assert.equal(dom.window.location.hash, '#/queue?student=EVIL');
});

test('filters passed in the query string apply on mount', async () => {
  await mount({ student: 'cee' });
  assert.deepEqual(ids(), ['c1__python-1_unit-2-test__1']);
  assert.equal(dom.root.querySelector('#queue-student').value, 'cee');
});

test('clicking a row, or pressing Enter on it, opens the grade screen', async () => {
  await mount();
  click(rows()[1].querySelector('td'));
  keydown(rows()[0], 'Enter');
  assert.deepEqual(calls.navigate, ['#/grade/c1__python-1_unit-2-test__1', '#/grade/c2__python-1_unit-1-test__1']);
});

test('Grade next opens the oldest visible submission', async () => {
  await mount();
  click(dom.root.querySelector('#queue-grade-next'));
  assert.deepEqual(calls.navigate, ['#/grade/c2__python-1_unit-1-test__1']);
});

test('a submission graded elsewhere leaves the table live', async () => {
  await mount();
  await fs.updateDoc(fs.doc(fs.db, 'submissions', 'c2__python-1_unit-1-test__1'), { status: 'graded' });
  await settle();
  assert.deepEqual(ids(), ['c1__python-1_unit-2-test__1']);
});

test('student names render as text, never markup', async () => {
  await mount();
  assert.equal(dom.root.querySelector('img'), null);
});

test('dispose removes the store listener', async () => {
  await mount();
  view.dispose();
  await fs.updateDoc(fs.doc(fs.db, 'submissions', 'c2__python-1_unit-1-test__1'), { status: 'graded' });
  await settle();
  assert.equal(rows().length, 2);
});
