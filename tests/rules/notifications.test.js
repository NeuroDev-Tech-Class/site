import { test, before, after, beforeEach } from 'node:test';
import { createRulesEnv, assertSucceeds, assertFails } from '../helpers/rules-env.js';

let env;
const ownInbox = 'users/stu1/inbox/n1';
const otherInbox = 'users/stu2/inbox/n1';
const ownCounters = 'users/stu1/meta/counters';
const otherCounters = 'users/stu2/meta/counters';
const event = 'activity/graded__stu1__python-1_unit-1-test__1__1757613600000';

const notification = {
  type: 'submission_graded',
  title: 'Unit 1 Test graded',
  body: 'Python I: you scored 8 / 10 (80%). Passed.',
  link: 'profile.html',
  actorName: 'Topher',
  read: false,
  createdAt: new Date('2026-09-11T18:00:00Z')
};

const activityEntry = {
  type: 'submission_graded',
  summary: "Topher graded Test stu1's Unit 1 Test (8 / 10 (80%))",
  actorUid: 'adm1',
  actorName: 'Topher',
  subjectUid: 'stu1',
  subjectName: 'Test stu1',
  courseId: 'python-1',
  courseName: 'Python I',
  link: 'admin.html#/grade/stu1__python-1_unit-1-test__1',
  createdAt: new Date('2026-09-11T18:00:00Z')
};

before(async () => { env = await createRulesEnv('notifications'); });
after(() => env.cleanup());

beforeEach(async () => {
  await env.clear();
  await env.seed(ownInbox, notification);
  await env.seed(otherInbox, notification);
  await env.seed(ownCounters, { unread: 1 });
  await env.seed(otherCounters, { unread: 1 });
  await env.seed(event, activityEntry);
});

test('a student reads their own inbox and nobody else sees it', async () => {
  const stu1 = await env.asStudent('stu1');
  const stu2 = await env.asStudent('stu2');
  const admin = await env.asAdmin('adm1');

  await assertSucceeds(stu1.doc(ownInbox).get());
  await assertSucceeds(stu1.collection('users/stu1/inbox').orderBy('createdAt', 'desc').limit(20).get());
  await assertFails(stu2.doc(ownInbox).get());
  await assertFails(admin.doc(ownInbox).get());
  await assertFails(env.anon().doc(ownInbox).get());
});

test('the owner may flip read and nothing else', async () => {
  const stu1 = await env.asStudent('stu1');
  await assertSucceeds(stu1.doc(ownInbox).update({ read: true }));
  await assertSucceeds(stu1.doc(ownInbox).update({ read: false }));

  await assertFails(stu1.doc(ownInbox).update({ read: 'yes' }));
  await assertFails(stu1.doc(ownInbox).update({ title: 'Forged' }));
  await assertFails(stu1.doc(ownInbox).update({ read: true, title: 'Forged' }));
  await assertFails(stu1.doc(ownInbox).update({ link: 'https://evil.example.com' }));
});

test('nobody creates or deletes a notification from a client', async () => {
  const stu1 = await env.asStudent('stu1');
  const admin = await env.asAdmin('adm1');
  const superadmin = await env.asSuperadmin('sup1');

  await assertFails(stu1.doc('users/stu1/inbox/forged').set(notification));
  await assertFails(admin.doc('users/stu1/inbox/forged').set(notification));
  await assertFails(superadmin.doc('users/stu1/inbox/forged').set(notification));
  await assertFails(stu1.doc(ownInbox).delete());
  await assertFails(admin.doc(ownInbox).delete());
});

test("a student updating someone else's inbox is refused", async () => {
  const stu2 = await env.asStudent('stu2');
  await assertFails(stu2.doc(ownInbox).update({ read: true }));
});

test('counters are readable by their owner and writable by nobody', async () => {
  const stu1 = await env.asStudent('stu1');
  const stu2 = await env.asStudent('stu2');
  const admin = await env.asAdmin('adm1');

  await assertSucceeds(stu1.doc(ownCounters).get());
  await assertFails(stu2.doc(ownCounters).get());
  await assertFails(admin.doc(ownCounters).get());
  await assertFails(stu1.doc(ownCounters).update({ unread: 0 }));
  await assertFails(stu1.doc(ownCounters).set({ unread: 0 }));
  await assertFails(stu1.doc('users/stu1/meta/anything').set({ x: 1 }));
  await assertFails(stu1.doc(otherCounters).get());
});

test('the activity feed is admin read only', async () => {
  const admin = await env.asAdmin('adm1');
  const superadmin = await env.asSuperadmin('sup1');
  const student = await env.asStudent('stu1');

  await assertSucceeds(admin.doc(event).get());
  await assertSucceeds(admin.collection('activity').orderBy('createdAt', 'desc').limit(100).get());
  await assertSucceeds(superadmin.collection('activity').orderBy('createdAt', 'desc').limit(100).get());

  await assertFails(student.doc(event).get());
  await assertFails(student.collection('activity').orderBy('createdAt', 'desc').limit(100).get());
  await assertFails(env.anon().doc(event).get());
});

test('nobody writes the activity feed from a client', async () => {
  const admin = await env.asAdmin('adm1');
  const superadmin = await env.asSuperadmin('sup1');

  await assertFails(admin.doc('activity/forged').set(activityEntry));
  await assertFails(superadmin.doc('activity/forged').set(activityEntry));
  await assertFails(admin.doc(event).update({ summary: 'Rewritten' }));
  await assertFails(admin.doc(event).delete());
});
