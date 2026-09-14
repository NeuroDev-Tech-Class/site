import { html } from '../../lib/html.js';
import { fullName, formatDate, toDate } from '../../lib/format.js';
import { courseMetadata } from '../../course-metadata.js';
import { statusLabel, scoreLabel } from '../../lib/submissions.js';
import { statCard, icon, emptyState } from '../icons.js';
import { courseSummaries } from '../progress.js';
import { checklist } from '../checklist.js';
import { buildCertificateFileName, base64ToUint8 } from '../certificate-docx.js';

const RING = 'M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831';

const courseCard = c => html`
  <div class="course-card ${c.pct >= 100 ? 'completed' : ''}">
    <div class="course-info">
      <h3>${c.name}</h3>
      <span class="course-tasks">${c.completed} / ${c.total} tasks</span>
      ${c.ungradedTests > 0
        ? html`<span class="course-grading-note">${c.ungradedTests} test${c.ungradedTests === 1 ? '' : 's'} still need grading</span>`
        : ''}
      <button class="action-btn checklist-toggle" data-action="toggle-checklist" data-course-id="${c.id}">Show checklist</button>
    </div>
    <div class="progress-ring-container">
      <svg class="progress-ring" viewBox="0 0 36 36">
        <path class="progress-ring-bg" d="${RING}" fill="none" stroke-width="3"/>
        <path class="progress-ring-fill" d="${RING}" fill="none" stroke-width="3" stroke-dasharray="${c.pct}, 100"/>
      </svg>
      <span class="progress-text">${c.pct}%</span>
    </div>
    <div class="course-checklist" data-checklist="${c.id}" hidden></div>
  </div>
`;

const submissionRow = sub => html`
  <tr data-id="${sub.id}" class="clickable-row" tabindex="0" role="button" aria-label="Open ${sub.itemTitle}">
    <td>${sub.itemTitle}</td>
    <td>${sub.courseName}</td>
    <td>${formatDate(sub.submittedAt, { fallback: 'N/A' })}</td>
    <td>${statusLabel(sub)}</td>
    <td>${scoreLabel(sub)}</td>
    <td><span class="open-hint">Open →</span></td>
  </tr>
`;

const submissionsSection = submissions => html`
  <section class="dashboard-section">
    <h2>Submissions</h2>
    <div id="sv-submissions">
      ${submissions.length
        ? html`
          <div class="students-table-container">
            <table class="students-table">
              <thead><tr><th>Item</th><th>Certificate</th><th>Submitted</th><th>Status</th><th>Score</th><th></th></tr></thead>
              <tbody>${submissions.map(submissionRow)}</tbody>
            </table>
          </div>`
        : emptyState('tasks', 'No work submitted yet.')}
    </div>
  </section>
`;

const certificateCard = (cert, index) => html`
  <div class="certificate-card">
    <div class="certificate-badge">${icon('certificate')}</div>
    <div class="certificate-info">
      <h3>${cert.courseName}</h3>
      <span class="certificate-date">Awarded ${formatDate(cert.awardedAt, { fallback: 'N/A' })}</span>
      <div class="certificate-actions">
        <button class="action-btn cert certificate-download-btn" data-action="download-cert" data-index="${index}">Download / Print</button>
      </div>
    </div>
  </div>
`;

const view = (student, summary, submissions) => {
  const certificates = student.certificates || [];
  return html`
    <div class="student-view active">
      <div class="student-view-header">
        <button class="back-btn" data-action="back">← Back to Dashboard</button>
        <div>
          <h1>${fullName(student)}</h1>
          <p class="dashboard-subtitle">${student.email}</p>
        </div>
      </div>
      <div class="stats-grid">
        ${statCard('courses-icon', 'courses', 'sv-courses-started', 'Courses Started')}
        ${statCard('completed-icon', 'check', 'sv-courses-completed', 'Courses Completed')}
        ${statCard('cert-icon', 'certificate', 'sv-certs-earned', 'Certificates Earned')}
        ${statCard('tasks-icon', 'tasks', 'sv-tasks-completed', 'Tasks Completed')}
      </div>
      <section class="dashboard-section">
        <h2>Course Progress</h2>
        <div id="sv-courses-container" class="courses-grid">
          ${summary.courses.length ? summary.courses.map(courseCard) : emptyState('courses', 'No courses started yet.')}
        </div>
      </section>
      ${submissionsSection(submissions)}
      <section class="dashboard-section">
        <h2>Certificates Earned</h2>
        <div id="sv-certs-container" class="certificates-grid">
          ${certificates.length ? certificates.map(certificateCard) : emptyState('certificate', 'No certificates earned yet.')}
        </div>
      </section>
      <section class="dashboard-section">
        <h2>Award Certificate</h2>
        <div class="cert-form">
          <select class="cert-select" id="sv-cert-select">
            <option value="">Select a course...</option>
            ${Object.entries(courseMetadata).map(([id, meta]) => html`<option value="${id}">${meta.name}</option>`)}
          </select>
          <button class="action-btn cert" id="sv-award-cert-btn" data-action="award">Award Certificate</button>
        </div>
      </section>
    </div>
  `;
};

