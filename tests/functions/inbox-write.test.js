import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleInboxWrite } from '../../functions/lib/inbox-write.js';
import { fakeAdminDb, fakeFieldValue } from './helpers.js';

const unread = { type: 'submission_graded', title: 'Unit 1 Test graded', read: false };
const read = { ...unread, read: true };
const counters = 'users/stu1/meta/counters';

const run = (before, after, seed = {}) => {
  const db = fakeAdminDb(seed);
  return handleInboxWrite({ db, FieldValue: fakeFieldValue }, 'stu1', before, after).then(result => ({ db, result }));
};

test('a new unread notification adds one, creating the counters document', async () => {
  const { db, result } = await run(null, unread);
  assert.equal(result.delta, 1);
  assert.equal(db.get(counters).unread, 1);
  assert.deepEqual(db.sets.map(([path, , options]) => [path, options]), [[counters, { merge: true }]]);
});

test('marking one read takes one away', async () => {
  const { db, result } = await run(unread, read, { [counters]: { unread: 3 } });
  assert.equal(result.delta, -1);
  assert.equal(db.get(counters).unread, 2);
});

test('marking one unread again puts it back', async () => {
  const { db, result } = await run(read, unread, { [counters]: { unread: 2 } });
  assert.equal(result.delta, 1);
  assert.equal(db.get(counters).unread, 3);
});

test('deleting an unread notification takes one away, deleting a read one does not', async () => {
  const removedUnread = await run(unread, null, { [counters]: { unread: 2 } });
  assert.equal(removedUnread.result.delta, -1);
  assert.equal(removedUnread.db.get(counters).unread, 1);

  const removedRead = await run(read, null, { [counters]: { unread: 2 } });
  assert.equal(removedRead.result.delta, 0);
  assert.equal(removedRead.db.get(counters).unread, 2);
});

test('a notification that arrives already read changes nothing', async () => {
  const { db, result } = await run(null, read);
  assert.equal(result.delta, 0);
  assert.deepEqual(db.sets, []);
});

test('an edit that leaves the read flag alone writes nothing', async () => {
  const { db, result } = await run(unread, { ...unread, title: 'Retitled' });
  assert.equal(result.delta, 0);
  assert.deepEqual(db.sets, []);

  const stillRead = await run(read, { ...read, title: 'Retitled' });
  assert.equal(stillRead.result.delta, 0);
  assert.deepEqual(stillRead.db.sets, []);
});

test('the counter can go negative rather than being clamped, and the client floors it', async () => {
  const { db } = await run(unread, read, { [counters]: { unread: 0 } });
  assert.equal(db.get(counters).unread, -1);
});
