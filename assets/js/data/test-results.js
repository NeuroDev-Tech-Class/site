// Legacy Google Forms scores, one document per student email with flat "courseId_unitKey" keys.
export function testResultsRepo(fs) {
  const { db, doc, getDoc, setDoc } = fs;
  const ref = email => doc(db, 'testResults', email);

  return {
    async getForEmail(email) {
      if (!email) return {};
      const snap = await getDoc(ref(email));
      return snap.exists() ? snap.data() : {};
    },

    saveScore: (email, key, result) => setDoc(ref(email), { [key]: result }, { merge: true })
  };
}
