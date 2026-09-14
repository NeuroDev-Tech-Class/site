import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom, setValue, settle, text } from '../helpers/dom.js';
import { makeCtx, NOW } from '../helpers/admin-ctx.js';
import { activityView } from '../../assets/js/admin/views/activity.js';

let dom, fs, ctx, view;
beforeEach(() => {
  dom = setupDom();
  ({ fs, ctx } = makeCtx());
});

async function mount(query = {}) {
  view = activityView.mount(dom.root, { name: 'activity', params: {}, query }, ctx);
  await view.ready;
  await settle();
  return view;
}

const rows = () => [...dom.root.querySelectorAll('.feed-item')];
const ids = () => rows().map(r => r.dataset.id);
const summaries = () => rows().map(r => text(r.querySelector('.feed-summary')));
const empty = () => text(dom.root.querySelector('.empty-state p'));

test('lists the newest 100 first, each with its summary, relative time and a link to the thing it happened to', async () => {
  await mount();
  assert.equal(text(dom.root.querySelector('h1')), 'Activity');
  assert.deepEqual(ids(), ['signup__p1', 'graded__c1__python-1_unit-1-test__1__1', 'approved__c2', 'cert__o1__gimp']);
  assert.deepEqual(summaries(), [
    'Pat Pending signed up',
    "Coach X graded Cee Current's Unit 1 Test (8 / 10 (80%))",
    'Coach X approved <img src=x onerror=1> Evil',
    'Coach X awarded Old One the 2D Digital Art - GIMP certificate'
  ]);
  assert.deepEqual(rows().map(r => text(r.querySelector('.feed-time'))), ['5 minutes ago', '1 hour ago', 'yesterday', '5 days ago']);
  assert.deepEqual(rows().map(r => r.querySelector('a.feed-summary').getAttribute('href')), [
    'admin.html#/students/p1',
    'admin.html#/grade/c1__python-1_unit-1-test__1',
    'admin.html#/students/c2',
    'admin.html#/students/o1'
  ]);
});

test('shows a loading state until the first snapshot lands', () => {
  view = activityView.mount(dom.root, { name: 'activity', params: {}, query: {} }, ctx);
  assert.match(text(dom.root.querySelector('.feed-loading')), /Loading/);
  assert.equal(rows().length, 0);
});

test('the type filter narrows the list and lands in the query string', async () => {
  await mount();
  const select = dom.root.querySelector('#feed-type');
  assert.deepEqual([...select.options].map(o => o.textContent), [
    'All types', 'Work graded', 'Work submitted', 'Account approved', 'Certificate awarded', 'New registration'
  ]);

  setValue(select, 'account_approved');
  await settle();
  assert.deepEqual(ids(), ['approved__c2']);
  assert.equal(dom.window.location.hash, '#/activity?type=account_approved');

  setValue(select, '');
  await settle();
  assert.equal(rows().length, 4);
  assert.equal(dom.window.location.hash, '#/activity');
});

test('the student filter matches the person the event is about, case-insensitive', async () => {
  await mount();
  setValue(dom.root.querySelector('#feed-student'), 'CEE');
  await settle();
  assert.deepEqual(ids(), ['graded__c1__python-1_unit-1-test__1__1']);
  assert.equal(dom.window.location.hash, '#/activity?student=CEE');
});

test('both filters combine, and both land in the query string', async () => {
  await mount();
  setValue(dom.root.querySelector('#feed-student'), 'old');
  setValue(dom.root.querySelector('#feed-type'), 'certificate_awarded');
  await settle();
  assert.deepEqual(ids(), ['cert__o1__gimp']);
  assert.equal(dom.window.location.hash, '#/activity?type=certificate_awarded&student=old');

  setValue(dom.root.querySelector('#feed-type'), 'submission_graded');
  await settle();
  assert.equal(rows().length, 0);
  assert.equal(empty(), 'Nothing matches these filters.');
});

test('filters passed in the query string apply on mount and show in the controls', async () => {
  await mount({ type: 'new_registration', student: 'pat' });
  assert.deepEqual(ids(), ['signup__p1']);
  assert.equal(dom.root.querySelector('#feed-type').value, 'new_registration');
  assert.equal(dom.root.querySelector('#feed-student').value, 'pat');
});

test('an unknown type in the query string is ignored rather than hiding everything', async () => {
  await mount({ type: 'bogus' });
  assert.equal(rows().length, 4);
  assert.equal(dom.root.querySelector('#feed-type').value, '');
});

test('an event arriving while the view is open is added at the top, and keeps the filters', async () => {
  await mount({ student: 'cee' });
  await fs.setDoc(fs.doc(fs.db, 'activity', 'cert__c1__python-1'), {
    type: 'certificate_awarded', summary: 'Coach X awarded Cee Current the Python I certificate',
    actorUid: 'me', actorName: 'Coach X', subjectUid: 'c1', subjectName: 'Cee Current',
    courseId: 'python-1', courseName: 'Python I', link: 'admin.html#/students/c1', createdAt: NOW.toISOString()
  });
  await settle();
  assert.deepEqual(ids(), ['cert__c1__python-1', 'graded__c1__python-1_unit-1-test__1__1']);
  assert.equal(text(rows()[0].querySelector('.feed-time')), 'just now');
});

test('summaries render as text, never markup', async () => {
  await mount();
  assert.equal(dom.root.querySelector('img'), null);
  assert.match(summaries()[2], /<img src=x onerror=1> Evil/);
});

test('an empty feed shows the empty state', async () => {
  const made = makeCtx({ seed: { 'users/c1': { firstName: 'c', lastName: 'one', role: 'student', status: 'approved' } } });
  ctx = made.ctx;
  await mount();
  assert.equal(rows().length, 0);
  assert.equal(empty(), 'Nothing has happened yet.');
});

test('a listener error is shown instead of loading forever', async () => {
  ctx.activity.subscribeFeed = (_onChange, onError) => { onError(new Error('permission-denied')); return () => {}; };
  const original = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args);
  try {
    await mount();
  } finally {
    console.error = original;
  }
  assert.equal(dom.root.querySelector('.feed-loading'), null);
  assert.match(text(dom.root.querySelector('.feed-error')), /Could not load activity/);
  assert.equal(errors.length, 1);
});

test('dispose drops the feed listener and stops re-rendering', async () => {
  await mount();
  assert.equal(fs.listenerCount(), 1);
  view.dispose();
  assert.equal(fs.listenerCount(), 0);
  await fs.setDoc(fs.doc(fs.db, 'activity', 'late'), {
    type: 'new_registration', summary: 'Late Comer signed up', subjectUid: 'x', subjectName: 'Late Comer',
    link: 'admin.html#/students/x', createdAt: NOW.toISOString()
  });
  await settle();
  assert.equal(rows().length, 4);
});
