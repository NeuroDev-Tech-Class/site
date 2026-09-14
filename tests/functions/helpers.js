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

const clone = value => structuredClone(value);

const isPlainObject = value =>
  value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);

const isIncrement = value => isPlainObject(value) && typeof value.__increment === 'number';

function deepMerge(base, patch) {
  const out = clone(base);
  for (const [k, v] of Object.entries(patch)) {
    out[k] = isPlainObject(v) && isPlainObject(out[k]) ? deepMerge(out[k], v) : clone(v);
  }
  return out;
}

// Firestore counts a missing field as zero when it increments.
function resolveIncrements(patch, existing) {
  return Object.fromEntries(Object.entries(patch).map(([k, v]) =>
    [k, isIncrement(v) ? Number(existing?.[k] ?? 0) + v.__increment : clone(v)]));
}

function matches(data, { field, op, value }) {
  const actual = data?.[field];
  if (op === '==') return actual === value;
  if (op === 'in') return value.includes(actual);
  throw new Error(`fake admin db: unsupported operator ${op}`);
}

const parentOf = path => path.slice(0, path.lastIndexOf('/'));

// Records every write for assertions and keeps the documents, so handlers can read what they wrote.
// update() on a missing path creates it rather than raising 5; handlers that care stub doc() themselves.
export function fakeAdminDb(seed = {}) {
  const store = new Map(Object.entries(seed).map(([path, data]) => [path, clone(data)]));
  const adds = [];
  const updates = [];
  const sets = [];
  const creates = [];

  const snapshotOf = path => {
    const data = store.get(path);
    return {
      id: path.split('/').at(-1),
      exists: data !== undefined,
      data: () => (data === undefined ? undefined : clone(data))
    };
  };

  function write(path, patch, merge) {
    const existing = store.get(path);
    const resolved = resolveIncrements(patch, existing);
    store.set(path, merge && existing ? deepMerge(existing, resolved) : clone(resolved));
  }

  function runQuery(path, wheres) {
    const docs = [...store.keys()]
      .filter(key => parentOf(key) === path && wheres.every(c => matches(store.get(key), c)))
      .map(snapshotOf);
    return { docs, size: docs.length, empty: docs.length === 0, forEach: fn => docs.forEach(fn) };
  }

  const queryApi = (path, wheres) => ({
    where: (field, op, value) => queryApi(path, [...wheres, { field, op, value }]),
    get: async () => runQuery(path, wheres)
  });

  return {
    adds,
    updates,
    sets,
    creates,
    get: path => (store.has(path) ? clone(store.get(path)) : undefined),
    has: path => store.has(path),

    doc: path => ({
      get: async () => snapshotOf(path),
      update: async patch => { updates.push([path, patch]); write(path, patch, true); },
      set: async (data, options = {}) => { sets.push([path, data, options]); write(path, data, !!options.merge); },
      create: async data => {
        if (store.has(path)) throw Object.assign(new Error(`6 ALREADY_EXISTS: ${path}`), { code: 6 });
        creates.push([path, data]);
        write(path, data, false);
      }
    }),

    collection: path => ({
      add: async data => {
        adds.push([path, data]);
        const id = `auto-${adds.length}`;
        write(`${path}/${id}`, data, false);
        return { id };
      },
      where: (field, op, value) => queryApi(path, [{ field, op, value }]),
      get: async () => runQuery(path, [])
    })
  };
}

export const fakeFieldValue = {
  serverTimestamp: () => 'SERVER_TIMESTAMP',
  increment: n => ({ __increment: n })
};
