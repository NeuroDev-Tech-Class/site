import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom, click, setValue, settle, text } from '../helpers/dom.js';
import { makeCtx } from '../helpers/admin-ctx.js';
import { gradeView } from '../../assets/js/admin/views/grade.js';

let dom, fs, ctx, calls, view;
beforeEach(() => {
  dom = setupDom();
  ({ fs, ctx, calls } = makeCtx());
});

async function mount(id) {
  ctx.store.subscribeQueue(ctx.submissions);
  await settle();
  view = gradeView.mount(dom.root, { name: 'grade', params: { id }, query: {} }, ctx);
  await view.ready;
  await settle();
}

const el = id => dom.root.querySelector(`#${id}`);
const save = async () => { click(el('grade-save')); await settle(); };
const lastGrade = () => fs.writes.findLast(w => w.type === 'update' && w.path.startsWith('submissions/'));

test('renders the header, escaped answers and the current score', async () => {
  await mount('c1__python-1_unit-1-test__1');
  assert.equal(text(dom.root.querySelector('h1')), 'Unit 1 Test');
  const header = text(dom.root.querySelector('.dashboard-subtitle'));
  assert.match(header, /Cee Current/);
  assert.match(header, /Python I - Programming Fundamentals/);
  assert.match(header, /Jun(e)? 1, 2026/);
  assert.match(header, /Passed/);
  const student = dom.root.querySelector('.dashboard-subtitle a');
  assert.equal(student.getAttribute('href'), '#/students/c1');
  assert.match(text(dom.root.querySelector('#grade-answers')), /What is a list\?/);
  assert.equal(dom.root.querySelector('#grade-answers b'), null);
  assert.equal(el('grade-score').value, '8');
  assert.equal(el('grade-feedback').value, 'Nice work.');
  assert.equal(text(el('grade-save')), 'Update grade');
  assert.equal(el('grade-outof'), null);
  assert.equal(dom.root.querySelector('a.back-btn').getAttribute('href'), '#/queue');
});

test('an ungraded submission shows Mark graded and an empty score', async () => {
  await mount('c1__python-1_unit-2-test__1');
  assert.equal(el('grade-score').value, '');
  assert.equal(text(el('grade-save')), 'Mark graded');
});

test('negative, blank and above-max scores are rejected', async () => {
  await mount('c1__python-1_unit-2-test__1');
  await save();
  setValue(el('grade-score'), '-1');
  await save();
  assert.deepEqual(calls.alerts, [
    'Enter a valid score of 0 or higher.',
    'Enter a valid score of 0 or higher.'
  ]);
  setValue(el('grade-score'), '11');
  await save();
  assert.equal(calls.alerts.at(-1), 'Score cannot be higher than 10.');
  assert.equal(lastGrade(), undefined);
});

test('a submission without a total shows the out-of input and requires it', async () => {
  await mount('c2__python-1_unit-1-test__1');
  assert.ok(el('grade-outof'));
  setValue(el('grade-score'), '7');
  await save();
  assert.equal(calls.alerts.at(-1), 'Enter the total this test is out of.');
  setValue(el('grade-outof'), '10');
  await save();
  const patch = lastGrade().data;
  assert.equal(patch.manualScore, 7);
  assert.equal(patch.totalMax, 10);
});

test('saving writes the grade and offers Grade next with the remaining count', async () => {
  await fs.setDoc(fs.doc(fs.db, 'submissions', 'o1__linux_unit-1-test__1'), {
    kind: 'test', studentUid: 'o1', studentName: 'Old One', studentEmail: 'old@x.com',
    courseId: 'linux', courseName: 'Introduction to Linux', itemId: 'linux_unit-1-test',
    itemTitle: 'Unit 1 Test', legacyKey: 'linux_unit-1-test', legacy: true, attempt: 1,
    status: 'needs_grading', answers: {}, autoScore: null, manualScore: null, totalMax: 5,
    totalScore: null, passed: null, provisional: false, feedback: '',
    submittedAt: '2026-07-01T12:00:00.000Z', submittedAtEstimated: false,
    gradedAt: null, gradedBy: null, createdAt: '2026-07-01T12:00:00.000Z', updatedAt: '2026-07-01T12:00:00.000Z'
  });
  await mount('c2__python-1_unit-1-test__1');
  setValue(el('grade-score'), '7');
  setValue(el('grade-outof'), '10');
  setValue(el('grade-feedback'), 'Look at unit 2 again.');
  await save();
  const patch = lastGrade().data;
  assert.equal(patch.status, 'graded');
  assert.equal(patch.feedback, 'Look at unit 2 again.');
  assert.equal(patch.gradedBy, 'me');
  assert.ok(patch.gradedAt);
  assert.ok(patch.updatedAt);
  assert.match(text(el('grade-message')), /Saved/);
  assert.equal(text(el('grade-next')), 'Grade next (2 left)');
  const subtitle = text(dom.root.querySelector('.dashboard-subtitle'));
  assert.match(subtitle, /Passed/);
  assert.doesNotMatch(subtitle, /Not passed|Waiting/);
  click(el('grade-next'));
  assert.equal(calls.navigate.at(-1), '#/grade/c1__python-1_unit-2-test__1');
});

test('grading the last submission offers Back to queue instead', async () => {
  await fs.updateDoc(fs.doc(fs.db, 'submissions', 'c2__python-1_unit-1-test__1'), { status: 'graded' });
  await mount('c1__python-1_unit-2-test__1');
  setValue(el('grade-score'), '9');
  await save();
  const patch = lastGrade().data;
  assert.equal(patch.totalMax, 10);
  assert.equal(el('grade-next'), null);
  assert.ok(el('grade-back'));
  click(el('grade-back'));
  assert.equal(calls.navigate.at(-1), '#/queue');
});

test('a missing submission sends the admin back to the queue', async () => {
  await mount('nope__nope__1');
  assert.deepEqual(calls.navigate, ['#/queue']);
});

test('dispose before load leaves the root untouched', async () => {
  view = gradeView.mount(dom.root, { name: 'grade', params: { id: 'c1__python-1_unit-1-test__1' }, query: {} }, ctx);
  view.dispose();
  await settle();
  assert.equal(el('grade-save'), null);
});
