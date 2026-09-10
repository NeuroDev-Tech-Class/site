import { UNGRADED_STATUSES } from '../lib/submissions.js';

// All Firestore access for the submissions collection. Students may only list with their own
// uid filter (rules); admins may run the queue query. Derived score fields are function-owned.
export function submissionsRepo(fs) {
  const { db, doc, collection, query, where, orderBy, limit, getDoc, getDocs, updateDoc, onSnapshot, serverTimestamp } = fs;
  const ref = id => doc(db, 'submissions', id);
  const withId = d => ({ id: d.id, ...d.data() });

  return {
    subscribeQueue(onChange, onError, { limit: max = 200 } = {}) {
      const q = query(collection(db, 'submissions'),
        where('status', 'in', UNGRADED_STATUSES), orderBy('submittedAt', 'asc'), limit(max));
      return onSnapshot(q, snap => onChange(snap.docs.map(withId)), onError);
    },

    async listForStudent(uid, max = 50) {
      const q = query(collection(db, 'submissions'),
        where('studentUid', '==', uid), orderBy('submittedAt', 'desc'), limit(max));
      const snap = await getDocs(q);
      return snap.docs.map(withId);
    },

    async get(id) {
      const snap = await getDoc(ref(id));
      return snap.exists() ? withId(snap) : null;
    },

    grade: (id, { manualScore, totalMax = null, feedback = '' }, gradedBy) => updateDoc(ref(id), {
      manualScore,
      totalMax,
      feedback,
      status: 'graded',
      gradedBy,
      gradedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  };
}
