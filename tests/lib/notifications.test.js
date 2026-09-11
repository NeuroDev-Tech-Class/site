import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NOTIFICATION_TYPES, TYPE_LABELS,
  gradedNotification, gradedActivity,
  receivedNotification, receivedActivity,
  approvedNotification, approvedActivity,
  certificateNotification, certificateActivity,
  registrationNotification, registrationActivity
} from '../../assets/js/lib/notifications.js';

const GRADED_AT = new Date('2026-09-11T18:00:00Z');

const graded = {
  id: 'c1__python-1_unit-1-test__1',
  kind: 'test',
  studentUid: 'c1',
  studentName: 'Jane Doe',
  courseId: 'python-1',
  courseName: 'Python I',
  itemTitle: 'Unit 1 Test',
  status: 'graded',
  manualScore: 8,
  totalMax: 10,
  totalScore: 8,
  passed: true,
  gradedAt: GRADED_AT
};

const waiting = { ...graded, status: 'needs_grading', gradedAt: null, totalScore: null, passed: null };

const coach = { uid: 'a1', name: 'Topher' };
const student = { firstName: 'jane', lastName: 'DOE', email: 'jane@example.com' };

test('every type has a label for the activity filter', () => {
  const types = Object.values(NOTIFICATION_TYPES);
  assert.equal(types.length, 5);
  for (const type of types) assert.equal(typeof TYPE_LABELS[type], 'string');
});

test('a graded notification tells the student the score and the outcome', () => {
  const notif = gradedNotification(graded, coach);
  assert.equal(notif.type, NOTIFICATION_TYPES.SUBMISSION_GRADED);
  assert.equal(notif.id, `c1__python-1_unit-1-test__1__graded__${GRADED_AT.getTime()}`);
  assert.equal(notif.title, 'Unit 1 Test graded');
  assert.equal(notif.body, 'Python I: you scored 8 / 10 (80%). Passed.');
  assert.equal(notif.link, 'profile.html');
  assert.equal(notif.actorName, 'Topher');
});

test('a failed grade and a points-only grade read correctly', () => {
  assert.equal(gradedNotification({ ...graded, manualScore: 4, totalScore: 4, passed: false }, coach).body,
    'Python I: you scored 4 / 10 (40%). Not passed.');
  assert.equal(gradedNotification({ ...graded, totalMax: null, passed: null }, coach).body,
    'Python I: you scored 8 pts. Graded.');
});

test('the graded id is stable for one grading and changes on a re-grade', () => {
  assert.equal(gradedNotification(graded, coach).id, gradedNotification({ ...graded }, coach).id);
  const regraded = { ...graded, gradedAt: new Date('2026-09-12T09:00:00Z') };
  assert.notEqual(gradedNotification(regraded, coach).id, gradedNotification(graded, coach).id);
  assert.notEqual(gradedActivity(regraded, coach).id, gradedActivity(graded, coach).id);
});

test('a submission with no usable gradedAt builds nothing', () => {
  assert.equal(gradedNotification(waiting, coach), null);
  assert.equal(gradedActivity(waiting, coach), null);
  assert.equal(gradedNotification({ ...graded, gradedAt: 'not a date' }, coach), null);
});

test('the graded activity line names the admin, the student and the score', () => {
  const entry = gradedActivity(graded, coach);
  assert.equal(entry.id, `graded__c1__python-1_unit-1-test__1__${GRADED_AT.getTime()}`);
  assert.equal(entry.summary, "Topher graded Jane Doe's Unit 1 Test (8 / 10 (80%))");
  assert.equal(entry.actorUid, 'a1');
  assert.equal(entry.subjectUid, 'c1');
  assert.equal(entry.subjectName, 'Jane Doe');
  assert.equal(entry.courseId, 'python-1');
  assert.equal(entry.courseName, 'Python I');
  assert.equal(entry.link, 'admin.html#/grade/c1__python-1_unit-1-test__1');
});

test('an unknown admin falls back to a neutral actor', () => {
  assert.equal(gradedActivity(graded, {}).summary, "An admin graded Jane Doe's Unit 1 Test (8 / 10 (80%))");
  assert.equal(gradedActivity(graded, {}).actorUid, '');
});

test('a received submission points admins at the grade screen', () => {
  const notif = receivedNotification(waiting);
  assert.equal(notif.id, 'c1__python-1_unit-1-test__1__received');
  assert.equal(notif.type, NOTIFICATION_TYPES.SUBMISSION_RECEIVED);
  assert.equal(notif.title, 'New test to grade');
  assert.equal(notif.body, 'Jane Doe submitted Unit 1 Test (Python I).');
  assert.equal(notif.link, 'admin.html#/grade/c1__python-1_unit-1-test__1');

  assert.equal(receivedNotification({ ...waiting, kind: 'checkpoint' }).title, 'New checkpoint to grade');

  const entry = receivedActivity(waiting);
  assert.equal(entry.id, 'received__c1__python-1_unit-1-test__1');
  assert.equal(entry.summary, 'Jane Doe submitted Unit 1 Test');
  assert.equal(entry.actorUid, 'c1');
});

