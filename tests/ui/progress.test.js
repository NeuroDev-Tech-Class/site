import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOverallProgress, countUngradedTests, courseSummaries, dashboardStats
} from '../../assets/js/admin/progress.js';

const python = { '0-0': true, '0-1': true, '0-2': false, _total: 4 };

test('calculateOverallProgress uses _total when present and course metadata otherwise', () => {
  assert.equal(calculateOverallProgress({ courses: { 'python-1': python } }), 50);
  assert.equal(calculateOverallProgress({ courses: { 'web-dev-3': { '0-0': true, '0-1': true } } }), 25);
});

test('calculateOverallProgress ignores unknown courses and returns 0 with nothing started', () => {
  assert.equal(calculateOverallProgress({ courses: { mystery: { '0-0': true } } }), 0);
  assert.equal(calculateOverallProgress({}), 0);
});

test('countUngradedTests counts submitted and needs_grading submissions for the course', () => {
  const submissions = [
    { courseId: 'python-1', status: 'needs_grading' },
    { courseId: 'python-1', status: 'submitted' },
    { courseId: 'python-1', status: 'graded' },
    { courseId: 'python-1', status: 'returned' },
    { courseId: 'linux', status: 'needs_grading' }
  ];
  assert.equal(countUngradedTests('python-1', submissions), 2);
  assert.equal(countUngradedTests('python-1', undefined), 0);
});

test('courseSummaries subtracts ungraded tests, sorts unfinished first and skips untouched courses', () => {
  const student = {
    courses: {
      'python-1': python,
      'web-dev-3': { '0-0': true, '0-1': true, '0-2': true, '0-3': true, '0-4': true, '0-5': true, '0-6': true, '0-7': true },
      'linux': { '0-0': false }
    }
  };
  const summary = courseSummaries(student, [{ courseId: 'python-1', status: 'needs_grading' }]);
  assert.deepEqual(summary.courses.map(c => [c.id, c.completed, c.total, c.pct, c.ungradedTests]), [
    ['python-1', 1, 4, 25, 1],
    ['web-dev-3', 8, 8, 100, 0]
  ]);
  assert.equal(summary.courses[0].name, 'Python I - Programming Fundamentals');
  assert.equal(summary.started, 2);
  assert.equal(summary.completed, 1);
  assert.equal(summary.tasks, 9);
});

test('dashboardStats counts current, pending, active courses and certificates of current students only', () => {
  const students = [
    { status: 'approved', studentType: 'current', courses: { 'python-1': python, linux: { '0-0': false } }, certificates: [{}, {}] },
    { status: 'approved', studentType: 'current' },
    { status: 'approved', studentType: 'old', courses: { 'python-1': python }, certificates: [{}] },
    { status: 'pending' }
  ];
  assert.deepEqual(dashboardStats(students), { current: 2, pending: 1, activeCourses: 1, certificates: 2 });
});
