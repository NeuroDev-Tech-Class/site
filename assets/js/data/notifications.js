// All Firestore access for a user's inbox and counters. Both are written by the Cloud Functions;
// the only write a client is allowed is flipping `read` on its own row (rules).
export function notificationsRepo(fs) {
  const { db, doc, collection, query, orderBy, limit, onSnapshot, updateDoc } = fs;
  const inbox = uid => collection(db, 'users', uid, 'inbox');
  const notifRef = (uid, id) => doc(db, 'users', uid, 'inbox', id);
  const countersRef = uid => doc(db, 'users', uid, 'meta', 'counters');
  const withId = d => ({ id: d.id, ...d.data() });

  return {
    subscribeInbox(uid, onChange, onError, { limit: max = 20 } = {}) {
      const q = query(inbox(uid), orderBy('createdAt', 'desc'), limit(max));
      return onSnapshot(q, snap => onChange(snap.docs.map(withId)), onError);
    },

    // A missing counters document, or a count that drifted below zero, both read as none.
    subscribeUnreadCount(uid, onChange, onError) {
      return onSnapshot(countersRef(uid), snap => onChange(Math.max(0, snap.data()?.unread || 0)), onError);
    },

    markRead: (uid, id) => updateDoc(notifRef(uid, id), { read: true }),

    markAllRead: (uid, ids) => Promise.all(ids.map(id => updateDoc(notifRef(uid, id), { read: true })))
  };
}