test('approval notifies the student and logs who approved them', () => {
  const notif = approvedNotification('c1', coach);
  assert.equal(notif.id, 'approved__c1');
  assert.equal(notif.type, NOTIFICATION_TYPES.ACCOUNT_APPROVED);
  assert.equal(notif.title, 'Your account is approved');
  assert.equal(notif.link, 'profile.html');

  const entry = approvedActivity('c1', student, coach);
  assert.equal(entry.id, 'approved__c1');
  assert.equal(entry.summary, 'Topher approved Jane Doe');
  assert.equal(entry.subjectName, 'Jane Doe');
  assert.equal(entry.courseId, '');
  assert.equal(entry.link, 'admin.html#/students/c1');
});

test('a certificate award names the course on both sides', () => {
  const cert = { courseId: 'python-1', courseName: 'Python I', awardedAt: '2026-09-11T18:00:00Z' };
  const notif = certificateNotification(cert, coach);
  assert.equal(notif.id, 'cert__python-1');
  assert.equal(notif.type, NOTIFICATION_TYPES.CERTIFICATE_AWARDED);
  assert.equal(notif.title, 'Python I certificate awarded');
  assert.equal(notif.link, 'profile.html');

  const entry = certificateActivity('c1', student, cert, coach);
  assert.equal(entry.id, 'cert__c1__python-1');
  assert.equal(entry.summary, 'Topher awarded Jane Doe the Python I certificate');
  assert.equal(entry.courseId, 'python-1');
});

test('a registration notifies admins and links to the pending tab', () => {
  const notif = registrationNotification('c9', student);
  assert.equal(notif.id, 'signup__c9');
  assert.equal(notif.type, NOTIFICATION_TYPES.NEW_REGISTRATION);
  assert.equal(notif.body, 'Jane Doe signed up and is waiting for approval.');
  assert.equal(notif.link, 'admin.html#/students?tab=pending');

  const entry = registrationActivity('c9', student);
  assert.equal(entry.id, 'signup__c9');
  assert.equal(entry.summary, 'Jane Doe signed up');
  assert.equal(entry.subjectUid, 'c9');
  assert.equal(entry.link, 'admin.html#/students/c9');
});

test('markup in a name is carried through as plain text, to be escaped at render', () => {
  const nasty = { ...graded, studentName: '<img src=x onerror=1>' };
  const entry = gradedActivity(nasty, coach);
  assert.match(entry.summary, /<img src=x onerror=1>/);
  assert.equal(entry.subjectName, '<img src=x onerror=1>');
});

// Firestore rejects undefined in any field, so no builder may pass one through.
const noUndefined = obj => {
  for (const [key, value] of Object.entries(obj)) {
    assert.notEqual(value, undefined, `${key} must not be undefined`);
  }
  return obj;
};

test('a sparse submission still builds a complete, readable notification', () => {
  const sparse = { id: 'c1__x__1', studentUid: 'c1', status: 'graded', gradedAt: GRADED_AT };

  const notif = noUndefined(gradedNotification(sparse, coach));
  assert.equal(notif.title, 'Your work graded');
  assert.equal(notif.body, 'you scored Not graded. Graded.');

  const entry = noUndefined(gradedActivity(sparse, coach));
  assert.equal(entry.summary, "Topher graded A student's work (Not graded)");
  assert.equal(entry.subjectName, 'A student');
  assert.equal(entry.courseId, '');
  assert.equal(entry.courseName, '');
});

test('a sparse submitted row names no course and no student without emitting undefined', () => {
  const sparse = { id: 'c1__x__1', studentUid: 'c1', status: 'submitted' };

  const notif = noUndefined(receivedNotification(sparse));
  assert.equal(notif.body, 'A student submitted their work.');
  assert.equal(notif.actorName, '');

  const entry = noUndefined(receivedActivity(sparse));
  assert.equal(entry.summary, 'A student submitted their work');
  assert.equal(entry.subjectName, 'A student');
});

test('a user document with no name still reads as somebody', () => {
  noUndefined(approvedNotification('c1', {}));
  const entry = noUndefined(approvedActivity('c1', {}, {}));
  assert.equal(entry.summary, 'An admin approved A student');

  const reg = noUndefined(registrationNotification('c1', {}));
  assert.equal(reg.body, 'A student signed up and is waiting for approval.');
  noUndefined(registrationActivity('c1', {}));
});

test('a certificate with no course name is still readable, and one with no id builds nothing', () => {
  const entry = noUndefined(certificateActivity('c1', student, { courseId: 'gimp' }, coach));
  assert.equal(entry.summary, 'Topher awarded Jane Doe a certificate');
  assert.equal(noUndefined(certificateNotification({ courseId: 'gimp' }, coach)).title, 'Certificate awarded');

  assert.equal(certificateNotification({}, coach), null);
  assert.equal(certificateActivity('c1', student, {}, coach), null);
});
