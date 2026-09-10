// Page-lifetime cache so tab switches and back navigation do not refetch the lists.
export function createStore() {
  return {
    students: null,
    admins: null,
    tab: 'current',

    upsertStudent(student) {
      if (!this.students) return;
      const index = this.students.findIndex(s => s.id === student.id);
      if (index >= 0) this.students[index] = student;
      else this.students.push(student);
    },

    removeStudent(uid) {
      if (this.students) this.students = this.students.filter(s => s.id !== uid);
    },

    invalidate() {
      this.students = null;
      this.admins = null;
    }
  };
}
