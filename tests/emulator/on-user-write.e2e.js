// Runs the deployed function code inside the emulators: npm run test:e2e
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app, auth, db;

before(() => {
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'run through: firebase emulators:exec');
  app = initializeApp({ projectId: 'demo-neurodev' }, 'e2e');
  auth = getAuth(app);
  db = getFirestore(app);
});
after(() => deleteApp(app));

async function waitFor(check, { timeout = 90000, every = 250 } = {}) {
  const deadline = Date.now() + timeout;
  for (;;) {
    const value = await check();
    if (value) return value;
    if (Date.now() > deadline) throw new Error('timed out waiting for the function');
    await new Promise(resolve => setTimeout(resolve, every));
  }
}

const claimsOf = async uid => (await auth.getUser(uid)).customClaims || {};

test('onUserWrite mirrors claims, emails on approval and clears claims on delete', async () => {
  const uid = `e2e-${Date.now()}`;
  const email = `${uid}@example.com`;
  await auth.createUser({ uid, email, password: 'password123' });

  await db.doc(`users/${uid}`).set({
    firstName: 'e2e', lastName: 'student', email, role: 'student', status: 'pending',
    studentType: 'current', courses: {}, certificates: []
  });
  await waitFor(async () => (await claimsOf(uid)).status === 'pending');

  await db.doc(`users/${uid}`).update({ status: 'approved' });
  await waitFor(async () => (await claimsOf(uid)).status === 'approved');

  const mail = await waitFor(async () => {
    const snap = await db.collection('mail').where('to', '==', email).get();
    return snap.empty ? null : snap.docs[0].data();
  });
  assert.equal(mail.message.subject, 'Your NeuroDev Account Has Been Approved!');
  assert.match(mail.message.html, /Welcome to NeuroDev, E2e!/);

  const stored = await waitFor(async () => {
    const data = (await db.doc(`users/${uid}`).get()).data();
    return data.claimsUpdatedAt ? data : null;
  });
  assert.equal(stored.status, 'approved');

  await db.doc(`users/${uid}`).update({ role: 'admin' });
  await waitFor(async () => (await claimsOf(uid)).role === 'admin');

  await db.doc(`users/${uid}`).delete();
  await waitFor(async () => {
    const claims = await claimsOf(uid);
    return claims.role === undefined && claims.status === undefined;
  });
});
