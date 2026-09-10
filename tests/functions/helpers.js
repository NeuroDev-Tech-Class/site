export function fakeAuth(users = {}) {
  const calls = [];
  return {
    calls,
    async getUser(uid) {
      if (!users[uid]) {
        const err = new Error(`no auth user ${uid}`);
        err.code = 'auth/user-not-found';
        throw err;
      }
      return { uid, customClaims: users[uid].customClaims };
    },
    async setCustomUserClaims(uid, claims) {
      calls.push([uid, claims]);
      users[uid].customClaims = claims ?? undefined;
    }
  };
}

export function fakeAdminDb() {
  const adds = [];
  const updates = [];
  return {
    adds,
    updates,
    collection: name => ({ add: async data => { adds.push([name, data]); return { id: `auto-${adds.length}` }; } }),
    doc: path => ({ update: async patch => { updates.push([path, patch]); } })
  };
}

export const fakeFieldValue = { serverTimestamp: () => 'SERVER_TIMESTAMP' };
