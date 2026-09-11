import { html } from '../../lib/html.js';
import { toDate } from '../../lib/format.js';
import { courseMetadata } from '../../course-metadata.js';
import { scoreLabel } from '../../lib/submissions.js';
import { loadingRow, emptyRow } from '../../ui/table-row.js';

const DAY_MS = 86400000;

function waitingLabel(submittedAt, now) {
  const date = toDate(submittedAt);
  if (!date) return '';
  const days = Math.floor((now - date) / DAY_MS);
  return days <= 0 ? 'today' : days === 1 ? '1 day' : `${days} days`;
}

const shell = filters => html`
  <div class="dashboard-header">
    <h1>Grading Queue</h1>
    <p class="dashboard-subtitle">Oldest submissions first</p>
  </div>
  <div class="queue-controls">
    <label class="queue-filter">Certificate
      <select id="queue-course">
        <option value="">All certificates</option>
        ${Object.entries(courseMetadata).map(([id, meta]) =>
          html`<option value="${id}" ${filters.course === id ? 'selected' : ''}>${meta.name}</option>`)}
      </select>
    </label>
    <label class="queue-filter">Student
      <input id="queue-student" type="search" placeholder="Name or email" value="${filters.student}">
    </label>
    <button class="action-btn approve" id="queue-grade-next">Grade next</button>
  </div>
  <div class="students-table-container">
    <table class="students-table">
      <thead><tr><th>Student</th><th>Certificate</th><th>Item</th><th>Type</th><th>Waiting</th><th>Score</th></tr></thead>
      <tbody id="queue-tbody"></tbody>
    </table>
  </div>
`;

const row = (sub, now) => html`
  <tr data-id="${sub.id}" class="clickable-row" tabindex="0" role="button" aria-label="Grade ${sub.studentName}">
    <td>
      <div class="student-name">
        <strong>${sub.studentName}</strong>
        <span class="student-email">${sub.studentEmail}</span>
      </div>
    </td>
    <td>${sub.courseName}</td>
    <td>${sub.itemTitle}</td>
    <td>${sub.kind === 'checkpoint' ? 'Checkpoint' : 'Test'}</td>
    <td>${waitingLabel(sub.submittedAt, now)}</td>
    <td>${scoreLabel(sub)}</td>
  </tr>
`;

export const queueView = {
  mount(root, route, ctx) {
    const { store } = ctx;
    const filters = { course: route.query.course || '', student: route.query.student || '' };
    let alive = true;

    root.innerHTML = String(shell(filters));
    const tbody = root.querySelector('#queue-tbody');

    const visible = () => (store.queue || []).filter(sub =>
      (!filters.course || sub.courseId === filters.course) &&
      (!filters.student ||
        `${sub.studentName} ${sub.studentEmail}`.toLowerCase().includes(filters.student.toLowerCase())));

    function renderRows() {
      if (!store.queue) {
        tbody.innerHTML = String(loadingRow(6));
        return;
      }
      const list = visible();
      const now = ctx.now();
      tbody.innerHTML = String(list.length
        ? html`${list.map(sub => row(sub, now))}`
        : emptyRow(6, 'Nothing waiting for grading.'));
    }

    function syncHash() {
      const params = new URLSearchParams();
      if (filters.course) params.set('course', filters.course);
      if (filters.student) params.set('student', filters.student);
      const search = params.toString();
      window.history.replaceState(null, '', `#/queue${search ? `?${search}` : ''}`);
    }

    function onFilter(event) {
      if (event.target.id === 'queue-course') filters.course = event.target.value;
      else if (event.target.id === 'queue-student') filters.student = event.target.value;
      else return;
      syncHash();
      renderRows();
    }

    const openRow = id => ctx.navigate(`#/grade/${id}`);

    function onClick(event) {
      if (event.target.closest('#queue-grade-next')) {
        const [oldest] = visible();
        if (oldest) openRow(oldest.id);
        return;
      }
      const tr = event.target.closest('tr[data-id]');
      if (tr) openRow(tr.dataset.id);
    }

    function onKeydown(event) {
      const tr = event.target.closest('tr[data-id]');
      if (!tr || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      openRow(tr.dataset.id);
    }

    root.addEventListener('input', onFilter);
    root.addEventListener('change', onFilter);
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKeydown);
    const unsubscribe = store.subscribe(() => { if (alive) renderRows(); });
    renderRows();

    return {
      ready: Promise.resolve(),
      dispose() {
        alive = false;
        unsubscribe();
        root.removeEventListener('input', onFilter);
        root.removeEventListener('change', onFilter);
        root.removeEventListener('click', onClick);
        root.removeEventListener('keydown', onKeydown);
      }
    };
  }
};
