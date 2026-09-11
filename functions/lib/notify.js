import { fullName } from '../shared/lib/format.js';

const ADMIN_ROLES = ['admin', 'superadmin'];

// Every fan-out write is a create() under a deterministic id, so a retried invocation of the
// trigger rebuilds the same id and lands here as ALREADY_EXISTS instead of a duplicate.
async function createOnce(ref, data) {
  try {
    await ref.create(data);
    return true;
  } catch (err) {
    if (err.code === 6) return false;
    throw err;
  }
}

export async function adminRecipients(db) {
  const snap = await db.collection('users').where('role', 'in', ADMIN_ROLES).get();
  return snap.docs.map(d => ({ uid: d.id, name: fullName(d.data()) }));
}

// The name is for display only; an unknown or deleted actor reads as a neutral one.
export async function actorFrom(db, uid) {
  if (!uid) return { uid: '', name: '' };
  const snap = await db.doc(`users/${uid}`).get();
  return { uid, name: snap.exists ? fullName(snap.data()) : '' };
}

export async function deliver(db, FieldValue, uid, notification) {
  if (!notification) return false;
  const { id, ...payload } = notification;
  return createOnce(db.doc(`users/${uid}/inbox/${id}`), {
    ...payload,
    read: false,
    createdAt: FieldValue.serverTimestamp()
  });
}

export async function deliverAll(db, FieldValue, recipients, notification) {
  let delivered = 0;
  for (const { uid } of recipients) {
    if (await deliver(db, FieldValue, uid, notification)) delivered++;
  }
  return delivered;
}

export async function logActivity(db, FieldValue, entry) {
  if (!entry) return false;
  const { id, ...payload } = entry;
  return createOnce(db.doc(`activity/${id}`), { ...payload, createdAt: FieldValue.serverTimestamp() });
}
