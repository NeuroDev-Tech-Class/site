import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleSubmissionWrite } from '../../functions/lib/submission-write.js';
import { fakeAdminDb } from './helpers.js';

const id = 'stu1__python-1_unit-1-test__1';
const base = {
  kind: 'test', studentUid: 'stu1', status: 'needs_grading', answers: { Q1: 'A' },
  autoScore: null, manualScore: null, totalMax: 10, totalScore: null, passed: null, provisional: false,
  updatedAt: 'CLIENT_TIME'
};
const graded = { ...base, status: 'graded', manualScore: 8, gradedBy: 'adm1', gradedAt: 'CLIENT_TIME' };

const run = (before, after) => {
  const db = fakeAdminDb();
  return handleSubmissionWrite({ db }, id, before, after).then(() => db.updates);
};

test('a graded submission gets exactly the derived fields and no timestamp', async () => {
  assert.deepEqual(await run(base, graded), [[`submissions/${id}`, { totalScore: 8, passed: true, provisional: false }]]);
});

test('the re-trigger after the derived write changes nothing', async () => {
  const settled = { ...graded, totalScore: 8, passed: true, provisional: false };
  assert.deepEqual(await run(graded, settled), []);
});

test('a failing score derives passed false', async () => {
  assert.deepEqual(await run(base, { ...graded, manualScore: 6 }), [[`submissions/${id}`, { totalScore: 6, passed: false, provisional: false }]]);
});

test('a grade without a max keeps passed null', async () => {
  assert.deepEqual(await run(base, { ...graded, totalMax: null }), [[`submissions/${id}`, { totalScore: 8, passed: null, provisional: false }]]);
});

test('re-grading recomputes from the new score', async () => {
  const settled = { ...graded, totalScore: 8, passed: true, provisional: false };
  assert.deepEqual(await run(settled, { ...settled, manualScore: 5 }), [[`submissions/${id}`, { totalScore: 5, passed: false, provisional: false }]]);
});

test('a fresh submission moves to needs_grading', async () => {
  assert.deepEqual(await run(null, { ...base, status: 'submitted' }), [[`submissions/${id}`, { status: 'needs_grading' }]]);
});

test('a needs_grading document with no score is left alone', async () => {
  assert.deepEqual(await run(null, base), []);
});

test('a deleted document is a no-op', async () => {
  assert.deepEqual(await run(graded, null), []);
});

test('a document deleted before the derived write is tolerated', async () => {
  const db = fakeAdminDb();
  db.doc = () => ({ update: async () => { throw Object.assign(new Error('5 NOT_FOUND'), { code: 5 }); } });
  await handleSubmissionWrite({ db }, id, base, graded);
});

test('other errors from the derived write propagate', async () => {
  const db = fakeAdminDb();
  db.doc = () => ({ update: async () => { throw Object.assign(new Error('7 PERMISSION_DENIED'), { code: 7 }); } });
  await assert.rejects(handleSubmissionWrite({ db }, id, base, graded), /PERMISSION_DENIED/);
});
