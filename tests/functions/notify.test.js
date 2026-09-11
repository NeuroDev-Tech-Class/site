import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adminRecipients, actorFrom, deliver, logActivity } from '../../functions/lib/notify.js';
import { fakeAdminDb, fakeFieldValue } from './helpers.js';

const FV = fakeFieldValue;

const people = {
  'users/stu1': { firstName: 'jane', lastName: 'doe', role: 'student', status: 'approved' },
  'users/adm1': { firstName: 'topher', lastName: 'stubbs', role: 'admin', status: 'approved' },
  'users/sup1': { firstName: 'the', lastName: 'coach', role: 'superadmin', status: 'approved' }
};

const notification = {
  id: 'n1', type: 'submission_graded', title: 'Unit 1 Test graded',
  body: 'Python I: you scored 8 / 10 (80%). Passed.', link: 'profile.html', actorName: 'Topher'
};

test('adminRecipients returns both admin roles with formatted names, and no students', async () => {
  const db = fakeAdminDb(people);
  assert.deepEqual(await adminRecipients(db), [
    { uid: 'adm1', name: 'Topher Stubbs' },
    { uid: 'sup1', name: 'The Coach' }
  ]);
});

test('adminRecipients on a project with no admins returns nothing', async () => {
  assert.deepEqual(await adminRecipients(fakeAdminDb({ 'users/stu1': people['users/stu1'] })), []);
});

test('actorFrom names the user, and copes with a missing or absent uid', async () => {
  const db = fakeAdminDb(people);
  assert.deepEqual(await actorFrom(db, 'adm1'), { uid: 'adm1', name: 'Topher Stubbs' });
  assert.deepEqual(await actorFrom(db, 'ghost'), { uid: 'ghost', name: '' });
  assert.deepEqual(await actorFrom(db, ''), { uid: '', name: '' });
  assert.deepEqual(await actorFrom(db, null), { uid: '', name: '' });
});

test('deliver creates the notification unread with a server timestamp', async () => {
  const db = fakeAdminDb();
  assert.equal(await deliver(db, FV, 'stu1', notification), true);

  assert.deepEqual(db.get('users/stu1/inbox/n1'), {
    type: 'submission_graded',
    title: 'Unit 1 Test graded',
    body: 'Python I: you scored 8 / 10 (80%). Passed.',
    link: 'profile.html',
    actorName: 'Topher',
    read: false,
    createdAt: 'SERVER_TIMESTAMP'
  });
  assert.deepEqual(db.creates.map(([path]) => path), ['users/stu1/inbox/n1']);
});

test('delivering the same id twice is swallowed and leaves the first one alone', async () => {
  const db = fakeAdminDb();
  await deliver(db, FV, 'stu1', notification);
  await db.doc('users/stu1/inbox/n1').update({ read: true });

  assert.equal(await deliver(db, FV, 'stu1', notification), false);
  assert.equal(db.get('users/stu1/inbox/n1').read, true);
  assert.equal(db.creates.length, 1);
});

test('deliver and logActivity write nothing when the builder returned null', async () => {
  const db = fakeAdminDb();
  assert.equal(await deliver(db, FV, 'stu1', null), false);
  assert.equal(await logActivity(db, FV, null), false);
  assert.deepEqual(db.creates, []);
});

test('logActivity appends to the feed with a server timestamp', async () => {
  const db = fakeAdminDb();
  const entry = { id: 'signup__c9', type: 'new_registration', summary: 'Jane Doe signed up', subjectUid: 'c9' };
  assert.equal(await logActivity(db, FV, entry), true);

  assert.deepEqual(db.get('activity/signup__c9'), {
    type: 'new_registration', summary: 'Jane Doe signed up', subjectUid: 'c9', createdAt: 'SERVER_TIMESTAMP'
  });
  assert.equal(await logActivity(db, FV, entry), false);
});

test('an error that is not ALREADY_EXISTS propagates', async () => {
  const db = fakeAdminDb();
  db.doc = () => ({ create: async () => { throw Object.assign(new Error('7 PERMISSION_DENIED'), { code: 7 }); } });
  await assert.rejects(deliver(db, FV, 'stu1', notification), /PERMISSION_DENIED/);
  await assert.rejects(logActivity(db, FV, { id: 'x', type: 't' }), /PERMISSION_DENIED/);
});
