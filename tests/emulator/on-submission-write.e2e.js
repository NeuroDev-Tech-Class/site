// Runs the deployed function code inside the emulators: npm run test:e2e
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

let app, db;

before(() => {
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'run through: firebase emulators:exec');
  app = initializeApp({ projectId: 'demo-neurodev' }, 'e2e-submissions');
  db = getFirestore(app);
});
after(() => deleteApp(app));

async function waitFor(check, { timeout = 90000, every = 250 } = {}) {
  const deadline = Date.now() + timeout;
  for (;;) {
    const value = await check();
    if (value) return value;
    if (Date.now() > deadline) throw new Error('timed out waiting for the function');
    await new Promise(resolve => setTimeout(resolve, every));
  }
}

const settle = ms => new Promise(resolve => setTimeout(resolve, ms));

test('onSubmissionWrite derives totals on grade, never stamps a timestamp, and moves submitted to needs_grading', async () => {
  const uid = `e2e-${Date.now()}`;
  const ref = db.doc(`submissions/${uid}__python-1_unit-1-test__1`);
  const clientTime = Timestamp.fromDate(new Date('2026-09-10T12:00:00Z'));
  await ref.set({
    kind: 'test', studentUid: uid, studentName: 'E2e Student', studentEmail: `${uid}@example.com`,
    courseId: 'python-1', courseName: 'Python I', itemId: 'python-1_unit-1-test', itemTitle: 'Unit 1 Test',
    legacyKey: 'python-1_unit-1-test', legacy: true, attempt: 1, status: 'needs_grading', answers: { Q1: 'A' },
    autoScore: null, manualScore: null, totalMax: 10, totalScore: null, passed: null, provisional: false,
    feedback: '', submittedAt: clientTime, gradedAt: null, gradedBy: null, createdAt: clientTime, updatedAt: clientTime
  });

  await ref.update({ manualScore: 8, status: 'graded', gradedBy: 'adm1', gradedAt: clientTime, updatedAt: clientTime });
  let data = await waitFor(async () => {
    const snap = await ref.get();
    return snap.data().totalScore === 8 ? snap.data() : null;
  });
  assert.equal(data.passed, true);
  assert.equal(data.provisional, false);

  await settle(3000);
  data = (await ref.get()).data();
  assert.ok(data.updatedAt.isEqual(clientTime), 'the function must not stamp updatedAt');
  assert.ok(data.gradedAt.isEqual(clientTime), 'the function must not stamp gradedAt');

  await ref.update({ manualScore: 6 });
  await waitFor(async () => (await ref.get()).data().passed === false);

  const fresh = db.doc(`submissions/${uid}__python-1_unit-2-test__1`);
  await fresh.set({ kind: 'test', studentUid: uid, status: 'submitted', submittedAt: clientTime, manualScore: null, totalMax: 10 });
  await waitFor(async () => (await fresh.get()).data().status === 'needs_grading');
});

test('grading notifies the student, counts the unread, logs activity and does not duplicate', async () => {
  const uid = `e2e-notify-${Date.now()}`;
  const subId = `${uid}__python-1_unit-1-test__1`;
  const ref = db.doc(`submissions/${subId}`);
  const gradedAt = Timestamp.fromDate(new Date('2026-09-11T18:00:00Z'));
  await ref.set({
    kind: 'test', studentUid: uid, studentName: 'E2e Student', studentEmail: `${uid}@example.com`,
    courseId: 'python-1', courseName: 'Python I', itemId: 'python-1_unit-1-test', itemTitle: 'Unit 1 Test',
    attempt: 1, status: 'needs_grading', answers: { Q1: 'A' },
    autoScore: null, manualScore: null, totalMax: 10, totalScore: null, passed: null, provisional: false,
    feedback: '', submittedAt: gradedAt, gradedAt: null, gradedBy: null
  });

  await ref.update({ manualScore: 8, status: 'graded', gradedBy: 'adm1', gradedAt });

  const notifRef = db.doc(`users/${uid}/inbox/${subId}__graded__${gradedAt.toMillis()}`);
  const notif = await waitFor(async () => {
    const snap = await notifRef.get();
    return snap.exists ? snap.data() : null;
  });
  assert.equal(notif.title, 'Unit 1 Test graded');
  assert.equal(notif.body, 'Python I: you scored 8 / 10 (80%). Passed.');
  assert.equal(notif.read, false);

  const counters = db.doc(`users/${uid}/meta/counters`);
  await waitFor(async () => (await counters.get()).data()?.unread === 1);

  const entry = await waitFor(async () => {
    const snap = await db.doc(`activity/graded__${subId}__${gradedAt.toMillis()}`).get();
    return snap.exists ? snap.data() : null;
  });
  assert.match(entry.summary, /graded E2e Student's Unit 1 Test \(8 \/ 10 \(80%\)\)/);
  assert.equal(entry.subjectUid, uid);

  // A re-derive under the same gradedAt must not add a second notification or bump the count.
  await ref.update({ manualScore: 6 });
  await waitFor(async () => (await ref.get()).data().passed === false);
  await settle(3000);
  const inbox = await db.collection(`users/${uid}/inbox`).get();
  assert.equal(inbox.size, 1, 'one grading, one notification');
  assert.equal((await counters.get()).data().unread, 1);

  await notifRef.update({ read: true });
  await waitFor(async () => (await counters.get()).data().unread === 0);
});
