import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeFirestore } from './fake-firestore.js';

test('getDoc reports existence and returns a copy of the data', async () => {
  const fs = createFakeFirestore({ seed: { 'users/a': { name: 'A' } } });
  const snap = await fs.getDoc(fs.doc(fs.db, 'users', 'a'));
  assert.equal(snap.exists(), true);
  snap.data().name = 'mutated';
  assert.equal(fs.get('users/a').name, 'A');
  assert.equal((await fs.getDoc(fs.doc(fs.db, 'users', 'zzz'))).exists(), false);
});

test('getDocs applies == filters and only matches direct children', async () => {
  const fs = createFakeFirestore({ seed: {
    'users/a': { role: 'student' },
    'users/b': { role: 'admin' },
    'users/a/progress/x': { role: 'student' }
  } });
  const snap = await fs.getDocs(fs.query(fs.collection(fs.db, 'users'), fs.where('role', '==', 'student')));
  assert.deepEqual(snap.docs.map(d => d.id), ['a']);
});

test('updateDoc supports dot paths, resolves serverTimestamp and refuses missing docs', async () => {
  const fs = createFakeFirestore({ seed: { 'users/a': { courses: {} } } });
  await fs.updateDoc(fs.doc(fs.db, 'users', 'a'), { 'courses.python-1._total': 5, seenAt: fs.serverTimestamp() });
  assert.deepEqual(fs.get('users/a').courses, { 'python-1': { _total: 5 } });
  assert.equal(fs.get('users/a').seenAt.getTime(), fs.now.getTime());
  await assert.rejects(fs.updateDoc(fs.doc(fs.db, 'users', 'nope'), { x: 1 }), /no document/);
});

test('setDoc with merge deep-merges nested maps; without merge it replaces', async () => {
  const fs = createFakeFirestore({ seed: { 'testResults/e': { k1: { score: null, total: 10 }, k2: { score: 3 } } } });
  const ref = fs.doc(fs.db, 'testResults', 'e');
  await fs.setDoc(ref, { k1: { score: 8 } }, { merge: true });
  assert.deepEqual(fs.get('testResults/e'), { k1: { score: 8, total: 10 }, k2: { score: 3 } });
  await fs.setDoc(ref, { only: true });
  assert.deepEqual(fs.get('testResults/e'), { only: true });
});

test('addDoc generates an id and logs an add write', async () => {
  const fs = createFakeFirestore();
  const ref = await fs.addDoc(fs.collection(fs.db, 'mail'), { to: 'x' });
  assert.equal(ref.path, `mail/${ref.id}`);
  assert.equal(fs.writes.at(-1).type, 'add');
  assert.equal(fs.get(ref.path).to, 'x');
});
