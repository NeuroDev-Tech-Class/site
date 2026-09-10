import { syncClaims } from './claims.js';
import { approvalMailDoc } from '../shared/data/mail.js';

// Runs on every users/{uid} write. Writing claimsUpdatedAt re-triggers once; that run changes nothing.
export async function handleUserWrite({ auth, db, FieldValue, siteUrl }, uid, before, after) {
  const claims = await syncClaims(auth, uid, after);
  if (!after) return { claims, mailed: false };

  const approvedNow = before?.status === 'pending' && after.status === 'approved';
  let mailed = false;
  if (approvedNow && after.email) {
    await db.collection('mail').add(approvalMailDoc(after, siteUrl));
    mailed = true;
  }

  if (claims.changed) await stampClaimsUpdated(db, uid, FieldValue);
  return { claims, mailed };
}

// The document can be deleted between the claims write and this stamp; the delete event cleans up.
async function stampClaimsUpdated(db, uid, FieldValue) {
  try {
    await db.doc(`users/${uid}`).update({ claimsUpdatedAt: FieldValue.serverTimestamp() });
  } catch (err) {
    if (err.code !== 5) throw err;
  }
}
