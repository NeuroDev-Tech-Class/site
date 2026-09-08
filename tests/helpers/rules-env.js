import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} from '@firebase/rules-unit-testing';

const rules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');

export const SUPERADMIN_EMAIL = 'neurodevtechcoach@gmail.com';

// Suites run in parallel against one emulator, so each gets its own demo project.
export async function createRulesEnv(suite) {
  const env = await initializeTestEnvironment({
    projectId: `demo-neurodev-${suite}`,
    firestore: { rules }
  });

  async function seed(path, data) {
    await env.withSecurityRulesDisabled(ctx => ctx.firestore().doc(path).set(data));
  }

  async function read(path) {
    let snap;
    await env.withSecurityRulesDisabled(async ctx => { snap = await ctx.firestore().doc(path).get(); });
    return snap.exists ? snap.data() : null;
  }

  function userDoc(uid, role, status) {
    return {
      firstName: 'Test',
      lastName: uid,
      email: `${uid}@example.com`,
      role,
      status,
      studentType: 'current',
      courses: {},
      certificates: []
    };
  }

  // Seeds the user document and mints a token with matching claims, so the same
  // helpers work before and after the rules move from get() lookups to claims.
  async function asUser(uid, role, status) {
    await seed(`users/${uid}`, userDoc(uid, role, status));
    return env.authenticatedContext(uid, { email: `${uid}@example.com`, role, status }).firestore();
  }

  return {
    anon: () => env.unauthenticatedContext().firestore(),
    signedInNoDoc: uid => env.authenticatedContext(uid, { email: `${uid}@example.com` }).firestore(),
    asSuperadminEmail: uid => env.authenticatedContext(uid, { email: SUPERADMIN_EMAIL }).firestore(),
    asPendingStudent: uid => asUser(uid, 'student', 'pending'),
    asStudent: uid => asUser(uid, 'student', 'approved'),
    asAdmin: uid => asUser(uid, 'admin', 'approved'),
    asSuperadmin: uid => asUser(uid, 'superadmin', 'approved'),
    userDoc,
    seed,
    read,
    clear: () => env.clearFirestore(),
    cleanup: () => env.cleanup()
  };
}

export { assertSucceeds, assertFails };
