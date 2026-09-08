import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRulesEnv, assertSucceeds, assertFails, SUPERADMIN_EMAIL } from '../helpers/rules-env.js';

let env;

before(async () => { env = await createRulesEnv('users'); });
after(() => env.cleanup());
beforeEach(() => env.clear());

test('anonymous users cannot read a user document', async () => {
  await env.seed('users/stu1', env.userDoc('stu1', 'student', 'approved'));
  await assertFails(env.anon().doc('users/stu1').get());
});

test('a student can read their own document but not another student', async () => {
  const db = await env.asStudent('stu1');
  await env.seed('users/stu2', env.userDoc('stu2', 'student', 'approved'));
  await assertSucceeds(db.doc('users/stu1').get());
  await assertFails(db.doc('users/stu2').get());
});

test('an admin can read any user document', async () => {
  const db = await env.asAdmin('adm1');
  await env.seed('users/stu2', env.userDoc('stu2', 'student', 'pending'));
  await assertSucceeds(db.doc('users/stu2').get());
});

test('registration may create a pending student for the caller uid only', async () => {
  const db = env.signedInNoDoc('new1');
  await assertSucceeds(db.doc('users/new1').set(env.userDoc('new1', 'student', 'pending')));
  await assertFails(db.doc('users/someone-else').set(env.userDoc('someone-else', 'student', 'pending')));
});

test('registration cannot self-assign admin, approved, or superadmin without the owner email', async () => {
  const db = env.signedInNoDoc('new1');
  await assertFails(db.doc('users/new1').set(env.userDoc('new1', 'admin', 'approved')));
  await assertFails(db.doc('users/new1').set(env.userDoc('new1', 'student', 'approved')));
  await assertFails(db.doc('users/new1').set(env.userDoc('new1', 'superadmin', 'approved')));
});

test('the owner email may register as superadmin', async () => {
  const db = env.asSuperadminEmail('owner');
  await assertSucceeds(db.doc('users/owner').set({
    ...env.userDoc('owner', 'superadmin', 'approved'),
    email: SUPERADMIN_EMAIL
  }));
});

test('a student can update only their own courses map', async () => {
  const db = await env.asStudent('stu1');
  await assertSucceeds(db.doc('users/stu1').update({ 'courses.python-1': { '0-0': true } }));
  await assertFails(db.doc('users/stu1').update({ status: 'approved', role: 'admin' }));
  await assertFails(db.doc('users/stu1').update({ firstName: 'Renamed' }));
  await assertFails(db.doc('users/stu1').update({ certificates: [{ courseId: 'python-1' }] }));
});

test('a pending student cannot approve themselves', async () => {
  const db = await env.asPendingStudent('pend1');
  await assertFails(db.doc('users/pend1').update({ status: 'approved' }));
});

test('a student cannot update another student', async () => {
  const db = await env.asStudent('stu1');
  await env.seed('users/stu2', env.userDoc('stu2', 'student', 'approved'));
  await assertFails(db.doc('users/stu2').update({ 'courses.python-1': { '0-0': true } }));
});

test('an admin can approve, change studentType and award certificates, but not change role', async () => {
  const db = await env.asAdmin('adm1');
  await env.seed('users/stu2', env.userDoc('stu2', 'student', 'pending'));
  await assertSucceeds(db.doc('users/stu2').update({ status: 'approved' }));
  await assertSucceeds(db.doc('users/stu2').update({ studentType: 'old' }));
  await assertSucceeds(db.doc('users/stu2').update({ certificates: [{ courseId: 'python-1', courseName: 'Python I' }] }));
  await assertFails(db.doc('users/stu2').update({ role: 'admin' }));
  const stored = await env.read('users/stu2');
  assert.equal(stored.role, 'student');
});

test('a superadmin can change roles', async () => {
  const db = await env.asSuperadmin('sup1');
  await env.seed('users/stu2', env.userDoc('stu2', 'student', 'approved'));
  await assertSucceeds(db.doc('users/stu2').update({ role: 'admin' }));
  await assertSucceeds(db.doc('users/stu2').update({ role: 'student', status: 'approved', studentType: 'current' }));
});

test('an admin can delete a user; a student cannot delete anyone, including themselves', async () => {
  const admin = await env.asAdmin('adm1');
  const student = await env.asStudent('stu1');
  await env.seed('users/stu2', env.userDoc('stu2', 'student', 'pending'));
  await assertFails(student.doc('users/stu1').delete());
  await assertFails(student.doc('users/stu2').delete());
  await assertSucceeds(admin.doc('users/stu2').delete());
});

test('only admins can queue mail, and nobody can read it from the client', async () => {
  const admin = await env.asAdmin('adm1');
  const student = await env.asStudent('stu1');
  const mail = { to: 'x@example.com', message: { subject: 'Hi', html: '<p>Hi</p>' } };
  await assertSucceeds(admin.collection('mail').add(mail));
  await assertFails(student.collection('mail').add(mail));
  await assertFails(env.anon().collection('mail').add(mail));
  await assertFails(admin.collection('mail').get());
});

test('collections without rules are closed to everyone', async () => {
  const admin = await env.asAdmin('adm1');
  await assertFails(admin.doc('settings/site').get());
  await assertFails(admin.doc('settings/site').set({ a: 1 }));
});
