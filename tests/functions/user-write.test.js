import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleUserWrite } from '../../functions/lib/user-write.js';
import { fakeAuth, fakeAdminDb, fakeFieldValue } from './helpers.js';

const siteUrl = 'https://neurodev-tech-class.github.io/site/';
const student = { firstName: 'jane', lastName: 'doe', email: 'jane@example.com', role: 'student', status: 'pending' };

function deps(authUsers) {
  const auth = fakeAuth(authUsers);
  const db = fakeAdminDb();
  return { auth, db, ctx: { auth, db, FieldValue: fakeFieldValue, siteUrl } };
}

test('approving a pending student syncs claims, queues the approval email and stamps claimsUpdatedAt', async () => {
  const { auth, db, ctx } = deps({ u1: { customClaims: { role: 'student', status: 'pending' } } });
  await handleUserWrite(ctx, 'u1', student, { ...student, status: 'approved' });
  assert.deepEqual(auth.calls, [['u1', { role: 'student', status: 'approved' }]]);
  assert.equal(db.adds.length, 1);
  const [collection, mail] = db.adds[0];
  assert.equal(collection, 'mail');
  assert.equal(mail.to, 'jane@example.com');
  assert.equal(mail.message.subject, 'Your NeuroDev Account Has Been Approved!');
  assert.match(mail.message.html, /Welcome to NeuroDev, Jane!/);
  assert.deepEqual(db.updates, [['users/u1', { claimsUpdatedAt: 'SERVER_TIMESTAMP' }]]);
});

test('a write that changes nothing security-relevant is a no-op', async () => {
  const approved = { ...student, status: 'approved' };
  const { auth, db, ctx } = deps({ u1: { customClaims: { role: 'student', status: 'approved' } } });
  await handleUserWrite(ctx, 'u1', approved, { ...approved, studentType: 'old', claimsUpdatedAt: 'x' });
  assert.deepEqual(auth.calls, []);
  assert.deepEqual(db.adds, []);
  assert.deepEqual(db.updates, []);
});

test('registering directly as an approved superadmin sets claims but sends no approval email', async () => {
  const owner = { firstName: 'coach', lastName: 'x', email: 'neurodevtechcoach@gmail.com', role: 'superadmin', status: 'approved' };
  const { auth, db, ctx } = deps({ own: { customClaims: undefined } });
  await handleUserWrite(ctx, 'own', null, owner);
  assert.deepEqual(auth.calls, [['own', { role: 'superadmin', status: 'approved' }]]);
  assert.deepEqual(db.adds, []);
  assert.deepEqual(db.updates, [['users/own', { claimsUpdatedAt: 'SERVER_TIMESTAMP' }]]);
});

test('a new pending registration sets claims and sends nothing', async () => {
  const { auth, db, ctx } = deps({ u2: { customClaims: undefined } });
  await handleUserWrite(ctx, 'u2', null, student);
  assert.deepEqual(auth.calls, [['u2', { role: 'student', status: 'pending' }]]);
  assert.deepEqual(db.adds, []);
});

test('a role change syncs claims without emailing', async () => {
  const approved = { ...student, status: 'approved' };
  const { auth, db, ctx } = deps({ u1: { customClaims: { role: 'student', status: 'approved' } } });
  await handleUserWrite(ctx, 'u1', approved, { ...approved, role: 'admin' });
  assert.deepEqual(auth.calls, [['u1', { role: 'admin', status: 'approved' }]]);
  assert.deepEqual(db.adds, []);
});

test('deleting the document clears claims and writes nothing back', async () => {
  const { auth, db, ctx } = deps({ u1: { customClaims: { role: 'student', status: 'approved' } } });
  await handleUserWrite(ctx, 'u1', { ...student, status: 'approved' }, null);
  assert.deepEqual(auth.calls, [['u1', null]]);
  assert.deepEqual(db.adds, []);
  assert.deepEqual(db.updates, []);
});

test('approval without an email address still syncs claims and skips the mail', async () => {
  const { auth, db, ctx } = deps({ u1: { customClaims: { role: 'student', status: 'pending' } } });
  const noEmail = { ...student, email: '' };
  await handleUserWrite(ctx, 'u1', noEmail, { ...noEmail, status: 'approved' });
  assert.equal(auth.calls.length, 1);
  assert.deepEqual(db.adds, []);
});

test('a document deleted between the claims write and the stamp write is tolerated', async () => {
  const { auth, ctx } = deps({ u1: { customClaims: { role: 'student', status: 'approved' } } });
  ctx.db.doc = () => ({ update: async () => { throw Object.assign(new Error('5 NOT_FOUND: no entity to update'), { code: 5 }); } });
  const approved = { ...student, status: 'approved' };
  await handleUserWrite(ctx, 'u1', approved, { ...approved, role: 'admin' });
  assert.deepEqual(auth.calls, [['u1', { role: 'admin', status: 'approved' }]]);
});

test('other errors from the stamp write still propagate', async () => {
  const { ctx } = deps({ u1: { customClaims: { role: 'student', status: 'approved' } } });
  ctx.db.doc = () => ({ update: async () => { throw Object.assign(new Error('7 PERMISSION_DENIED'), { code: 7 }); } });
  const approved = { ...student, status: 'approved' };
  await assert.rejects(handleUserWrite(ctx, 'u1', approved, { ...approved, role: 'admin' }), /PERMISSION_DENIED/);
});

test('a document whose auth user is gone is left alone', async () => {
  const { auth, db, ctx } = deps({});
  await handleUserWrite(ctx, 'orphan', student, { ...student, status: 'approved' });
  assert.deepEqual(auth.calls, []);
  assert.deepEqual(db.updates, []);
});

