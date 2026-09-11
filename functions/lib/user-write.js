import { syncClaims } from './claims.js';
import { approvalMailDoc } from '../shared/data/mail.js';
import {
  approvedNotification, approvedActivity,
  certificateNotification, certificateActivity,
  registrationNotification, registrationActivity
} from '../shared/lib/notifications.js';
import { adminRecipients, actorFrom, deliver, deliverAll, logActivity } from './notify.js';

// Runs on every users/{uid} write. Writing claimsUpdatedAt re-triggers once; that run changes
// nothing, because none of the transitions below fire twice for the same pair of documents.
export async function handleUserWrite({ auth, db, FieldValue, siteUrl }, uid, before, after) {
  const claims = await syncClaims(auth, uid, after);
  if (!after) return { claims, mailed: false };

  const approvedNow = before?.status === 'pending' && after.status === 'approved';
  let mailed = false;
  if (approvedNow && after.email) {
    await db.collection('mail').add(approvalMailDoc(after, siteUrl));
    mailed = true;
  }

  if (!before && after.status === 'pending') await notifyRegistration({ db, FieldValue }, uid, after);
  if (approvedNow) await notifyApproved({ db, FieldValue }, uid, after);
  for (const cert of newCertificates(before, after)) {
    await notifyCertificate({ db, FieldValue }, uid, after, cert);
  }

  if (claims.changed) await stampClaimsUpdated(db, uid, FieldValue);
  return { claims, mailed };
}

const certificatesOf = doc => (Array.isArray(doc?.certificates) ? doc.certificates : []);

function newCertificates(before, after) {
  const had = new Set(certificatesOf(before).map(c => c.courseId));
  return certificatesOf(after).filter(c => c.courseId && !had.has(c.courseId));
}

async function notifyRegistration({ db, FieldValue }, uid, user) {
  const admins = await adminRecipients(db);
  await deliverAll(db, FieldValue, admins, registrationNotification(uid, user));
  await logActivity(db, FieldValue, registrationActivity(uid, user));
}

async function notifyApproved({ db, FieldValue }, uid, user) {
  const actor = await actorFrom(db, user.approvedBy);
  await deliver(db, FieldValue, uid, approvedNotification(uid, actor));
  await logActivity(db, FieldValue, approvedActivity(uid, user, actor));
}

async function notifyCertificate({ db, FieldValue }, uid, user, cert) {
  const actor = await actorFrom(db, cert.awardedBy);
  await deliver(db, FieldValue, uid, certificateNotification(cert, actor));
  await logActivity(db, FieldValue, certificateActivity(uid, user, cert, actor));
}

// The document can be deleted between the claims write and this stamp; the delete event cleans up.
async function stampClaimsUpdated(db, uid, FieldValue) {
  try {
    await db.doc(`users/${uid}`).update({ claimsUpdatedAt: FieldValue.serverTimestamp() });
  } catch (err) {
    if (err.code !== 5) throw err;
  }
}
