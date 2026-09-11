// Keeps users/{uid}/meta/counters.unread in step with the inbox. The counter lives on a different
// path from the notifications, so this write never re-triggers this handler.
const unreadWeight = doc => (doc?.read === false ? 1 : 0);

export async function handleInboxWrite({ db, FieldValue }, uid, before, after) {
  const delta = unreadWeight(after) - unreadWeight(before);
  if (delta === 0) return { delta: 0 };

  await db.doc(`users/${uid}/meta/counters`).set({ unread: FieldValue.increment(delta) }, { merge: true });
  return { delta };
}
