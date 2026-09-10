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

const dated = {
  'subs/a': { status: 'graded', submittedAt: new Date('2026-06-03T00:00:00Z') },
  'subs/b': { status: 'needs_grading', submittedAt: new Date('2026-06-01T00:00:00Z') },
  'subs/c': { status: 'needs_grading', submittedAt: new Date('2026-06-02T00:00:00Z') },
  'subs/d': { status: 'needs_grading' }
};

test('getDocs honours orderBy in both directions and limit, dropping docs without the field', async () => {
  const fs = createFakeFirestore({ seed: dated });
  const col = fs.collection(fs.db, 'subs');
  const asc = await fs.getDocs(fs.query(col, fs.orderBy('submittedAt', 'asc')));
  assert.deepEqual(asc.docs.map(d => d.id), ['b', 'c', 'a']);
  const desc = await fs.getDocs(fs.query(col, fs.orderBy('submittedAt', 'desc'), fs.limit(2)));
  assert.deepEqual(desc.docs.map(d => d.id), ['a', 'c']);
  const filtered = await fs.getDocs(fs.query(col, fs.where('status', 'in', ['needs_grading']), fs.orderBy('submittedAt')));
  assert.deepEqual(filtered.docs.map(d => d.id), ['b', 'c']);
});

test('onSnapshot delivers asynchronously, then again after writes that change the result set', async () => {
  const fs = createFakeFirestore({ seed: dated });
  const q = fs.query(fs.collection(fs.db, 'subs'), fs.where('status', '==', 'needs_grading'), fs.orderBy('submittedAt'));
  const deliveries = [];
  const unsubscribe = fs.onSnapshot(q, snap => deliveries.push(snap.docs.map(d => d.id)));
  assert.deepEqual(deliveries, []);
  await Promise.resolve();
  assert.deepEqual(deliveries, [['b', 'c']]);

  await fs.updateDoc(fs.doc(fs.db, 'subs', 'b'), { status: 'graded' });
  await fs.setDoc(fs.doc(fs.db, 'subs', 'e'), { status: 'needs_grading', submittedAt: new Date('2026-05-30T00:00:00Z') });
  await Promise.resolve();
  assert.deepEqual(deliveries.at(-1), ['e', 'c']);

  const afterWrites = deliveries.length;
  await fs.setDoc(fs.doc(fs.db, 'other', 'x'), { status: 'needs_grading' });
  await Promise.resolve();
  assert.equal(deliveries.length, afterWrites);

  assert.equal(fs.listenerCount(), 1);
  unsubscribe();
  assert.equal(fs.listenerCount(), 0);
  const before = deliveries.length;
  await fs.deleteDoc(fs.doc(fs.db, 'subs', 'c'));
  await Promise.resolve();
  assert.equal(deliveries.length, before);
});

test('addDoc generates an id and logs an add write', async () => {
  const fs = createFakeFirestore();
  const ref = await fs.addDoc(fs.collection(fs.db, 'mail'), { to: 'x' });
  assert.equal(ref.path, `mail/${ref.id}`);
  assert.equal(fs.writes.at(-1).type, 'add');
  assert.equal(fs.get(ref.path).to, 'x');
});
