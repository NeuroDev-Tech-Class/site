import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeFirestore } from '../helpers/fake-firestore.js';
import { testResultsRepo } from '../../assets/js/data/test-results.js';

let fs, results;
const email = 'stu@example.com';
beforeEach(() => {
  fs = createFakeFirestore({ seed: {
    [`testResults/${email}`]: {
      'python-1_unit-1': { score: null, total: 10, answers: { Q1: 'A' } },
      'python-1_unit-2': { score: 7, total: 10 }
    }
  } });
  results = testResultsRepo(fs);
});

test('getForEmail returns the flat results map, or an empty object when missing', async () => {
  const data = await results.getForEmail(email);
  assert.deepEqual(Object.keys(data).sort(), ['python-1_unit-1', 'python-1_unit-2']);
  assert.deepEqual(await results.getForEmail('nobody@example.com'), {});
  assert.deepEqual(await results.getForEmail(''), {});
});

test('saveScore merges one result under its key and leaves the others alone', async () => {
  const updated = { score: 9, total: 10, answers: { Q1: 'A' }, gradedAt: '2026-09-08T12:00:00.000Z', gradedBy: 'adm1' };
  await results.saveScore(email, 'python-1_unit-1', updated);
  const stored = fs.get(`testResults/${email}`);
  assert.deepEqual(stored['python-1_unit-1'], updated);
  assert.deepEqual(stored['python-1_unit-2'], { score: 7, total: 10 });
  const write = fs.writes.at(-1);
  assert.equal(write.type, 'set');
  assert.equal(write.options.merge, true);
});
