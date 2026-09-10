// All Firestore access for the users collection. `fs` is the firebase-config module
// (or the fake in tests): { db, doc, collection, query, where, getDoc, getDocs, ... }.
export function usersRepo(fs) {
  const { db, doc, collection, query, where, getDoc, getDocs, updateDoc, deleteDoc, serverTimestamp } = fs;
  const ref = uid => doc(db, 'users', uid);

  return {
    async getUser(uid) {
      const snap = await getDoc(ref(uid));
      return snap.exists() ? { id: uid, ...snap.data() } : null;
    },

    async listByRole(role) {
      const snap = await getDocs(query(collection(db, 'users'), where('role', '==', role)));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    approve: uid => updateDoc(ref(uid), { status: 'approved', approvedAt: serverTimestamp() }),

    remove: uid => deleteDoc(ref(uid)),

    setStudentType: (uid, studentType) => updateDoc(ref(uid), { studentType }),

    setRole: (uid, role, extra = {}) => updateDoc(ref(uid), { role, ...extra }),

    addCertificate: (uid, existing, cert) => updateDoc(ref(uid), { certificates: [...existing, cert] })
  };
}
