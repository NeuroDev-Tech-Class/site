import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  UNGRADED_STATUSES, submissionId, parseLegacyKey, isUngraded, statusLabel, scoreLabel
} from '../../assets/js/lib/submissions.js';

test('submissionId joins uid, item and attempt with double underscores', () => {
  assert.equal(submissionId('uid1', 'python-1_unit-1-test', 1), 'uid1__python-1_unit-1-test__1');
  assert.equal(submissionId('uid1', 'i_abc123'), 'uid1__i_abc123__1');
});

test('parseLegacyKey splits at the first underscore and titles the unit key', () => {
  assert.deepEqual(parseLegacyKey('python-1_unit-1-test'), { courseId: 'python-1', unitKey: 'unit-1-test', itemTitle: 'Unit 1 Test' });
  assert.deepEqual(parseLegacyKey('linux_unit-1-test'), { courseId: 'linux', unitKey: 'unit-1-test', itemTitle: 'Unit 1 Test' });
  assert.deepEqual(parseLegacyKey('web-dev-2_final_quiz'), { courseId: 'web-dev-2', unitKey: 'final_quiz', itemTitle: 'Final Quiz' });
  assert.equal(parseLegacyKey('nounderscore'), null);
});

test('isUngraded is true for submitted and needs_grading only', () => {
  assert.deepEqual(UNGRADED_STATUSES, ['submitted', 'needs_grading']);
  assert.equal(isUngraded({ status: 'needs_grading' }), true);
  assert.equal(isUngraded({ status: 'submitted' }), true);
  assert.equal(isUngraded({ status: 'graded' }), false);
  assert.equal(isUngraded({ status: 'returned' }), false);
  assert.equal(isUngraded({}), false);
});

test('statusLabel gives the words the screens show', () => {
  assert.equal(statusLabel({ status: 'needs_grading' }), 'Waiting for grading');
  assert.equal(statusLabel({ status: 'submitted' }), 'Waiting for grading');
  assert.equal(statusLabel({ status: 'graded', passed: true }), 'Passed');
  assert.equal(statusLabel({ status: 'graded', passed: false }), 'Not passed');
  assert.equal(statusLabel({ status: 'graded', passed: null }), 'Graded');
  assert.equal(statusLabel({ status: 'graded', manualScore: 8, totalMax: 10 }), 'Passed');
  assert.equal(statusLabel({ status: 'returned' }), 'Needs revision');
  assert.equal(statusLabel({ status: 'draft' }), 'Draft');
});

test('scoreLabel shows score out of max with percent, points without a max, or Not graded', () => {
  assert.equal(scoreLabel({ status: 'graded', totalScore: 8, totalMax: 10 }), '8 / 10 (80%)');
  assert.equal(scoreLabel({ status: 'graded', manualScore: 8, totalMax: 10 }), '8 / 10 (80%)');
  assert.equal(scoreLabel({ status: 'graded', manualScore: 8, totalMax: null }), '8 pts');
  assert.equal(scoreLabel({ status: 'needs_grading', totalMax: 10 }), 'Not graded');
  assert.equal(scoreLabel({ status: 'graded', manualScore: null, totalMax: 10 }), 'Not graded');
});
