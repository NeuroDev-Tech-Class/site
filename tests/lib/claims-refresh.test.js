import { test } from 'node:test';
import assert from 'node:assert/strict';
import { needsTokenRefresh, refreshTokenIfStale } from '../../assets/js/lib/claims-refresh.js';

function fakeUser(claims) {
  const forced = [];
  return {
    forced,
    async getIdTokenResult() { return { claims }; },
    async getIdToken(force) { forced.push(force); return 'token'; }
  };
}

test('refreshTokenIfStale forces a new token only when the claims lag the document', async () => {
  const stale = fakeUser({ role: 'student', status: 'pending' });
  assert.equal(await refreshTokenIfStale(stale, { role: 'student', status: 'approved' }), true);
  assert.deepEqual(stale.forced, [true]);

  const fresh = fakeUser({ role: 'student', status: 'approved' });
  assert.equal(await refreshTokenIfStale(fresh, { role: 'student', status: 'approved' }), false);
  assert.deepEqual(fresh.forced, []);
});

test('a token whose claims match the document needs no refresh', () => {
  assert.equal(needsTokenRefresh({ role: 'student', status: 'approved' }, { role: 'student', status: 'approved' }), false);
});

test('a token behind the document needs a refresh', () => {
  assert.equal(needsTokenRefresh({ role: 'student', status: 'approved' }, { role: 'student', status: 'pending' }), true);
  assert.equal(needsTokenRefresh({ role: 'admin', status: 'approved' }, { role: 'student', status: 'approved' }), true);
  assert.equal(needsTokenRefresh({ role: 'student', status: 'pending' }, {}), true);
  assert.equal(needsTokenRefresh({ role: 'student', status: 'pending' }, undefined), true);
});

test('without a document there is nothing to refresh towards', () => {
  assert.equal(needsTokenRefresh(null, { role: 'student' }), false);
  assert.equal(needsTokenRefresh(undefined, undefined), false);
});

test('extra claims on the token are ignored', () => {
  const claims = { role: 'student', status: 'approved', email: 'x@example.com', iat: 1, aud: 'p' };
  assert.equal(needsTokenRefresh({ role: 'student', status: 'approved' }, claims), false);
});
