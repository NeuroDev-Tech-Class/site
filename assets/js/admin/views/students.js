import { html } from '../../lib/html.js';
import { fullName, formatDate } from '../../lib/format.js';
import { loadingRow, emptyRow } from '../../ui/table-row.js';
import { statCard } from '../icons.js';
import { calculateOverallProgress, dashboardStats } from '../progress.js';

const STUDENT_TABS = ['pending', 'current', 'old'];
const TAB_LABELS = { pending: 'Pending Approval', current: 'Current Students', old: 'Old Students', admins: 'Admins' };

const isCurrent = s => s.status === 'approved' && s.studentType === 'current';
const isOld = s => s.status === 'approved' && s.studentType === 'old';
const certCount = s => (s.certificates || []).length;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const nameCell = s => html`
  <td>
    <div class="student-name">
      <strong>${fullName(s)}</strong>
      <span class="student-email">${s.email}</span>
    </div>
  </td>
`;

const pendingRow = s => html`
  <tr data-id="${s.id}">
    ${nameCell(s)}
    <td>${formatDate(s.createdAt, { fallback: 'N/A' })}</td>
    <td>
      <div class="action-buttons">
        <button class="action-btn approve" data-action="approve" data-id="${s.id}">Approve</button>
        <button class="action-btn deny" data-action="deny" data-id="${s.id}">Deny</button>
      </div>
    </td>
  </tr>
`;

const clickableRow = (s, cells) => html`
  <tr data-id="${s.id}" class="clickable-row" tabindex="0" role="button" aria-label="View ${fullName(s)}">
    ${nameCell(s)}
    ${cells}
  </tr>
`;

function currentRow(s) {
  const progress = calculateOverallProgress(s);
  return clickableRow(s, html`
    <td>
      <div class="progress-bar-container">
        <div class="progress-bar ${progress >= 100 ? 'complete' : ''}" style="width: ${Math.min(progress, 100)}%"></div>
      </div>
      <span style="font-size: 0.8rem; color: #666;">${progress}% overall</span>
    </td>
    <td>${plural(certCount(s), 'certificate')}</td>
    <td>
      <div class="action-buttons">
        <button class="action-btn toggle" data-action="toggle-type" data-type="old" data-id="${s.id}">Move to Old</button>
      </div>
    </td>
  `);
}

const oldRow = s => clickableRow(s, html`
  <td>${plural(certCount(s), 'certificate')}</td>
  <td>
    <div class="action-buttons">
      <button class="action-btn toggle" data-action="toggle-type" data-type="current" data-id="${s.id}">Move to Current</button>
      <button class="action-btn delete" data-action="delete" data-id="${s.id}">Delete</button>
    </div>
  </td>
`);

const adminRow = a => html`
  <tr data-id="${a.id}">
    <td><div class="student-name"><strong>${fullName(a)}</strong></div></td>
    <td><span class="student-email">${a.email}</span></td>
    <td>${formatDate(a.createdAt, { fallback: 'N/A' })}</td>
    <td><button class="action-btn deny" data-action="remove-admin" data-id="${a.id}">Remove Admin</button></td>
  </tr>
`;

const addAdminItem = s => html`
  <div class="add-admin-item">
    <div class="student-name">
      <strong>${fullName(s)}</strong>
      <span class="student-email">${s.email}</span>
    </div>
    <button class="action-btn approve" data-action="promote" data-id="${s.id}">Make Admin</button>
  </div>
`;

const table = (tab, headers, active) => html`
  <div id="${tab}-tab" class="tab-content ${active ? 'active' : ''}">
    <div class="students-table-container">
      <table class="students-table">
        <thead><tr>${headers.map(h => html`<th>${h}</th>`)}</tr></thead>
        <tbody id="${tab}-tbody">${loadingRow(headers.length)}</tbody>
      </table>
    </div>
  </div>
`;

const adminsPanel = active => html`
  <div id="admins-tab" class="tab-content ${active ? 'active' : ''}">
    <div class="tab-section-header">
      <h3 class="tab-section-title">Active Admins</h3>
      <button class="action-btn approve" data-action="open-add-admin">+ Add Admin</button>
    </div>
    <div class="students-table-container">
      <table class="students-table">
        <thead><tr><th>Name</th><th>Email</th><th>Date Added</th><th>Actions</th></tr></thead>
        <tbody id="admins-tbody">${loadingRow(4)}</tbody>
      </table>
    </div>
  </div>
  <div id="add-admin-modal" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h2>Promote to Admin</h2>
          <span class="student-email">Select a current student to grant admin access</span>
        </div>
        <button class="modal-close" data-action="close-add-admin" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body" id="add-admin-list"></div>
    </div>
  </div>
`;

const shell = ({ me, superadmin, tabs, tab }) => html`
  <div id="dashboard-view">
    <div class="dashboard-header">
      <h1>Admin Dashboard</h1>
      <p class="dashboard-subtitle" id="welcome-message">${superadmin ? `Super Admin — ${fullName(me)}` : 'Manage your students'}</p>
    </div>
    <div class="stats-grid" id="stats-grid">
      ${statCard('students-icon', 'students', 'total-students', 'Current Students')}
      ${statCard('pending-icon-stat', 'clock', 'pending-count', 'Pending Approval')}
      ${statCard('completed-icon', 'courses', 'courses-progress', 'Active Courses')}
      ${statCard('cert-icon', 'certificate', 'certs-awarded', 'Certificates Awarded')}
    </div>
    <div class="admin-tabs">
      ${tabs.map(t => html`<button class="admin-tab ${t === tab ? 'active' : ''}" data-tab="${t}">${TAB_LABELS[t]}</button>`)}
    </div>
    ${table('pending', ['Name', 'Registered', 'Actions'], tab === 'pending')}
    ${table('current', ['Name', 'Progress', 'Certificates', 'Actions'], tab === 'current')}
    ${table('old', ['Name', 'Certificates', 'Actions'], tab === 'old')}
    ${superadmin ? adminsPanel(tab === 'admins') : ''}
  </div>
`;

