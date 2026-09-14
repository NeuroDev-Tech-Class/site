import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakeAdminDb, fakeFieldValue } from './helpers.js';

test('create writes the document and a second create on the same path raises code 6', async () => {
  const db = fakeAdminDb();
  await db.doc('users/a/inbox/n1').create({ title: 'Graded', read: false });
  assert.deepEqual(db.get('users/a/inbox/n1'), { title: 'Graded', read: false });

  const err = await db.doc('users/a/inbox/n1').create({ title: 'Again' }).then(() => null, e => e);
  assert.equal(err?.code, 6);
  assert.equal(db.get('users/a/inbox/n1').title, 'Graded');
});

test('set replaces, set with merge keeps the fields it does not mention', async () => {
  const db = fakeAdminDb({ 'users/a/meta/counters': { unread: 3, other: true } });
  await db.doc('users/a/meta/counters').set({ unread: 5 }, { merge: true });
  assert.deepEqual(db.get('users/a/meta/counters'), { unread: 5, other: true });

  await db.doc('users/a/meta/counters').set({ unread: 1 });
  assert.deepEqual(db.get('users/a/meta/counters'), { unread: 1 });
});

test('increment adds and subtracts, and counts a missing field as zero', async () => {
  const db = fakeAdminDb({ 'users/a/meta/counters': { unread: 2 } });
  const counters = db.doc('users/a/meta/counters');

  await counters.set({ unread: fakeFieldValue.increment(1) }, { merge: true });
  assert.equal(db.get('users/a/meta/counters').unread, 3);

  await counters.set({ unread: fakeFieldValue.increment(-2) }, { merge: true });
  assert.equal(db.get('users/a/meta/counters').unread, 1);

  await db.doc('users/b/meta/counters').set({ unread: fakeFieldValue.increment(1) }, { merge: true });
  assert.equal(db.get('users/b/meta/counters').unread, 1);

  await counters.update({ unread: fakeFieldValue.increment(4) });
  assert.equal(db.get('users/a/meta/counters').unread, 5);
});

test('a where query matches direct children only, for == and in', async () => {
  const db = fakeAdminDb({
    'users/a': { role: 'student' },
    'users/b': { role: 'admin' },
    'users/c': { role: 'superadmin' },
    'users/a/inbox/n1': { role: 'admin' }
  });

  const admins = await db.collection('users').where('role', 'in', ['admin', 'superadmin']).get();
  assert.deepEqual(admins.docs.map(d => d.id), ['b', 'c']);
  assert.equal(admins.empty, false);
  assert.equal(admins.size, 2);
  assert.deepEqual(admins.docs[0].data(), { role: 'admin' });

  const students = await db.collection('users').where('role', '==', 'student').get();
  assert.deepEqual(students.docs.map(d => d.id), ['a']);

  const none = await db.collection('users').where('role', '==', 'ghost').get();
  assert.equal(none.empty, true);
  assert.deepEqual(none.docs, []);
});

test('doc get reports existence and returns a copy', async () => {
  const db = fakeAdminDb({ 'users/a': { firstName: 'Jane' } });
  const snap = await db.doc('users/a').get();
  assert.equal(snap.exists, true);
  assert.equal(snap.id, 'a');
  snap.data().firstName = 'mutated';
  assert.equal(db.get('users/a').firstName, 'Jane');

  const missing = await db.doc('users/zzz').get();
  assert.equal(missing.exists, false);
  assert.equal(missing.data(), undefined);
});

test('adds and updates stay recorded so the existing handler tests keep working', async () => {
  const db = fakeAdminDb();
  await db.collection('mail').add({ to: 'x@example.com' });
  await db.doc('users/a').update({ claimsUpdatedAt: fakeFieldValue.serverTimestamp() });

  assert.deepEqual(db.adds, [['mail', { to: 'x@example.com' }]]);
  assert.deepEqual(db.updates, [['users/a', { claimsUpdatedAt: 'SERVER_TIMESTAMP' }]]);
  assert.equal(db.get('users/a').claimsUpdatedAt, 'SERVER_TIMESTAMP');
});
