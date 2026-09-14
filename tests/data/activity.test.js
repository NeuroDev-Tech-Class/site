import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeFirestore } from '../helpers/fake-firestore.js';
import { activityRepo } from '../../assets/js/data/activity.js';

const entry = (summary, createdAt) => ({
  type: 'submission_graded', summary, actorUid: 'a1', actorName: 'Topher',
  subjectUid: 'c1', subjectName: 'Jane Doe', courseId: 'python-1', courseName: 'Python I',
  link: 'admin.html#/students/c1', createdAt
});

const seed = {
  'activity/e1': entry('Oldest', new Date('2026-09-01T12:00:00Z')),
  'activity/e2': entry('Middle', new Date('2026-09-05T12:00:00Z')),
  'activity/e3': entry('Newest', new Date('2026-09-09T12:00:00Z'))
};

test('subscribeFeed delivers newest first with ids attached', async () => {
  const fs = createFakeFirestore({ seed });
  const deliveries = [];
  const unsubscribe = activityRepo(fs).subscribeFeed(list => deliveries.push(list));
  await Promise.resolve();

  assert.deepEqual(deliveries.at(-1).map(e => e.id), ['e3', 'e2', 'e1']);
  assert.deepEqual(deliveries.at(-1).map(e => e.summary), ['Newest', 'Middle', 'Oldest']);

  unsubscribe();
  assert.equal(fs.listenerCount(), 0);
});

test('subscribeFeed honours its limit and re-delivers on a new event', async () => {
  const fs = createFakeFirestore({ seed });
  const deliveries = [];
  activityRepo(fs).subscribeFeed(list => deliveries.push(list), undefined, { limit: 2 });
  await Promise.resolve();
  assert.deepEqual(deliveries.at(-1).map(e => e.id), ['e3', 'e2']);

  await fs.setDoc(fs.doc(fs.db, 'activity', 'e4'), entry('Brand new', new Date('2026-09-10T12:00:00Z')));
  await Promise.resolve();
  assert.deepEqual(deliveries.at(-1).map(e => e.id), ['e4', 'e3']);
});

test('an error from the listener is handed to the error callback', async () => {
  const fs = createFakeFirestore({ seed });
  const errors = [];
  const boom = new Error('permission-denied');
  fs.onSnapshot = (_q, _onNext, onError) => { onError(boom); return () => {}; };

  activityRepo(fs).subscribeFeed(() => {}, error => errors.push(error));
  assert.deepEqual(errors, [boom]);
});
