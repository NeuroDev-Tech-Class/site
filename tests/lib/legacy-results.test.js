import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normaliseEmail, rowToSubmission, planMigration } from '../../assets/js/lib/legacy-results.js';

const NOW = new Date('2026-09-10T15:00:00Z');
const jane = { uid: 'stu1', email: 'jane@example.com', firstName: 'Jane', lastName: 'Doe', role: 'student' };
const row = overrides => rowToSubmission({
  uid: 'stu1', user: jane, key: 'python-1_unit-1-test',
  result: { score: 8, total: 10, answers: { Q1: 'A' }, submittedAt: '2026-03-01T10:00:00Z' },
  now: NOW, ...overrides
});

test('normaliseEmail trims and lower-cases', () => {
  assert.equal(normaliseEmail('  Jane@Example.COM '), 'jane@example.com');
  assert.equal(normaliseEmail(null), '');
});

test('rowToSubmission maps the key to course, title and id', () => {
  const { id, doc } = row();
  assert.equal(id, 'stu1__python-1_unit-1-test__1');
  assert.equal(doc.kind, 'test');
  assert.equal(doc.studentUid, 'stu1');
  assert.equal(doc.studentName, 'Jane Doe');
  assert.equal(doc.studentEmail, 'jane@example.com');
  assert.equal(doc.courseId, 'python-1');
  assert.equal(doc.courseName, 'Python I - Programming Fundamentals');
  assert.equal(doc.itemId, 'python-1_unit-1-test');
  assert.equal(doc.itemTitle, 'Unit 1 Test');
  assert.equal(doc.legacyKey, 'python-1_unit-1-test');
  assert.equal(doc.legacy, true);
  assert.equal(doc.attempt, 1);
  assert.deepEqual(doc.answers, { Q1: 'A' });
});

test('score classification: blank and null wait for grading, "8" and 8 are graded', () => {
  for (const score of ['', null, undefined]) {
    const { doc } = row({ result: { score, total: 10, submittedAt: '2026-03-01T10:00:00Z' } });
    assert.equal(doc.status, 'needs_grading');
    assert.equal(doc.manualScore, null);
  }
  for (const score of ['8', 8]) {
    const { doc } = row({ result: { score, total: 10, submittedAt: '2026-03-01T10:00:00Z' } });
    assert.equal(doc.status, 'graded');
    assert.equal(doc.manualScore, 8);
  }
  assert.equal(row().doc.autoScore, null);
});

test('derived fields are left for onSubmissionWrite', () => {
  const { doc } = row();
  assert.equal(doc.totalScore, null);
  assert.equal(doc.passed, null);
  assert.equal(doc.provisional, false);
});

test('total: missing, zero or unparseable gives null; numeric strings parse', () => {
  assert.equal(row({ result: { score: 8, submittedAt: '2026-03-01T10:00:00Z' } }).doc.totalMax, null);
  assert.equal(row({ result: { score: 8, total: 0, submittedAt: '2026-03-01T10:00:00Z' } }).doc.totalMax, null);
  assert.equal(row({ result: { score: 8, total: 'ten', submittedAt: '2026-03-01T10:00:00Z' } }).doc.totalMax, null);
  assert.equal(row({ result: { score: 8, total: '10', submittedAt: '2026-03-01T10:00:00Z' } }).doc.totalMax, 10);
});

test('submittedAt parses the ISO string into a Date', () => {
  const { doc } = row();
  assert.ok(doc.submittedAt instanceof Date);
  assert.equal(doc.submittedAt.toISOString(), '2026-03-01T10:00:00.000Z');
  assert.equal(doc.submittedAtEstimated, false);
});

test('missing submittedAt falls back to gradedAt, then now, and sets the flag', () => {
  const viaGraded = row({ result: { score: 8, total: 10, gradedAt: '2026-04-01T09:00:00Z' } }).doc;
  assert.equal(viaGraded.submittedAt.toISOString(), '2026-04-01T09:00:00.000Z');
  assert.equal(viaGraded.submittedAtEstimated, true);
  const viaNow = row({ result: { score: 8, total: 10 } }).doc;
  assert.equal(viaNow.submittedAt.toISOString(), NOW.toISOString());
  assert.equal(viaNow.submittedAtEstimated, true);
});