export const studentsView = {
  mount(root, route, ctx) {
    const { store, users, me } = ctx;
    const superadmin = me.role === 'superadmin';
    const tabs = superadmin ? [...STUDENT_TABS, 'admins'] : STUDENT_TABS;
    const requested = route.query.tab || store.tab;
    store.tab = tabs.includes(requested) ? requested : 'current';
    let alive = true;

    root.innerHTML = String(shell({ me, superadmin, tabs, tab: store.tab }));
    const el = id => root.querySelector(`#${id}`);
    const findStudent = id => store.students.find(s => s.id === id);

    function renderList(tbodyId, list, rowFor, colspan, emptyMessage) {
      el(tbodyId).innerHTML = String(list.length ? html`${list.map(rowFor)}` : emptyRow(colspan, emptyMessage));
    }

    function refresh() {
      const stats = dashboardStats(store.students);
      el('total-students').textContent = stats.current;
      el('pending-count').textContent = stats.pending;
      el('courses-progress').textContent = stats.activeCourses;
      el('certs-awarded').textContent = stats.certificates;
      renderList('pending-tbody', store.students.filter(s => s.status === 'pending'), pendingRow, 3, 'No pending approvals');
      renderList('current-tbody', store.students.filter(isCurrent), currentRow, 4, 'No current students');
      renderList('old-tbody', store.students.filter(isOld), oldRow, 3, 'No old students');
      if (!superadmin) return;
      renderList('admins-tbody', store.admins, adminRow, 4,
        html`No other admins yet. Use <strong>+ Add Admin</strong> to promote a student.`);
      const eligible = store.students.filter(isCurrent);
      el('add-admin-list').innerHTML = String(eligible.length
        ? html`${eligible.map(addAdminItem)}`
        : html`<p class="add-admin-empty">No current students available to promote.</p>`);
    }

    function selectTab(tab) {
      store.tab = tab;
      root.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
      root.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `${tab}-tab`));
      window.history.replaceState(null, '', `#/students?tab=${tab}`);
    }

    async function mutate(write, apply, failure) {
      try {
        await write();
        apply();
        if (alive) refresh();
      } catch (error) {
        console.error(error);
        ctx.alert(failure);
      }
    }

    const actions = {
      approve(id) {
        return mutate(() => users.approve(id), () => { findStudent(id).status = 'approved'; },
          'Failed to approve student. Please try again.');
      },
      deny(id) {
        if (!ctx.confirm('Are you sure you want to deny this registration? Their account will be permanently deleted.')) return;
        return mutate(() => users.remove(id), () => store.removeStudent(id),
          'Failed to deny registration. Please try again.');
      },
      'toggle-type'(id, button) {
        const { type } = button.dataset;
        return mutate(() => users.setStudentType(id, type), () => { findStudent(id).studentType = type; },
          'Failed to update student. Please try again.');
      },
      delete(id) {
        const student = findStudent(id);
        if (!student || !ctx.confirm(`Permanently delete ${fullName(student)}'s account? This cannot be undone.`)) return;
        return mutate(() => users.remove(id), () => store.removeStudent(id),
          'Failed to delete student. Please try again.');
      },
      promote(id) {
        const student = findStudent(id);
        if (!student || !ctx.confirm(`Promote ${fullName(student)} to admin?\n\nThey will have full access to the admin dashboard.`)) return;
        return mutate(() => users.setRole(id, 'admin'), () => {
          store.removeStudent(id);
          store.admins.push({ ...student, role: 'admin' });
        }, 'Failed to promote student. Please try again.');
      },
      'remove-admin'(id) {
        const admin = store.admins.find(a => a.id === id);
        if (!admin || !ctx.confirm(`Remove admin access for ${fullName(admin)}?\n\nThey will become a student account.`)) return;
        const extra = { status: admin.status || 'approved', studentType: admin.studentType || 'current' };
        return mutate(() => users.setRole(id, 'student', extra), () => {
          store.admins = store.admins.filter(a => a.id !== id);
          if (!store.students.some(s => s.id === id)) store.students.push({ ...admin, role: 'student', ...extra });
        }, 'Failed to remove admin access. Please try again.');
      },
      'open-add-admin'() { el('add-admin-modal').classList.add('show'); },
      'close-add-admin'() { el('add-admin-modal').classList.remove('show'); }
    };

    function onClick(event) {
      const tab = event.target.closest('.admin-tab');
      if (tab) return selectTab(tab.dataset.tab);
      const button = event.target.closest('[data-action]');
      if (button) return actions[button.dataset.action]?.(button.dataset.id, button);
      if (event.target.id === 'add-admin-modal') return actions['close-add-admin']();
      const row = event.target.closest('tr.clickable-row');
      if (row) ctx.navigate(`#/students/${row.dataset.id}`);
    }

    function onKeydown(event) {
      const row = event.target.closest('tr.clickable-row');
      if (!row || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      ctx.navigate(`#/students/${row.dataset.id}`);
    }

    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKeydown);

    const ready = (async () => {
      try {
        if (!store.students) store.students = await users.listByRole('student');
        if (superadmin && !store.admins) store.admins = await users.listByRole('admin');
      } catch (error) {
        console.error('Error loading students:', error);
        return;
      }
      if (alive) refresh();
    })();

    return {
      ready,
      dispose() {
        alive = false;
        root.removeEventListener('click', onClick);
        root.removeEventListener('keydown', onKeydown);
      }
    };
  }
};