const admins = {
  'users/adm1': { firstName: 'topher', lastName: 'stubbs', role: 'admin', status: 'approved' },
  'users/sup1': { firstName: 'the', lastName: 'coach', role: 'superadmin', status: 'approved' }
};

function seeded(authUsers, docs) {
  const auth = fakeAuth(authUsers);
  const db = fakeAdminDb(docs);
  return { auth, db, ctx: { auth, db, FieldValue: fakeFieldValue, siteUrl } };
}

test('a new pending registration notifies every admin and logs one line', async () => {
  const { db, ctx } = seeded({ c9: { customClaims: undefined } }, admins);
  await handleUserWrite(ctx, 'c9', null, student);

  assert.deepEqual(db.creates.map(([path]) => path), [
    'users/adm1/inbox/signup__c9',
    'users/sup1/inbox/signup__c9',
    'activity/signup__c9'
  ]);
  const notif = db.get('users/adm1/inbox/signup__c9');
  assert.equal(notif.title, 'New registration');
  assert.equal(notif.body, 'Jane Doe signed up and is waiting for approval.');
  assert.equal(notif.link, 'admin.html#/students?tab=pending');
  assert.equal(notif.read, false);
  assert.equal(db.get('activity/signup__c9').summary, 'Jane Doe signed up');
});

test('approval notifies the student and names who approved them', async () => {
  const { db, ctx } = seeded({ c9: { customClaims: { role: 'student', status: 'pending' } } }, admins);
  await handleUserWrite(ctx, 'c9', student, { ...student, status: 'approved', approvedBy: 'adm1' });

  assert.deepEqual(db.creates.map(([path]) => path), ['users/c9/inbox/approved__c9', 'activity/approved__c9']);
  assert.equal(db.get('users/c9/inbox/approved__c9').title, 'Your account is approved');
  assert.equal(db.get('users/c9/inbox/approved__c9').actorName, 'Topher Stubbs');
  assert.equal(db.get('activity/approved__c9').summary, 'Topher Stubbs approved Jane Doe');
});

test('approval with no recorded approver still notifies, with a neutral actor', async () => {
  const { db, ctx } = seeded({ c9: { customClaims: { role: 'student', status: 'pending' } } }, admins);
  await handleUserWrite(ctx, 'c9', student, { ...student, status: 'approved' });
  assert.equal(db.get('activity/approved__c9').summary, 'An admin approved Jane Doe');
  assert.equal(db.get('users/c9/inbox/approved__c9').actorName, '');
});

test('awarding a certificate notifies the student once per new course', async () => {
  const approved = { ...student, status: 'approved', certificates: [] };
  const { db, ctx } = seeded({ c9: { customClaims: { role: 'student', status: 'approved' } } }, admins);
  const cert = { courseId: 'python-1', courseName: 'Python I', awardedAt: '2026-09-11T18:00:00Z', awardedBy: 'adm1' };
  await handleUserWrite(ctx, 'c9', approved, { ...approved, certificates: [cert] });

  assert.deepEqual(db.creates.map(([path]) => path), ['users/c9/inbox/cert__python-1', 'activity/cert__c9__python-1']);
  assert.equal(db.get('users/c9/inbox/cert__python-1').title, 'Python I certificate awarded');
  assert.equal(db.get('activity/cert__c9__python-1').summary, 'Topher Stubbs awarded Jane Doe the Python I certificate');
  assert.equal(db.get('activity/cert__c9__python-1').courseId, 'python-1');
});

test('a second certificate notifies only about the new one', async () => {
  const first = { courseId: 'python-1', courseName: 'Python I', awardedAt: '2026-09-01T00:00:00Z' };
  const second = { courseId: 'web-dev-1', courseName: 'Web Dev I', awardedAt: '2026-09-11T00:00:00Z' };
  const approved = { ...student, status: 'approved', certificates: [first] };
  const { db, ctx } = seeded({ c9: { customClaims: { role: 'student', status: 'approved' } } }, admins);
  await handleUserWrite(ctx, 'c9', approved, { ...approved, certificates: [first, second] });

  assert.deepEqual(db.creates.map(([path]) => path), ['users/c9/inbox/cert__web-dev-1', 'activity/cert__c9__web-dev-1']);
});

test('an unrelated edit notifies nobody', async () => {
  const approved = { ...student, status: 'approved', certificates: [] };
  const { db, ctx } = seeded({ c9: { customClaims: { role: 'student', status: 'approved' } } }, admins);
  await handleUserWrite(ctx, 'c9', approved, { ...approved, studentType: 'old' });
  assert.deepEqual(db.creates, []);
});

test('deleting a user notifies nobody', async () => {
  const { db, ctx } = seeded({ c9: { customClaims: { role: 'student', status: 'approved' } } }, admins);
  await handleUserWrite(ctx, 'c9', { ...student, status: 'approved' }, null);
  assert.deepEqual(db.creates, []);
});

test('the claimsUpdatedAt re-trigger notifies nobody a second time', async () => {
  const { db, ctx } = seeded({ c9: { customClaims: { role: 'student', status: 'approved' } } }, admins);
  const approvedDoc = { ...student, status: 'approved', approvedBy: 'adm1' };
  await handleUserWrite(ctx, 'c9', student, approvedDoc);
  const afterFirst = db.creates.length;

  await handleUserWrite(ctx, 'c9', approvedDoc, { ...approvedDoc, claimsUpdatedAt: 'SERVER_TIMESTAMP' });
  assert.equal(db.creates.length, afterFirst);
});
