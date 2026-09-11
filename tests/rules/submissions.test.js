import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { createRulesEnv, assertSucceeds, assertFails } from '../helpers/rules-env.js';

const serverTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();

let env;
const own = 'submissions/stu1__python-1_unit-1-test__1';
const other = 'submissions/stu2__python-1_unit-1-test__1';

const submission = studentUid => ({
  kind: 'test',
  studentUid,
  studentName: 'Test Student',
  studentEmail: `${studentUid}@example.com`,
  courseId: 'python-1',
  courseName: 'Python I',
  itemId: 'python-1_unit-1-test',
  itemTitle: 'Unit 1 Test',
  legacyKey: 'python-1_unit-1-test',
  legacy: true,
  attempt: 1,
  status: 'needs_grading',
  answers: { Q1: 'A' },
  autoScore: null,
  manualScore: null,
  totalMax: 10,
  totalScore: null,
  passed: null,
  provisional: false,
  feedback: '',
  submittedAt: new Date('2026-06-01T12:00:00Z'),
  gradedAt: null,
  gradedBy: null,
  createdAt: new Date('2026-09-10T12:00:00Z'),
  updatedAt: new Date('2026-09-10T12:00:00Z')
});

const gradePatch = (gradedBy, extra = {}) => ({
  manualScore: 8,
  totalMax: 10,
  feedback: 'Good',
  status: 'graded',
  gradedBy,
  gradedAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...extra
});

before(async () => { env = await createRulesEnv('submissions'); });
after(() => env.cleanup());
beforeEach(async () => {
  await env.clear();
  await env.seed(own, submission('stu1'));
  await env.seed(other, submission('stu2'));
  await env.seed('legacyOrphans/lost@example.com', { reason: 'no-user', keys: ['python-1_unit-1-test'] });
});

test('anonymous users cannot read a submission', async () => {
  await assertFails(env.anon().doc(own).get());
});

test('a student can read their own submission but not another student\'s', async () => {
  const db = await env.asStudent('stu1');
  await assertSucceeds(db.doc(own).get());
  await assertFails(db.doc(other).get());
});

test('a student can list submissions only when filtered to their own uid', async () => {
  const db = await env.asStudent('stu1');
  await assertSucceeds(db.collection('submissions').where('studentUid', '==', 'stu1').orderBy('submittedAt', 'desc').get());
  await assertFails(db.collection('submissions').get());
  await assertFails(db.collection('submissions').where('studentUid', '==', 'stu2').get());
});

test('an admin can read and list every submission', async () => {
  const db = await env.asAdmin('adm1');
  await assertSucceeds(db.doc(other).get());
  await assertSucceeds(db.collection('submissions').where('status', 'in', ['submitted', 'needs_grading']).orderBy('submittedAt').get());
});

test('a student cannot grade or edit their own submission', async () => {
  const db = await env.asStudent('stu1');
  await assertFails(db.doc(own).update(gradePatch('stu1')));
  await assertFails(db.doc(own).update({ answers: { Q1: 'B' } }));
});

test('an admin can grade with the allowed fields', async () => {
  const db = await env.asAdmin('adm1');
  await assertSucceeds(db.doc(own).update(gradePatch('adm1')));
  const stored = await env.read(own);
  assert.equal(stored.status, 'graded');
  assert.equal(stored.manualScore, 8);
  assert.equal(stored.gradedBy, 'adm1');
});

test('an admin can re-grade an already graded submission and clear the max', async () => {
  const db = await env.asAdmin('adm1');
  await assertSucceeds(db.doc(own).update(gradePatch('adm1')));
  await assertSucceeds(db.doc(own).update(gradePatch('adm1', { manualScore: 6, feedback: 'Revised' })));
  await env.seed(other, { ...submission('stu2'), totalMax: null });
  await assertSucceeds(db.doc(other).update(gradePatch('adm1', { manualScore: 12, totalMax: null })));
});

test('an admin cannot touch derived, answer or identity fields', async () => {
  const db = await env.asAdmin('adm1');
  await assertFails(db.doc(own).update(gradePatch('adm1', { totalScore: 8 })));
  await assertFails(db.doc(own).update(gradePatch('adm1', { passed: true })));
  await assertFails(db.doc(own).update(gradePatch('adm1', { provisional: true })));
  await assertFails(db.doc(own).update(gradePatch('adm1', { answers: { Q1: 'B' } })));
  await assertFails(db.doc(own).update(gradePatch('adm1', { studentUid: 'adm1' })));
});

test('a grade must be complete and consistent', async () => {
  const db = await env.asAdmin('adm1');
  await assertFails(db.doc(own).update(gradePatch('adm1', { status: 'needs_grading' })));
  await assertFails(db.doc(own).update(gradePatch('adm1', { manualScore: 11 })));
  await assertFails(db.doc(own).update(gradePatch('adm1', { manualScore: -1 })));
  await assertFails(db.doc(own).update(gradePatch('adm1', { manualScore: '8' })));
  await assertFails(db.doc(own).update(gradePatch('adm1', { totalMax: 0 })));
  await assertFails(db.doc(own).update(gradePatch('adm1', { feedback: 'x'.repeat(5001) })));
  await assertFails(db.doc(own).update(gradePatch('someone-else')));
  await assertFails(db.doc(own).update(gradePatch('adm1', { gradedAt: new Date('2020-01-01T00:00:00Z') })));
});

test('nobody creates or deletes submissions from the client', async () => {
  const db = await env.asAdmin('adm1');
  await assertFails(db.doc('submissions/adm1__new__1').set(submission('stu1')));
  await assertFails(db.doc(own).delete());
  const student = await env.asStudent('stu1');
  await assertFails(student.doc('submissions/stu1__new__1').set(submission('stu1')));
});

test('legacyOrphans are readable by admins only and never written from the client', async () => {
  const admin = await env.asAdmin('adm1');
  await assertSucceeds(admin.doc('legacyOrphans/lost@example.com').get());
  await assertFails(admin.doc('legacyOrphans/lost@example.com').update({ reason: 'fixed' }));
  const student = await env.asStudent('stu1');
  await assertFails(student.doc('legacyOrphans/lost@example.com').get());
  await assertFails(env.anon().doc('legacyOrphans/lost@example.com').get());
});
