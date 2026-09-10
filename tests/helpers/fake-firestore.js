// In-memory stand-in for the modular Firestore functions the data modules use.
// Same call shapes as firebase/firestore; writes are logged for assertions.
const SERVER_TIMESTAMP = Symbol('serverTimestamp');

const clone = value => structuredClone(value);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
}

function resolveSentinels(value, now) {
  if (value === SERVER_TIMESTAMP) return new Date(now);
  if (Array.isArray(value)) return value.map(v => resolveSentinels(v, now));
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveSentinels(v, now)]));
  }
  return value;
}

function deepMerge(base, patch) {
  const out = clone(base);
  for (const [k, v] of Object.entries(patch)) {
    out[k] = isPlainObject(v) && isPlainObject(out[k]) ? deepMerge(out[k], v) : clone(v);
  }
  return out;
}

function getPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc === undefined || acc === null ? undefined : acc[key]), obj);
}

function setPath(obj, path, value) {
  const keys = path.split('.');
  let cursor = obj;
  keys.slice(0, -1).forEach(key => {
    if (!isPlainObject(cursor[key])) cursor[key] = {};
    cursor = cursor[key];
  });
  cursor[keys.at(-1)] = value;
}

export function createFakeFirestore({ now = new Date('2026-09-08T12:00:00Z'), seed = {} } = {}) {
  const store = new Map(Object.entries(seed).map(([path, data]) => [path, clone(data)]));
  const writes = [];
  let autoId = 0;

  const db = { fake: true };
  const segmentsOf = parent => (parent === db ? [] : parent.path.split('/'));

  const doc = (parent, ...segments) => {
    const path = [...segmentsOf(parent), ...segments].join('/');
    return { type: 'doc', path, id: path.split('/').at(-1) };
  };
  const collection = (parent, ...segments) => ({
    type: 'collection',
    path: [...segmentsOf(parent), ...segments].join('/')
  });
  const where = (field, op, value) => ({ type: 'where', field, op, value });
  const query = (col, ...constraints) => ({ type: 'query', path: col.path, constraints });
  const serverTimestamp = () => SERVER_TIMESTAMP;

  const snapshotOf = ref => {
    const data = store.get(ref.path);
    return {
      id: ref.id,
      ref,
      exists: () => data !== undefined,
      data: () => (data === undefined ? undefined : clone(data))
    };
  };

  const matches = (data, c) => {
    const actual = getPath(data, c.field);
    if (c.op === '==') return actual === c.value;
    if (c.op === '!=') return actual !== c.value;
    if (c.op === 'in') return c.value.includes(actual);
    throw new Error(`fake firestore: unsupported operator ${c.op}`);
  };

  async function getDoc(ref) {
    return snapshotOf(ref);
  }

  async function getDocs(q) {
    const constraints = q.constraints || [];
    const docs = [];
    for (const [path, data] of store) {
      if (path.slice(0, path.lastIndexOf('/')) !== q.path) continue;
      if (constraints.every(c => matches(data, c))) docs.push(snapshotOf({ path, id: path.split('/').at(-1) }));
    }
    return { docs, size: docs.length, empty: docs.length === 0, forEach: fn => docs.forEach(fn) };
  }

  async function setDoc(ref, data, options = {}) {
    const resolved = resolveSentinels(data, now);
    const existing = store.get(ref.path);
    store.set(ref.path, options.merge && existing ? deepMerge(existing, resolved) : clone(resolved));
    writes.push({ type: 'set', path: ref.path, data: resolved, options });
  }

  async function updateDoc(ref, patch) {
    if (!store.has(ref.path)) throw new Error(`fake firestore: no document at ${ref.path}`);
    const target = clone(store.get(ref.path));
    const resolved = resolveSentinels(patch, now);
    for (const [fieldPath, value] of Object.entries(resolved)) setPath(target, fieldPath, value);
    store.set(ref.path, target);
    writes.push({ type: 'update', path: ref.path, data: resolved });
  }

  async function deleteDoc(ref) {
    store.delete(ref.path);
    writes.push({ type: 'delete', path: ref.path });
  }

  async function addDoc(col, data) {
    const ref = doc(db, ...col.path.split('/'), `auto-${++autoId}`);
    await setDoc(ref, data);
    writes.at(-1).type = 'add';
    return ref;
  }

  return {
    db, doc, collection, query, where, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, serverTimestamp,
    writes,
    now,
    get: path => (store.has(path) ? clone(store.get(path)) : undefined),
    has: path => store.has(path)
  };
}
