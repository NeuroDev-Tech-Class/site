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
