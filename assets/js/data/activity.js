// All Firestore access for the append-only audit feed. Admin read only; every row is written
// by a Cloud Function, so there is no write path here.
export function activityRepo(fs) {
  const { db, collection, query, orderBy, limit, onSnapshot } = fs;
  const withId = d => ({ id: d.id, ...d.data() });

  return {
    subscribeFeed(onChange, onError, { limit: max = 100 } = {}) {
      const q = query(collection(db, 'activity'), orderBy('createdAt', 'desc'), limit(max));
      return onSnapshot(q, snap => onChange(snap.docs.map(withId)), onError);
    }
  };
}