test('graded rows carry gradedAt and gradedBy through; ungraded stay null', () => {
  const graded = row({ result: { score: 8, total: 10, submittedAt: '2026-03-01T10:00:00Z', gradedAt: '2026-04-01T09:00:00Z', gradedBy: 'adm1' } }).doc;
  assert.equal(graded.gradedAt.toISOString(), '2026-04-01T09:00:00.000Z');
  assert.equal(graded.gradedBy, 'adm1');
  const ungraded = row({ result: { score: '', submittedAt: '2026-03-01T10:00:00Z' } }).doc;
  assert.equal(ungraded.gradedAt, null);
  assert.equal(ungraded.gradedBy, null);
  assert.equal(ungraded.feedback, '');
  assert.equal(graded.createdAt.toISOString(), NOW.toISOString());
  assert.equal(graded.updatedAt.toISOString(), NOW.toISOString());
});

test('an unknown course id keeps courseName equal to the id and notes it', () => {
  const { doc, note } = row({ key: 'basket-weaving_unit-1-test', result: { score: 8, submittedAt: '2026-03-01T10:00:00Z' } });
  assert.equal(doc.courseId, 'basket-weaving');
  assert.equal(doc.courseName, 'basket-weaving');
  assert.match(note, /unknown course/);
});

test('planMigration matches emails despite case and whitespace, across every role', () => {
  const plan = planMigration({
    users: [jane, { uid: 'adm1', email: 'amy@example.com', firstName: 'Amy', lastName: 'Ng', role: 'admin' }],
    testResults: [
      { email: ' JANE@Example.com', results: { 'python-1_unit-1-test': { score: 8, total: 10, submittedAt: '2026-03-01T10:00:00Z' } } },
      { email: 'amy@example.com', results: { 'linux_unit-1-test': { score: '', submittedAt: '2026-03-02T10:00:00Z' } } }
    ],
    existingIds: [], now: NOW
  });
  assert.deepEqual(plan.orphans, []);
  assert.deepEqual(plan.conflicts, []);
  assert.deepEqual(plan.creates.map(c => c.id).sort(), ['adm1__linux_unit-1-test__1', 'stu1__python-1_unit-1-test__1']);
});

test('an email with no user becomes an orphan carrying its keys and data', () => {
  const results = { 'python-1_unit-1-test': { score: 8, submittedAt: '2026-03-01T10:00:00Z' } };
  const plan = planMigration({ users: [jane], testResults: [{ email: 'Gone@Example.com', results }], existingIds: [], now: NOW });
  assert.deepEqual(plan.creates, []);
  assert.equal(plan.orphans.length, 1);
  assert.equal(plan.orphans[0].email, 'gone@example.com');
  assert.equal(plan.orphans[0].reason, 'no-user');
  assert.deepEqual(plan.orphans[0].keys, ['python-1_unit-1-test']);
  assert.deepEqual(plan.orphans[0].data, results);
});

test('two users sharing an email make an ambiguous orphan listing both candidates', () => {
  const plan = planMigration({
    users: [jane, { ...jane, uid: 'stu2', email: 'Jane@example.com' }],
    testResults: [{ email: 'jane@example.com', results: { 'python-1_unit-1-test': { score: 8, submittedAt: '2026-03-01T10:00:00Z' } } }],
    existingIds: [], now: NOW
  });
  assert.deepEqual(plan.creates, []);
  assert.equal(plan.orphans[0].reason, 'ambiguous');
  assert.deepEqual(plan.orphans[0].candidates.sort(), ['stu1', 'stu2']);
});

test('two documents mapping to one target id become a conflict, first one wins', () => {
  const result = { score: 8, total: 10, submittedAt: '2026-03-01T10:00:00Z' };
  const plan = planMigration({
    users: [jane],
    testResults: [
      { email: 'jane@example.com', results: { 'python-1_unit-1-test': result } },
      { email: ' Jane@Example.COM ', results: { 'python-1_unit-1-test': { ...result, score: 9 } } }
    ],
    existingIds: [], now: NOW
  });
  assert.equal(plan.creates.length, 1);
  assert.equal(plan.conflicts.length, 1);
  assert.equal(plan.conflicts[0].id, 'stu1__python-1_unit-1-test__1');
  assert.match(plan.conflicts[0].note, /conflict/i);
});

test('ids already in Firestore are skipped', () => {
  const plan = planMigration({
    users: [jane],
    testResults: [{ email: 'jane@example.com', results: { 'python-1_unit-1-test': { score: 8, submittedAt: '2026-03-01T10:00:00Z' } } }],
    existingIds: ['stu1__python-1_unit-1-test__1'], now: NOW
  });
  assert.deepEqual(plan.creates, []);
  assert.equal(plan.skipped.length, 1);
  assert.equal(plan.skipped[0].id, 'stu1__python-1_unit-1-test__1');
});
