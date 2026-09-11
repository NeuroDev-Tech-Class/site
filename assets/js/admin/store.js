// Page-lifetime cache so tab switches and back navigation do not refetch the lists.
// Emits a change signal on every update; the nav and live views re-render from it.
class Store {
  students = null;
  admins = null;
  tab = 'current';
  queue = null;
  queueError = null;
  #unsubscribeQueue = null;
  #listeners = new Set();

  emit() {
    for (const fn of [...this.#listeners]) fn();
  }

  subscribe(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  subscribeQueue(repo) {
    if (this.#unsubscribeQueue) return;
    this.#unsubscribeQueue = repo.subscribeQueue(
      list => { this.queue = list; this.queueError = null; this.emit(); },
      error => {
        console.error('Queue listener error:', error);
        this.queue = null;
        this.queueError = error;
        this.emit();
      }
    );
  }

  disposeQueue() {
    this.#unsubscribeQueue?.();
    this.#unsubscribeQueue = null;
  }

  upsertStudent(student) {
    if (!this.students) return;
    const index = this.students.findIndex(s => s.id === student.id);
    if (index >= 0) this.students[index] = student;
    else this.students.push(student);
    this.emit();
  }

  removeStudent(uid) {
    if (!this.students) return;
    this.students = this.students.filter(s => s.id !== uid);
    this.emit();
  }

  invalidate() {
    this.students = null;
    this.admins = null;
    this.emit();
  }
}

export const createStore = () => new Store();
