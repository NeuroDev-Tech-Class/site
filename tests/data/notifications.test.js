import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeFirestore } from '../helpers/fake-firestore.js';
import { notificationsRepo } from '../../assets/js/data/notifications.js';

const notif = (title, createdAt, read = false) => ({
  type: 'submission_graded', title, body: 'b', link: 'profile.html', actorName: '', read, createdAt
});

const seed = {
  'users/c1/meta/counters': { unread: 2 },
  'users/c1/inbox/n1': notif('Oldest', new Date('2026-09-01T12:00:00Z'), true),
  'users/c1/inbox/n2': notif('Middle', new Date('2026-09-05T12:00:00Z')),
  'users/c1/inbox/n3': notif('Newest', new Date('2026-09-09T12:00:00Z')),
  'users/c2/inbox/n9': notif('Someone else', new Date('2026-09-09T12:00:00Z'))
};

const make = () => {
  const fs = createFakeFirestore({ seed });
  return { fs, repo: notificationsRepo(fs) };
};

test('subscribeInbox delivers the newest first, capped, and only for that user', async () => {
  const { fs, repo } = make();
  const deliveries = [];
  const unsubscribe = repo.subscribeInbox('c1', list => deliveries.push(list));
  await Promise.resolve();

  assert.deepEqual(deliveries.at(-1).map(n => n.title), ['Newest', 'Middle', 'Oldest']);
  assert.deepEqual(deliveries.at(-1).map(n => n.id), ['n3', 'n2', 'n1']);
  assert.equal(typeof unsubscribe, 'function');
  unsubscribe();
  assert.equal(fs.listenerCount(), 0);
});

test('subscribeInbox honours its limit', async () => {
  const { repo } = make();
  const deliveries = [];
  repo.subscribeInbox('c1', list => deliveries.push(list), undefined, { limit: 2 });
  await Promise.resolve();
  assert.deepEqual(deliveries.at(-1).map(n => n.id), ['n3', 'n2']);
});

test('subscribeInbox re-delivers when a notification arrives', async () => {
  const { fs, repo } = make();
  const deliveries = [];
  repo.subscribeInbox('c1', list => deliveries.push(list));
  await Promise.resolve();

  await fs.setDoc(fs.doc(fs.db, 'users', 'c1', 'inbox', 'n4'),
    notif('Brand new', new Date('2026-09-10T12:00:00Z')));
  await Promise.resolve();
  assert.deepEqual(deliveries.at(-1).map(n => n.id), ['n4', 'n3', 'n2', 'n1']);
});

test('subscribeUnreadCount reports the stored count and floors it at zero', async () => {
  const { fs, repo } = make();
  const counts = [];
  const unsubscribe = repo.subscribeUnreadCount('c1', n => counts.push(n));
  await Promise.resolve();
  assert.deepEqual(counts, [2]);

  await fs.setDoc(fs.doc(fs.db, 'users', 'c1', 'meta', 'counters'), { unread: -3 });
  await Promise.resolve();
  assert.equal(counts.at(-1), 0);

  unsubscribe();
  assert.equal(fs.listenerCount(), 0);
});

test('subscribeUnreadCount reports zero when the counters document does not exist yet', async () => {
  const { repo } = make();
  const counts = [];
  repo.subscribeUnreadCount('c2', n => counts.push(n));
  await Promise.resolve();
  assert.deepEqual(counts, [0]);
});

test('markRead touches only the read flag on the right document', async () => {
  const { fs, repo } = make();
  await repo.markRead('c1', 'n2');
  assert.deepEqual(fs.writes.at(-1), { type: 'update', path: 'users/c1/inbox/n2', data: { read: true } });
  assert.equal(fs.get('users/c1/inbox/n2').read, true);
  assert.equal(fs.get('users/c1/inbox/n2').title, 'Middle');
});

test('markAllRead writes one read-only update per id and none for an empty list', async () => {
  const { fs, repo } = make();
  await repo.markAllRead('c1', ['n2', 'n3']);

  const updates = fs.writes.filter(w => w.type === 'update');
  assert.deepEqual(updates.map(w => w.path), ['users/c1/inbox/n2', 'users/c1/inbox/n3']);
  assert.ok(updates.every(w => Object.keys(w.data).join() === 'read' && w.data.read === true));

  const before = fs.writes.length;
  await repo.markAllRead('c1', []);
  assert.equal(fs.writes.length, before);
});
