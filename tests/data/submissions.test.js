import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeFirestore } from '../helpers/fake-firestore.js';
import { submissionsRepo } from '../../assets/js/data/submissions.js';

const at = iso => new Date(iso);
let fs, repo;
beforeEach(() => {
  fs = createFakeFirestore({ seed: {
    'submissions/s1__k1__1': { studentUid: 's1', status: 'needs_grading', submittedAt: at('2026-06-02T00:00:00Z'), manualScore: null, totalMax: 10 },
    'submissions/s1__k2__1': { studentUid: 's1', status: 'graded', submittedAt: at('2026-06-01T00:00:00Z'), manualScore: 8, totalMax: 10 },
    'submissions/s2__k1__1': { studentUid: 's2', status: 'submitted', submittedAt: at('2026-05-30T00:00:00Z'), manualScore: null, totalMax: null },
    'submissions/s2__k2__1': { studentUid: 's2', status: 'needs_grading', submittedAt: at('2026-06-03T00:00:00Z'), manualScore: null, totalMax: 10 }
  } });
  repo = submissionsRepo(fs);
});

test('subscribeQueue delivers ungraded submissions oldest first with ids and honours the limit', async () => {
  const seen = [];
  const stop = repo.subscribeQueue(list => seen.push(list.map(s => s.id)), () => {});
  await Promise.resolve();
  assert.deepEqual(seen, [['s2__k1__1', 's1__k1__1', 's2__k2__1']]);
  await fs.updateDoc(fs.doc(fs.db, 'submissions', 's1__k1__1'), { status: 'graded' });
  await Promise.resolve();
  assert.deepEqual(seen.at(-1), ['s2__k1__1', 's2__k2__1']);
  stop();
  assert.equal(fs.listenerCount(), 0);

  const capped = [];
  repo.subscribeQueue(list => capped.push(list.map(s => s.id)), () => {}, { limit: 1 });
  await Promise.resolve();
  assert.deepEqual(capped, [['s2__k1__1']]);
});

test('listForStudent returns only that student, newest first, with the limit applied', async () => {
  assert.deepEqual((await repo.listForStudent('s1')).map(s => s.id), ['s1__k1__1', 's1__k2__1']);
  assert.deepEqual((await repo.listForStudent('s2', 1)).map(s => s.id), ['s2__k2__1']);
  assert.deepEqual(await repo.listForStudent('nobody'), []);
});

test('get returns the submission with its id, or null when missing', async () => {
  const sub = await repo.get('s1__k2__1');
  assert.equal(sub.id, 's1__k2__1');
  assert.equal(sub.manualScore, 8);
  assert.equal(await repo.get('missing'), null);
});

test('grade writes exactly the fields the rules allow, with server timestamps', async () => {
  await repo.grade('s1__k1__1', { manualScore: 7, totalMax: 10, feedback: 'Nice work' }, 'admin1');
  const write = fs.writes.at(-1);
  assert.equal(write.type, 'update');
  assert.equal(write.path, 'submissions/s1__k1__1');
  assert.deepEqual(Object.keys(write.data).sort(), ['feedback', 'gradedAt', 'gradedBy', 'manualScore', 'status', 'totalMax', 'updatedAt']);
  assert.deepEqual({ ...write.data, gradedAt: null, updatedAt: null },
    { manualScore: 7, totalMax: 10, feedback: 'Nice work', status: 'graded', gradedBy: 'admin1', gradedAt: null, updatedAt: null });
  assert.equal(write.data.gradedAt.getTime(), fs.now.getTime());
  assert.equal(write.data.updatedAt.getTime(), fs.now.getTime());
  const stored = fs.get('submissions/s1__k1__1');
  assert.equal(stored.status, 'graded');
  assert.equal(stored.studentUid, 's1');
});

test('grade defaults feedback to an empty string and keeps a null totalMax', async () => {
  await repo.grade('s2__k1__1', { manualScore: 5, totalMax: null }, 'admin1');
  assert.equal(fs.writes.at(-1).data.feedback, '');
  assert.equal(fs.writes.at(-1).data.totalMax, null);
});
