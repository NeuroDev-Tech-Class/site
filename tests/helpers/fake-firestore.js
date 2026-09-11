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

const sortValue = value => {
  if (value instanceof Date) return value.getTime();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  return value;
};

const compare = (a, b) => {
  const x = sortValue(a);
  const y = sortValue(b);
  return x < y ? -1 : x > y ? 1 : 0;
};

const parentOf = path => path.slice(0, path.lastIndexOf('/'));

export function createFakeFirestore({ now = new Date('2026-09-08T12:00:00Z'), seed = {} } = {}) {
  const store = new Map(Object.entries(seed).map(([path, data]) => [path, clone(data)]));
  const writes = [];
  const listeners = new Set();
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
  const orderBy = (field, direction = 'asc') => ({ type: 'orderBy', field, direction });
  const limit = n => ({ type: 'limit', n });
  const query = (col, ...constraints) => ({ type: 'query', path: col.path, constraints: [...(col.constraints || []), ...constraints] });
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

  // Firestore drops documents that lack an orderBy field; the fake does the same.
  function runQuery(q) {
    const constraints = q.constraints || [];
    const unknown = constraints.find(c => !['where', 'orderBy', 'limit'].includes(c.type));
    if (unknown) throw new Error(`fake firestore: unsupported constraint ${unknown.type}`);
    const wheres = constraints.filter(c => c.type === 'where');
    const orders = constraints.filter(c => c.type === 'orderBy');
    const cap = constraints.find(c => c.type === 'limit');
    let rows = [];
    for (const [path, data] of store) {
      if (parentOf(path) !== q.path) continue;
      if (!wheres.every(c => matches(data, c))) continue;
      if (orders.some(o => getPath(data, o.field) === undefined)) continue;
      rows.push({ path, data });
    }
    for (const o of [...orders].reverse()) {
      const sign = o.direction === 'desc' ? -1 : 1;
      rows.sort((a, b) => sign * compare(getPath(a.data, o.field), getPath(b.data, o.field)));
    }
    if (cap) rows = rows.slice(0, cap.n);
    const docs = rows.map(({ path }) => snapshotOf({ path, id: path.split('/').at(-1) }));
    return { docs, size: docs.length, empty: docs.length === 0, forEach: fn => docs.forEach(fn) };
  }

  function schedule(entry) {
    if (entry.pending) return;
    entry.pending = true;
    queueMicrotask(() => {
      entry.pending = false;
      if (listeners.has(entry)) entry.onNext(entry.isDoc ? snapshotOf(entry.target) : runQuery(entry.target));
    });
  }

  function notify(path) {
    const parent = parentOf(path);
    for (const entry of listeners) {
      if (entry.isDoc ? entry.target.path === path : entry.target.path === parent) schedule(entry);
    }
  }

  // Takes a query or a single doc ref, like the real onSnapshot.
  function onSnapshot(target, onNext) {
    const entry = { target, onNext, isDoc: target.type === 'doc', pending: false };
    listeners.add(entry);
    schedule(entry);
    return () => listeners.delete(entry);
  }

  async function getDoc(ref) {
    return snapshotOf(ref);
  }

  async function getDocs(q) {
    return runQuery(q);
  }

  async function setDoc(ref, data, options = {}) {
    const resolved = resolveSentinels(data, now);
    const existing = store.get(ref.path);
    store.set(ref.path, options.merge && existing ? deepMerge(existing, resolved) : clone(resolved));
    writes.push({ type: 'set', path: ref.path, data: resolved, options });
    notify(ref.path);
  }

  async function updateDoc(ref, patch) {
    if (!store.has(ref.path)) throw new Error(`fake firestore: no document at ${ref.path}`);
    const target = clone(store.get(ref.path));
    const resolved = resolveSentinels(patch, now);
    for (const [fieldPath, value] of Object.entries(resolved)) setPath(target, fieldPath, value);
    store.set(ref.path, target);
    writes.push({ type: 'update', path: ref.path, data: resolved });
    notify(ref.path);
  }

  async function deleteDoc(ref) {
    store.delete(ref.path);
    writes.push({ type: 'delete', path: ref.path });
    notify(ref.path);
  }

  async function addDoc(col, data) {
    const ref = doc(db, ...col.path.split('/'), `auto-${++autoId}`);
    await setDoc(ref, data);
    writes.at(-1).type = 'add';
    return ref;
  }

  return {
    db, doc, collection, query, where, orderBy, limit, onSnapshot,
    getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, serverTimestamp,
    writes,
    now,
    get: path => (store.has(path) ? clone(store.get(path)) : undefined),
    has: path => store.has(path),
    listenerCount: () => listeners.size
  };
}
