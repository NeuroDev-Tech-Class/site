import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom, text } from '../helpers/dom.js';
import { renderRecentWork } from '../../assets/js/student/recent-work.js';

const graded = (over = {}) => ({
  id: 'u1__python-1_unit-1-test__1', itemTitle: 'Unit 1 Test', courseName: 'Python I',
  status: 'graded', manualScore: 8, totalMax: 10, totalScore: 8, passed: true,
  feedback: 'Nice work.', submittedAt: '2026-06-01T12:00:00.000Z', ...over
});

const waiting = (over = {}) => ({
  id: 'u1__python-1_unit-2-test__1', itemTitle: 'Unit 2 Test', courseName: 'Python I',
  status: 'needs_grading', manualScore: null, totalMax: 10, totalScore: null, passed: null,
  feedback: '', submittedAt: '2026-06-05T12:00:00.000Z', ...over
});

let container;
beforeEach(() => {
  container = setupDom().root;
});

const rows = () => [...container.querySelectorAll('.work-item')];
const status = row => text(row.querySelector('.work-status'));

test('renders at most ten rows in the order given', () => {
  const many = Array.from({ length: 12 }, (_, i) => waiting({ id: `s${i}`, itemTitle: `Test ${i}` }));
  renderRecentWork(container, many);
  assert.equal(rows().length, 10);
  assert.equal(text(rows()[0].querySelector('h3')), 'Test 0');
  assert.equal(text(rows()[9].querySelector('h3')), 'Test 9');
});

test('an ungraded submission reads Waiting for grading and shows no score', () => {
  renderRecentWork(container, [waiting()]);
  const [row] = rows();
  assert.equal(status(row), 'Waiting for grading');
  assert.equal(row.querySelector('.work-score'), null);
  assert.equal(row.querySelector('.work-feedback'), null);
});

test('a passed submission shows the score, percentage and feedback', () => {
  renderRecentWork(container, [graded()]);
  const [row] = rows();
  assert.equal(status(row), 'Passed');
  assert.equal(text(row.querySelector('.work-score')), '8 / 10 (80%)');
  assert.match(text(row.querySelector('.work-feedback')), /Nice work\./);
});

test('a failed submission reads Not passed', () => {
  renderRecentWork(container, [graded({ manualScore: 5, totalScore: 5, passed: false })]);
  assert.equal(status(rows()[0]), 'Not passed');
  assert.equal(text(rows()[0].querySelector('.work-score')), '5 / 10 (50%)');
});

test('a score with no maximum shows points only', () => {
  renderRecentWork(container, [graded({ totalMax: null, passed: null, feedback: '' })]);
  assert.equal(status(rows()[0]), 'Graded');
  assert.equal(text(rows()[0].querySelector('.work-score')), '8 pts');
});

test('titles, course names and feedback render as text, never markup', () => {
  renderRecentWork(container, [graded({
    itemTitle: '<b>bold</b>', courseName: '<i>x</i>', feedback: '<img src=x onerror=alert(1)>'
  })]);
  assert.equal(container.querySelector('img, b, i'), null);
  assert.match(text(rows()[0].querySelector('.work-feedback')), /<img src=x onerror=alert\(1\)>/);
  assert.equal(text(rows()[0].querySelector('h3')), '<b>bold</b>');
});

test('the submitted date uses the long month name', () => {
  renderRecentWork(container, [graded()]);
  assert.match(text(rows()[0].querySelector('.work-meta')), /Python I/);
  assert.match(text(rows()[0].querySelector('.work-meta')), /June 1, 2026/);
});

test('no submissions shows the empty state', () => {
  renderRecentWork(container, []);
  assert.equal(rows().length, 0);
  assert.equal(text(container.querySelector('.empty-state p')), 'No work submitted yet. Scores and feedback will show here.');
});
