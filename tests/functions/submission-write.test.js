import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleSubmissionWrite } from '../../functions/lib/submission-write.js';
import { fakeAdminDb, fakeFieldValue } from './helpers.js';

const id = 'stu1__python-1_unit-1-test__1';
const base = {
  kind: 'test', studentUid: 'stu1', status: 'needs_grading', answers: { Q1: 'A' },
  autoScore: null, manualScore: null, totalMax: 10, totalScore: null, passed: null, provisional: false,
  updatedAt: 'CLIENT_TIME'
};
const graded = { ...base, status: 'graded', manualScore: 8, gradedBy: 'adm1', gradedAt: 'CLIENT_TIME' };

const run = (before, after) => {
  const db = fakeAdminDb();
  return handleSubmissionWrite({ db, FieldValue: fakeFieldValue }, id, before, after).then(() => db.updates);
};

// Breaks only the derived write, leaving the rest of the db working so the fan-out can run.
const dbWithBrokenUpdate = code => {
  const db = fakeAdminDb();
  const realDoc = db.doc;
  db.doc = path => ({
    ...realDoc(path),
    update: async () => { throw Object.assign(new Error(`${code} FAILED`), { code }); }
  });
  return db;
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
  const db = dbWithBrokenUpdate(5);
  await handleSubmissionWrite({ db, FieldValue: fakeFieldValue }, id, base, graded);
});

test('other errors from the derived write propagate', async () => {
  const db = dbWithBrokenUpdate(7);
  await assert.rejects(handleSubmissionWrite({ db, FieldValue: fakeFieldValue }, id, base, graded), /FAILED/);
});

const GRADED_AT = new Date('2026-09-11T18:00:00Z');
const stamped = {
  ...graded,
  gradedAt: GRADED_AT,
  studentName: 'Jane Doe',
  courseId: 'python-1',
  courseName: 'Python I',
  itemTitle: 'Unit 1 Test'
};

const people = {
  'users/adm1': { firstName: 'topher', lastName: 'stubbs', role: 'admin', status: 'approved' },
  'users/sup1': { firstName: 'the', lastName: 'coach', role: 'superadmin', status: 'approved' }
};

const fanOut = (before, after, seed = people) => {
  const db = fakeAdminDb(seed);
  return handleSubmissionWrite({ db, FieldValue: fakeFieldValue }, id, before, after).then(() => db);
};

test('grading notifies the student and logs one activity line', async () => {
  const db = await fanOut(base, stamped);
  const inboxId = `${id}__graded__${GRADED_AT.getTime()}`;

  assert.deepEqual(db.creates.map(([path]) => path), [
    `users/stu1/inbox/${inboxId}`,
    `activity/graded__${id}__${GRADED_AT.getTime()}`
  ]);
  const notif = db.get(`users/stu1/inbox/${inboxId}`);
  assert.equal(notif.title, 'Unit 1 Test graded');
  assert.equal(notif.body, 'Python I: you scored 8 / 10 (80%). Passed.');
  assert.equal(notif.read, false);
  assert.equal(notif.actorName, 'Topher Stubbs');
  assert.equal(db.get(`activity/graded__${id}__${GRADED_AT.getTime()}`).summary,
    "Topher Stubbs graded Jane Doe's Unit 1 Test (8 / 10 (80%))");
});

test('the notification quotes the derived score, not the stale stored one', async () => {
  const db = await fanOut(base, { ...stamped, manualScore: 6 });
  const notif = db.get(`users/stu1/inbox/${id}__graded__${GRADED_AT.getTime()}`);
  assert.equal(notif.body, 'Python I: you scored 6 / 10 (60%). Not passed.');
});

test('the re-trigger after the derived write notifies nobody a second time', async () => {
  const settled = { ...stamped, totalScore: 8, passed: true, provisional: false };
  const db = await fanOut(stamped, settled);
  assert.deepEqual(db.creates, []);
});

test('a re-grade with a new gradedAt notifies again under a new id', async () => {
  const settled = { ...stamped, totalScore: 8, passed: true, provisional: false };
  const regradedAt = new Date('2026-09-12T09:00:00Z');
  const db = await fanOut(settled, { ...settled, manualScore: 5, gradedAt: regradedAt });
  assert.deepEqual(db.creates.map(([path]) => path), [
    `users/stu1/inbox/${id}__graded__${regradedAt.getTime()}`,
    `activity/graded__${id}__${regradedAt.getTime()}`
  ]);
});

test('a grade with no usable gradedAt still derives but notifies nobody', async () => {
  const db = await fanOut(base, graded);
  assert.deepEqual(db.updates, [[`submissions/${id}`, { totalScore: 8, passed: true, provisional: false }]]);
  assert.deepEqual(db.creates, []);
});

test('a new submission notifies every admin and logs one line', async () => {
  const db = await fanOut(null, { ...stamped, status: 'submitted', gradedAt: null });
  assert.deepEqual(db.creates.map(([path]) => path), [
    `users/adm1/inbox/${id}__received`,
    `users/sup1/inbox/${id}__received`,
    `activity/received__${id}`
  ]);
  const notif = db.get(`users/adm1/inbox/${id}__received`);
  assert.equal(notif.title, 'New test to grade');
  assert.equal(notif.body, 'Jane Doe submitted Unit 1 Test (Python I).');
  assert.equal(db.get(`activity/received__${id}`).summary, 'Jane Doe submitted Unit 1 Test');
});

test('a migrated legacy row notifies nobody', async () => {
  const db = await fanOut(null, { ...stamped, status: 'submitted', gradedAt: null, legacy: true });
  assert.deepEqual(db.creates, []);
  assert.deepEqual(db.updates, [[`submissions/${id}`, { status: 'needs_grading' }]]);
});
