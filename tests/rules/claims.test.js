import { test, before, after, beforeEach } from 'node:test';
import { createRulesEnv, assertSucceeds, assertFails } from '../helpers/rules-env.js';

// These prove the rules trust the token, not the user document.
let env;

before(async () => { env = await createRulesEnv('claims'); });
after(() => env.cleanup());
beforeEach(async () => {
  await env.clear();
  await env.seed('users/target', env.userDoc('target', 'student', 'approved'));
  await env.seed('legacyOrphans/target@example.com', { reason: 'no-user', keys: [] });
});

test('an admin token with no user document is still an admin', async () => {
  const db = env.withClaims('ghost-admin', { role: 'admin', status: 'approved' });
  await assertSucceeds(db.doc('users/target').get());
  await assertSucceeds(db.doc('legacyOrphans/target@example.com').get());
});

test('a student token is a student even if the user document claims admin', async () => {
  await env.seed('users/liar', env.userDoc('liar', 'admin', 'approved'));
  const db = env.withClaims('liar', { role: 'student', status: 'approved' });
  await assertFails(db.doc('users/target').get());
  await assertFails(db.doc('legacyOrphans/target@example.com').get());
});

test('a token without a role claim gets no admin access regardless of the document', async () => {
  await env.seed('users/noclaims', env.userDoc('noclaims', 'admin', 'approved'));
  const db = env.withClaims('noclaims', {});
  await assertFails(db.doc('users/target').get());
  await assertSucceeds(db.doc('users/noclaims').get());
});

test('a superadmin token can change roles; an admin token cannot', async () => {
  const superadmin = env.withClaims('sup', { role: 'superadmin', status: 'approved' });
  const admin = env.withClaims('adm', { role: 'admin', status: 'approved' });
  await assertFails(admin.doc('users/target').update({ role: 'admin' }));
  await assertSucceeds(superadmin.doc('users/target').update({ role: 'admin' }));
});
