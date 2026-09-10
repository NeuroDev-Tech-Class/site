import { deriveTotals, sameDerived } from '../shared/lib/grade.js';

// Runs on every submissions/{id} write. The derived write re-triggers once; that run finds
// nothing to change because this function never writes a timestamp.
export async function handleSubmissionWrite({ db }, id, before, after) {
  if (!after) return { action: 'none' };

  if (after.status === 'submitted') {
    await update(db, id, { status: 'needs_grading' });
    return { action: 'needs_grading' };
  }

  if (after.status === 'graded') {
    const derived = deriveTotals(after);
    if (sameDerived(after, derived)) return { action: 'none' };
    await update(db, id, derived);
    return { action: 'derived', derived };
  }

  return { action: 'none' };
}

// An admin can delete nothing from the client, but a tool might between the trigger and this write.
async function update(db, id, patch) {
  try {
    await db.doc(`submissions/${id}`).update(patch);
  } catch (err) {
    if (err.code !== 5) throw err;
  }
}
