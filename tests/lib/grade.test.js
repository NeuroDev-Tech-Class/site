import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PASS_THRESHOLD, percent, deriveTotals, sameDerived } from '../../assets/js/lib/grade.js';

test('the pass threshold is 70 percent', () => {
  assert.equal(PASS_THRESHOLD, 70);
});

test('percent rounds to a whole number and is null without a positive max', () => {
  assert.equal(percent(8, 10), 80);
  assert.equal(percent(2, 3), 67);
  assert.equal(percent(0, 10), 0);
  assert.equal(percent(8, null), null);
  assert.equal(percent(8, 0), null);
  assert.equal(percent(null, 10), null);
});

test('deriveTotals sums the scores and passes at or above the threshold', () => {
  assert.deepEqual(deriveTotals({ autoScore: null, manualScore: 8, totalMax: 10 }), { totalScore: 8, passed: true, provisional: false });
  assert.deepEqual(deriveTotals({ autoScore: 3, manualScore: 4, totalMax: 10 }), { totalScore: 7, passed: true, provisional: false });
  assert.deepEqual(deriveTotals({ autoScore: 3, manualScore: 3, totalMax: 10 }), { totalScore: 6, passed: false, provisional: false });
});

test('deriveTotals gives null totals without scores and null passed without a max', () => {
  assert.deepEqual(deriveTotals({ autoScore: null, manualScore: null, totalMax: 10 }), { totalScore: null, passed: null, provisional: false });
  assert.deepEqual(deriveTotals({ autoScore: null, manualScore: 8, totalMax: null }), { totalScore: 8, passed: null, provisional: false });
  assert.deepEqual(deriveTotals({ manualScore: 8, totalMax: 0 }), { totalScore: 8, passed: null, provisional: false });
  assert.deepEqual(deriveTotals({ manualScore: '8', totalMax: '10' }), { totalScore: 8, passed: true, provisional: false });
});

test('sameDerived treats missing and null as equal and detects any difference', () => {
  const derived = { totalScore: 8, passed: true, provisional: false };
  assert.equal(sameDerived({ ...derived }, derived), true);
  assert.equal(sameDerived({ totalScore: null, passed: null }, { totalScore: null, passed: null, provisional: false }), false);
  assert.equal(sameDerived({ totalScore: null, passed: null, provisional: false }, { totalScore: null, passed: null, provisional: false }), true);
  assert.equal(sameDerived({}, { totalScore: null, passed: null, provisional: false }), false);
  assert.equal(sameDerived({ totalScore: 7, passed: true, provisional: false }, derived), false);
  assert.equal(sameDerived({ totalScore: 8, passed: false, provisional: false }, derived), false);
});
