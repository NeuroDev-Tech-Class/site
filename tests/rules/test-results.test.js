import { test, before, after, beforeEach } from 'node:test';
import { createRulesEnv, assertFails } from '../helpers/rules-env.js';

// testResults is dead data since the Phase 1 migration: nobody reads or writes it from the client.
let env;
const path = 'testResults/student@example.com';
const existing = { 'python-1_unit-1': { score: null, total: 10, answers: { Q1: 'A' } } };

before(async () => { env = await createRulesEnv('test-results'); });
after(() => env.cleanup());
beforeEach(async () => {
  await env.clear();
  await env.seed(path, existing);
});

test('anonymous read and write are denied', async () => {
  const db = env.anon();
  await assertFails(db.doc(path).get());
  await assertFails(db.doc(path).set({ injected: '<img onerror=1>' }, { merge: true }));
});

test('a student cannot read or write any row, including their own email', async () => {
  const db = await env.asStudent('student');
  await assertFails(db.doc(path).get());
  await assertFails(db.doc(path).set({ hacked: true }, { merge: true }));
});

test('admins and superadmins can no longer read, update, create or delete rows', async () => {
  for (const db of [await env.asAdmin('adm1'), await env.asSuperadmin('sup1')]) {
    await assertFails(db.doc(path).get());
    await assertFails(db.doc(path).update({ 'python-1_unit-1.score': 9 }));
    await assertFails(db.doc('testResults/new@example.com').set({ 'x_y': { score: 1 } }));
    await assertFails(db.doc(path).delete());
  }
});
