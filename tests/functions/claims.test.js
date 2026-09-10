import { test } from 'node:test';
import assert from 'node:assert/strict';
import { claimsFor, syncClaims } from '../../functions/lib/claims.js';
import { fakeAuth } from './helpers.js';

test('claimsFor copies role and status and nothing else', () => {
  assert.deepEqual(claimsFor({ role: 'student', status: 'pending', email: 'x', courses: {} }), { role: 'student', status: 'pending' });
  assert.deepEqual(claimsFor({ role: 'admin' }), { role: 'admin' });
  assert.deepEqual(claimsFor({ role: 42, status: null }), {});
});

test('claimsFor returns null for a deleted document', () => {
  assert.equal(claimsFor(null), null);
  assert.equal(claimsFor(undefined), null);
});

test('syncClaims sets claims when they differ from the token', async () => {
  const auth = fakeAuth({ u1: { customClaims: { role: 'student', status: 'pending' } } });
  const result = await syncClaims(auth, 'u1', { role: 'student', status: 'approved' });
  assert.deepEqual(result, { changed: true, claims: { role: 'student', status: 'approved' } });
  assert.deepEqual(auth.calls, [['u1', { role: 'student', status: 'approved' }]]);
});

test('syncClaims sets claims for a user who has none yet', async () => {
  const auth = fakeAuth({ u1: { customClaims: undefined } });
  await syncClaims(auth, 'u1', { role: 'admin', status: 'approved' });
  assert.deepEqual(auth.calls, [['u1', { role: 'admin', status: 'approved' }]]);
});

test('syncClaims does nothing when the claims already match', async () => {
  const auth = fakeAuth({ u1: { customClaims: { role: 'admin', status: 'approved' } } });
  const result = await syncClaims(auth, 'u1', { role: 'admin', status: 'approved', firstName: 'x' });
  assert.deepEqual(result, { changed: false });
  assert.deepEqual(auth.calls, []);
});

test('syncClaims clears claims when the document is deleted', async () => {
  const auth = fakeAuth({ u1: { customClaims: { role: 'student', status: 'approved' } } });
  const result = await syncClaims(auth, 'u1', null);
  assert.deepEqual(result, { changed: true, claims: null });
  assert.deepEqual(auth.calls, [['u1', null]]);
});

test('syncClaims reports a missing auth user instead of throwing', async () => {
  const auth = fakeAuth({});
  const result = await syncClaims(auth, 'orphan', { role: 'student', status: 'pending' });
  assert.deepEqual(result, { changed: false, reason: 'no-auth-user' });
  assert.deepEqual(auth.calls, []);
});

test('syncClaims rethrows other auth errors', async () => {
  const auth = { async getUser() { throw Object.assign(new Error('boom'), { code: 'auth/internal-error' }); } };
  await assert.rejects(syncClaims(auth, 'u1', { role: 'student' }), /boom/);
});

test('syncClaims in dry-run mode reports the change without writing it', async () => {
  const auth = fakeAuth({ u1: { customClaims: undefined } });
  const result = await syncClaims(auth, 'u1', { role: 'student', status: 'pending' }, { dryRun: true });
  assert.deepEqual(result, { changed: true, claims: { role: 'student', status: 'pending' } });
  assert.deepEqual(auth.calls, []);
});
