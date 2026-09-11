import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeFirestore } from '../helpers/fake-firestore.js';
import { submissionsRepo } from '../../assets/js/data/submissions.js';
import { createStore } from '../../assets/js/admin/store.js';

const drain = () => Promise.resolve();

function makeQueueSetup() {
  const fs = createFakeFirestore({
    seed: {
      'submissions/a': { status: 'needs_grading', studentUid: 'u1', submittedAt: '2026-06-05T12:00:00.000Z' },
      'submissions/b': { status: 'needs_grading', studentUid: 'u2', submittedAt: '2026-06-01T12:00:00.000Z' },
      'submissions/c': { status: 'graded', studentUid: 'u1', submittedAt: '2026-05-01T12:00:00.000Z' }
    }
  });
  return { fs, repo: submissionsRepo(fs), store: createStore() };
}

test('subscribeQueue fills queue oldest-first and emits a change event', async () => {
  const { store, repo } = makeQueueSetup();
  let changes = 0;
  store.subscribe(() => changes++);
  store.subscribeQueue(repo);
  assert.equal(store.queue, null);
  await drain();
  assert.deepEqual(store.queue.map(s => s.id), ['b', 'a']);
  assert.equal(store.queueError, null);
  assert.ok(changes >= 1);
});

test('subscribing twice keeps a single listener', async () => {
  const { fs, store, repo } = makeQueueSetup();
  store.subscribeQueue(repo);
  store.subscribeQueue(repo);
  await drain();
  assert.equal(fs.listenerCount(), 1);
});

test('disposeQueue unsubscribes the snapshot listener', async () => {
  const { fs, store, repo } = makeQueueSetup();
  store.subscribeQueue(repo);
  await drain();
  assert.equal(fs.listenerCount(), 1);
  store.disposeQueue();
  assert.equal(fs.listenerCount(), 0);
  store.disposeQueue();
});

test('a queue error is kept on the store and emitted', async () => {
  const store = createStore();
  let changes = 0;
  store.subscribe(() => changes++);
  store.subscribeQueue({ subscribeQueue: (onChange, onError) => { onError(new Error('denied')); return () => {}; } });
  assert.equal(store.queue, null);
  assert.equal(store.queueError.message, 'denied');
  assert.equal(changes, 1);
});

test('invalidate clears the lists but leaves the live queue alone', async () => {
  const { store, repo } = makeQueueSetup();
  store.students = [{ id: 's1' }];
  store.admins = [{ id: 'a1' }];
  store.subscribeQueue(repo);
  await drain();
  store.invalidate();
  assert.equal(store.students, null);
  assert.equal(store.admins, null);
  assert.deepEqual(store.queue.map(s => s.id), ['b', 'a']);
});

test('subscribe returns a working unsubscriber', () => {
  const store = createStore();
  let changes = 0;
  const unsubscribe = store.subscribe(() => changes++);
  store.upsertStudent({ id: 's1' });
  store.students = [];
  store.upsertStudent({ id: 's1' });
  const seen = changes;
  assert.ok(seen >= 1);
  unsubscribe();
  store.upsertStudent({ id: 's2' });
  assert.equal(changes, seen);
});
