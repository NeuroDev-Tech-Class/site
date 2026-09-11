import { deriveTotals, sameDerived } from '../shared/lib/grade.js';
import { toDate } from '../shared/lib/format.js';
import {
  gradedNotification, gradedActivity, receivedNotification, receivedActivity
} from '../shared/lib/notifications.js';
import { adminRecipients, actorFrom, deliver, deliverAll, logActivity } from './notify.js';

// Runs on every submissions/{id} write. The derived write re-triggers once; that run finds
// nothing to change because this function never writes a timestamp, and so notifies nobody either.
export async function handleSubmissionWrite({ db, FieldValue }, id, before, after) {
  if (!after) return { action: 'none' };

  if (after.status === 'submitted') {
    await update(db, id, { status: 'needs_grading' });
    await notifyReceived({ db, FieldValue }, { id, ...after });
    return { action: 'needs_grading' };
  }

  if (after.status === 'graded') {
    const derived = deriveTotals(after);
    if (sameDerived(after, derived)) return { action: 'none' };
    await update(db, id, derived);
    await notifyGraded({ db, FieldValue }, { id, ...after, ...derived });
    return { action: 'derived', derived };
  }

  return { action: 'none' };
}

// Migrated rows land already needing grading, but a rerun must never wake every admin.
async function notifyReceived({ db, FieldValue }, sub) {
  if (sub.legacy === true) return;
  const admins = await adminRecipients(db);
  await deliverAll(db, FieldValue, admins, receivedNotification(sub));
  await logActivity(db, FieldValue, receivedActivity(sub));
}

// The id is keyed on the stored gradedAt, so there is nothing to notify without one.
async function notifyGraded({ db, FieldValue }, sub) {
  if (!sub.studentUid || !toDate(sub.gradedAt)) return;
  const actor = await actorFrom(db, sub.gradedBy);
  await deliver(db, FieldValue, sub.studentUid, gradedNotification(sub, actor));
  await logActivity(db, FieldValue, gradedActivity(sub, actor));
}

// An admin can delete nothing from the client, but a tool might between the trigger and this write.
async function update(db, id, patch) {
  try {
    await db.doc(`submissions/${id}`).update(patch);
  } catch (err) {
    if (err.code !== 5) throw err;
  }
}
