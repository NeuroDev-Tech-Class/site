import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judge } from '../../tools/exercises/verify.mjs';

const jest = report => JSON.stringify({ numTotalTests: 3, numRuntimeErrorTestSuites: 0, ...report });

test('pytest: passing or failing on the unfinished work both mean the tests run', () => {
  assert.deepEqual(judge('pytest', 0, ''), { ok: true, outcome: 'tests pass' });
  assert.deepEqual(judge('pytest', 1, ''), { ok: true, outcome: 'tests fail on the starter' });
});

test('pytest: anything else means the tests themselves are broken', () => {
  assert.deepEqual(judge('pytest', 2, ''), { ok: false, outcome: 'collection error or interrupted (pytest exit 2)' });
  assert.deepEqual(judge('pytest', 4, ''), { ok: false, outcome: 'usage error (pytest exit 4)' });
  assert.deepEqual(judge('pytest', 5, ''), { ok: false, outcome: 'no tests found (pytest exit 5)' });
  assert.deepEqual(judge('pytest', 127, ''), { ok: false, outcome: 'setup failed (exit 127)' });
});

test('jest: tests that ran, passing or failing, are fine', () => {
  assert.deepEqual(judge('jest', 0, jest({})), { ok: true, outcome: 'tests pass' });
  assert.deepEqual(judge('jest', 1, jest({ numFailedTests: 2 })), { ok: true, outcome: 'tests fail on the starter' });
});

test('jest: a suite that could not run, no tests at all, or no report is broken', () => {
  assert.deepEqual(judge('jest', 1, jest({ numRuntimeErrorTestSuites: 1 })), { ok: false, outcome: 'a test suite failed to run' });
  assert.deepEqual(judge('jest', 1, jest({ numTotalTests: 0 })), { ok: false, outcome: 'no tests found' });
  assert.deepEqual(judge('jest', 1, ''), { ok: false, outcome: 'setup failed (exit 1, no jest report)' });
});
