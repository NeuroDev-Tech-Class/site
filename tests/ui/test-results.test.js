import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom, click, text, settle } from '../helpers/dom.js';
import { makeCtx } from '../helpers/admin-ctx.js';
import { testResultsView } from '../../assets/js/admin/views/test-results.js';

let dom;
beforeEach(() => { dom = setupDom(); });

const courseStructure = [
  { title: 'Unit 1 <Basics>', content: [
    { type: 'video', title: 'Intro video' },
    { type: 'html', html: '<p>Read <em>this</em> first</p>' },
    { url: 'https://docs.google.com/forms/d/x' }
  ] },
  { title: 'Unit 2', content: [{ url: 'https://docs.google.com/presentation/d/y', title: 'Slides' }] }
];

async function mount(uid = 'c1', courseId = 'python-1', options = {}) {
  const made = makeCtx(options);
  const view = testResultsView.mount(dom.root, { params: { uid, courseId }, query: {} }, made.ctx);
  await view.ready;
  return { ...made, view };
}

const cards = () => [...dom.root.querySelectorAll('.test-result-card')];

test('renders one card per result under the course prefix, sorted, with scores and escaped answers', async () => {
  await mount();
  assert.equal(text(dom.root.querySelector('h1')), 'Python I - Programming Fundamentals');
  assert.equal(text(dom.root.querySelector('.student-view-header .dashboard-subtitle')), 'Cee Current');
  assert.equal(cards().length, 2);
  const [first, second] = cards();
  assert.equal(text(first.querySelector('h3')), 'Unit 1 Test');
  assert.equal(text(first.querySelector('.test-score')), '8 / 10 (80%)');
  assert.ok(first.querySelector('.test-score').classList.contains('pass'));
  assert.equal(text(first.querySelector('.test-date')), 'Jun 1, 2026');
  assert.equal(text(second.querySelector('.test-score')), 'Not graded');
  assert.equal(second.querySelector('.grade-input').value, '');
  assert.equal(first.querySelector('b'), null);
  assert.equal(text(first.querySelector('.answer-value')), '<b>bold</b>');
});

test('shows an empty state when the course has no results', async () => {
  await mount('c1', 'gimp');
  assert.equal(cards().length, 0);
  assert.match(text(dom.root), /No test results for this course yet/);
});

test('renders the course checklist with progress marks and escaped titles once the structure loads', async () => {
  await mount('c1', 'python-1', { courseStructure });
  await settle();
  const items = [...dom.root.querySelectorAll('.checklist-item')];
  assert.equal(items.length, 4);
  assert.deepEqual(items.map(i => i.classList.contains('checked')), [true, true, false, false]);
  assert.deepEqual(items.map(i => text(i.querySelector('.checklist-type-badge'))), ['Video', 'Reading', 'Test', 'Slides']);
  assert.deepEqual(items.map(i => text(i.querySelector('.checklist-title'))), ['Intro video', 'Read this first', 'Untitled Task', 'Slides']);
  assert.equal(text(dom.root.querySelector('.checklist-unit h3')), 'Unit 1 <Basics>');
  assert.equal(dom.root.querySelector('.checklist-unit h3 em'), null);
});

test('saving a score merges the graded result into the testResults document and re-renders', async () => {
  const { fs } = await mount();
  const card = cards()[1];
  card.querySelector('.grade-input').value = '9';
  click(card.querySelector('[data-action="save-score"]'));
  await settle();

  const stored = fs.get('testResults/cee@x.com');
  assert.deepEqual(stored['python-1_unit-2-test'], {
    score: 9, total: 10, submittedAt: '2026-06-05T12:00:00.000Z', answers: {},
    gradedAt: '2026-09-10T15:00:00.000Z', gradedBy: 'me'
  });
  assert.equal(stored['python-1_unit-1-test'].score, 8);
  assert.deepEqual(fs.writes.map(w => [w.type, w.path, w.options]), [['set', 'testResults/cee@x.com', { merge: true }]]);
  assert.equal(text(cards()[1].querySelector('.test-score')), '9 / 10 (90%)');
});

test('rejects negative and over-total scores without writing', async () => {
  const { fs, calls } = await mount();
  const input = cards()[1].querySelector('.grade-input');
  input.value = '-1';
  click(cards()[1].querySelector('[data-action="save-score"]'));
  await settle();
  input.value = '11';
  click(cards()[1].querySelector('[data-action="save-score"]'));
  await settle();
  assert.deepEqual(calls.alerts, ['Enter a valid score of 0 or higher.', 'Score cannot be higher than 10.']);
  assert.deepEqual(fs.writes, []);
});

test('the back button returns to the student route', async () => {
  const { calls } = await mount();
  click(dom.root.querySelector('[data-action="back"]'));
  assert.deepEqual(calls.navigate, ['#/students/c1']);
});

test('a missing student sends the admin back to the list', async () => {
  const { calls } = await mount('nobody');
  assert.deepEqual(calls.navigate, ['#/students']);
});
