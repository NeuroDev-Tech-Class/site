import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRulesEnv, assertSucceeds, assertFails } from '../helpers/rules-env.js';

let env;
const path = 'testResults/student@example.com';
const existing = { 'python-1_unit-1': { score: null, total: 10, answers: { Q1: 'A' } } };

before(async () => { env = await createRulesEnv('test-results'); });
after(() => env.cleanup());
beforeEach(async () => {
  await env.clear();
  await env.seed(path, existing);
});

test('anonymous create is denied', async () => {
  await assertFails(env.anon().doc('testResults/new@example.com').set({ x: 1 }));
});

test('anonymous update of an existing row is denied', async () => {
  await assertFails(env.anon().doc(path).set({ injected: '<img onerror=1>' }, { merge: true }));
});

test('a student cannot read or write any row, including their own email', async () => {
  const db = await env.asStudent('stu1');
  await assertFails(db.doc(path).get());
  await assertFails(db.doc(path).set({ hacked: true }, { merge: true }));
});

test('an admin can read a row', async () => {
  const db = await env.asAdmin('adm1');
  await assertSucceeds(db.doc(path).get());
});

test('an admin can grade an existing row with a merge write', async () => {
  const db = await env.asAdmin('adm1');
  await assertSucceeds(db.doc(path).set(
    { 'python-1_unit-1': { ...existing['python-1_unit-1'], score: 8, gradedBy: 'adm1' } },
    { merge: true }
  ));
  const stored = await env.read(path);
  assert.equal(stored['python-1_unit-1'].score, 8);
});

test('an admin cannot create a new row', async () => {
  const db = await env.asAdmin('adm1');
  await assertFails(db.doc('testResults/brand-new@example.com').set({ 'x_y': { score: 1 } }));
});

test('an admin cannot delete a row', async () => {
  const db = await env.asAdmin('adm1');
  await assertFails(db.doc(path).delete());
});

test('a superadmin has the same access as an admin', async () => {
  const db = await env.asSuperadmin('sup1');
  await assertSucceeds(db.doc(path).get());
  await assertSucceeds(db.doc(path).update({ 'python-1_unit-1.score': 9 }));
  await assertFails(db.doc('testResults/other@example.com').set({ a: 1 }));
});