export async function loadStudent(ctx, uid) {
  try {
    return await ctx.users.getUser(uid);
  } catch (error) {
    console.error('Error loading student data:', error);
    return ctx.store.students?.find(s => s.id === uid) || null;
  }
}

export const studentDetailView = {
  mount(root, route, ctx) {
    const { uid } = route.params;
    const { users, mail, store } = ctx;
    let alive = true;
    let student = null;
    let submissions = [];

    function render() {
      const summary = courseSummaries(student, submissions);
      root.innerHTML = String(view(student, summary, submissions));
      root.querySelector('#sv-courses-started').textContent = summary.started;
      root.querySelector('#sv-courses-completed').textContent = summary.completed;
      root.querySelector('#sv-certs-earned').textContent = (student.certificates || []).length;
      root.querySelector('#sv-tasks-completed').textContent = summary.tasks;
    }

    async function withBusyButton(button, busyLabel, work) {
      const label = button.textContent;
      button.disabled = true;
      button.textContent = busyLabel;
      try {
        await work();
      } finally {
        if (button.isConnected) {
          button.disabled = false;
          button.textContent = label;
        }
      }
    }

    const actions = {
      back() { ctx.navigate(`#/students?tab=${store.tab}`); },

      async 'toggle-checklist'(button) {
        const { courseId } = button.dataset;
        const box = root.querySelector(`[data-checklist="${courseId}"]`);
        if (!box) return;
        if (!box.hidden) {
          box.hidden = true;
          button.textContent = 'Show checklist';
          return;
        }
        if (!box.dataset.loaded) {
          const label = button.textContent;
          button.disabled = true;
          button.textContent = 'Loading...';
          try {
            const structure = await ctx.fetchCourseStructure(courseId);
            if (!alive) return;
            box.innerHTML = String(checklist(structure || [], student.courses?.[courseId] || {}));
            box.dataset.loaded = 'true';
          } catch (error) {
            console.error('Error loading course structure:', error);
            ctx.alert('Failed to load the course checklist. Please try again.');
            return;
          } finally {
            button.disabled = false;
            button.textContent = label;
          }
        }
        box.hidden = false;
        button.textContent = 'Hide checklist';
      },

      async 'download-cert'(button) {
        const cert = (student.certificates || [])[Number(button.dataset.index)];
        if (!cert) return ctx.alert('Certificate not found.');
        try {
          await withBusyButton(button, 'Preparing...', async () => {
            const studentName = fullName(student);
            const base64 = await ctx.generateCertificate(studentName, cert.courseName, toDate(cert.awardedAt) || ctx.now());
            ctx.download(buildCertificateFileName(cert.courseName, studentName), base64ToUint8(base64));
          });
        } catch (error) {
          console.error('Error downloading certificate:', error);
          ctx.alert('Failed to download certificate. Please try again.');
        }
      },

      async award(button) {
        const courseId = root.querySelector('#sv-cert-select').value;
        if (!courseId) return ctx.alert('Please select a course.');
        const courseName = courseMetadata[courseId].name;
        const existing = student.certificates || [];
        if (existing.some(c => c.courseId === courseId)) {
          return ctx.alert('This student already has a certificate for this course.');
        }
        try {
          await withBusyButton(button, 'Awarding...', async () => {
            const awardDate = ctx.now();
            const cert = { courseId, courseName, awardedAt: awardDate.toISOString(), awardedBy: ctx.currentUid };
            await users.addCertificate(uid, existing, cert);
            student.certificates = [...existing, cert];
            store.upsertStudent(student);
            button.textContent = 'Generating Certificate...';
            const studentName = fullName(student);
            const content = await ctx.generateCertificate(studentName, courseName, awardDate);
            await mail.queueCertificate(student, courseName, { filename: buildCertificateFileName(courseName, studentName), content });
          });
          if (!alive) return;
          render();
          ctx.alert(`Certificate awarded for ${courseName}! An email has been sent to ${student.email}.`);
        } catch (error) {
          console.error('Error awarding certificate:', error);
          ctx.alert('Certificate generation/email failed. Please try again.');
        }
      }
    };

    function onClick(event) {
      const button = event.target.closest('[data-action]');
      if (button) return actions[button.dataset.action]?.(button);
      const row = event.target.closest('tr.clickable-row');
      if (row) ctx.navigate(`#/grade/${row.dataset.id}`);
    }

    function onKeydown(event) {
      const row = event.target.closest('tr.clickable-row');
      if (!row || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      ctx.navigate(`#/grade/${row.dataset.id}`);
    }

    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKeydown);

    const ready = (async () => {
      student = await loadStudent(ctx, uid);
      if (!alive) return;
      if (!student) return ctx.navigate('#/students');
      submissions = await ctx.submissions.listForStudent(uid).catch(() => []);
      if (!alive) return;
      store.upsertStudent(student);
      render();
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
