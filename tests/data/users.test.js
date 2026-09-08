import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeFirestore } from '../helpers/fake-firestore.js';
import { usersRepo } from '../../assets/js/data/users.js';

let fs, users;
beforeEach(() => {
  fs = createFakeFirestore({ seed: {
    'users/s1': { firstName: 'a', lastName: 'b', role: 'student', status: 'pending', studentType: 'current', certificates: [] },
    'users/s2': { firstName: 'c', lastName: 'd', role: 'student', status: 'approved', studentType: 'current', certificates: [] },
    'users/a1': { firstName: 'e', lastName: 'f', role: 'admin', status: 'approved' }
  } });
  users = usersRepo(fs);
});

test('getUser returns the document with its id, or null when missing', async () => {
  assert.deepEqual(await users.getUser('a1'), { id: 'a1', firstName: 'e', lastName: 'f', role: 'admin', status: 'approved' });
  assert.equal(await users.getUser('missing'), null);
});

test('listByRole returns only matching users with ids', async () => {
  const students = await users.listByRole('student');
  assert.deepEqual(students.map(u => u.id).sort(), ['s1', 's2']);
  assert.deepEqual((await users.listByRole('admin')).map(u => u.id), ['a1']);
});

test('approve sets status and a server-side approvedAt', async () => {
  await users.approve('s1');
  const stored = fs.get('users/s1');
  assert.equal(stored.status, 'approved');
  assert.equal(stored.approvedAt.getTime(), fs.now.getTime());
  assert.deepEqual(fs.writes.map(w => [w.type, w.path]), [['update', 'users/s1']]);
});

test('remove deletes the document', async () => {
  await users.remove('s1');
  assert.equal(fs.has('users/s1'), false);
});

test('setStudentType changes only studentType', async () => {
  await users.setStudentType('s2', 'old');
  assert.equal(fs.get('users/s2').studentType, 'old');
  assert.deepEqual(fs.writes.at(-1).data, { studentType: 'old' });
});

test('setRole writes the role plus any extra fields', async () => {
  await users.setRole('s2', 'admin');
  assert.equal(fs.get('users/s2').role, 'admin');
  await users.setRole('a1', 'student', { status: 'approved', studentType: 'current' });
  assert.deepEqual(fs.writes.at(-1).data, { role: 'student', status: 'approved', studentType: 'current' });
});

test('addCertificate appends to the existing list without dropping earlier ones', async () => {
  const first = { courseId: 'python-1', courseName: 'Python I', awardedAt: '2026-01-01T00:00:00.000Z' };
  const second = { courseId: 'linux', courseName: 'Linux', awardedAt: '2026-02-01T00:00:00.000Z' };
  await users.addCertificate('s2', [], first);
  await users.addCertificate('s2', [first], second);
  assert.deepEqual(fs.get('users/s2').certificates, [first, second]);
});
