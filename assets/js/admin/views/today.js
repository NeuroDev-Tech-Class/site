import { html } from '../../lib/html.js';
import { fullName, toDate } from '../../lib/format.js';
import { statCard, emptyState } from '../icons.js';

const ATTENTION_LIMIT = 5;

const shell = () => html`
  <div class="dashboard-header">
    <h1>Today</h1>
    <p class="dashboard-subtitle">What needs you across the class</p>
  </div>
  <div class="stats-grid">
    ${statCard('pending-icon-stat', 'queue', 'today-awaiting', 'Awaiting Grading')}
    ${statCard('students-icon', 'clock', 'today-pending', 'Pending Approval')}
    ${statCard('cert-icon', 'certificate', 'today-certs', 'Certificates This Month')}
  </div>
  <section class="dashboard-section">
    <h2>Needs your attention</h2>
    <div id="attention-list"></div>
  </section>
`;

const pendingItem = s => html`
  <div class="attention-item" data-id="${s.id}">
    <div class="attention-info">
      <strong>${fullName(s)}</strong>
      <span class="attention-detail">${s.email} · waiting for approval</span>
    </div>
    <button class="action-btn approve" data-action="approve" data-id="${s.id}">Approve</button>
  </div>
`;

const queueItem = sub => html`
  <div class="attention-item" data-id="${sub.id}">
    <div class="attention-info">
      <strong>${sub.studentName}</strong>
      <span class="attention-detail">${sub.itemTitle} · ${sub.courseName}</span>
    </div>
    <button class="action-btn" data-action="grade" data-id="${sub.id}">Grade</button>
  </div>
`;

function certsThisMonth(students, now) {
  let count = 0;
  for (const student of students) {
    for (const cert of student.certificates || []) {
      const awarded = toDate(cert.awardedAt);
      if (awarded && awarded.getFullYear() === now.getFullYear() && awarded.getMonth() === now.getMonth()) count++;
    }
  }
  return count;
}

export const todayView = {
  mount(root, route, ctx) {
    const { store, users } = ctx;
    let alive = true;

    root.innerHTML = String(shell());
    const el = id => root.querySelector(`#${id}`);

    function refresh() {
      const pending = store.students?.filter(s => s.status === 'pending');
      el('today-awaiting').textContent = store.queue ? store.queue.length : '—';
      el('today-pending').textContent = pending ? pending.length : '—';
      el('today-certs').textContent = store.students ? certsThisMonth(store.students, ctx.now()) : '—';
      const items = [
        ...(pending || []).map(pendingItem),
        ...(store.queue || []).slice(0, ATTENTION_LIMIT).map(queueItem)
      ];
      el('attention-list').innerHTML = String(items.length
        ? html`${items}`
        : emptyState('check', 'Nothing needs you right now.'));
    }

    const actions = {
      async approve(id) {
        const student = store.students?.find(s => s.id === id);
        if (!student || !ctx.confirm(`Approve ${fullName(student)}?`)) return;
        try {
          await users.approve(id);
          student.status = 'approved';
          store.upsertStudent(student);
        } catch (error) {
          console.error(error);
          ctx.alert('Failed to approve student. Please try again.');
        }
      },
      grade(id) {
        ctx.navigate(`#/grade/${id}`);
      }
    };

    function onClick(event) {
      const button = event.target.closest('[data-action]');
      if (button) actions[button.dataset.action]?.(button.dataset.id);
    }

    root.addEventListener('click', onClick);
    const unsubscribe = store.subscribe(() => { if (alive) refresh(); });
    refresh();

    const ready = (async () => {
      if (!store.students) {
        try {
          store.students = await users.listByRole('student');
        } catch (error) {
          console.error('Error loading students:', error);
          return;
        }
      }
      if (alive) refresh();
    })();

    return {
      ready,
      dispose() {
        alive = false;
        unsubscribe();
        root.removeEventListener('click', onClick);
      }
    };
  }
};
