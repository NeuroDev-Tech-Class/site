import { html } from '../../lib/html.js';
import { fullName, formatDate, toDate } from '../../lib/format.js';
import { courseMetadata } from '../../course-metadata.js';
import { statCard, icon, emptyState } from '../icons.js';
import { courseSummaries } from '../progress.js';
import { buildCertificateFileName, base64ToUint8 } from '../certificate-docx.js';

const RING = 'M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831';

const courseCard = c => html`
  <div class="course-card ${c.pct >= 100 ? 'completed' : ''} clickable" data-action="view-results" data-course-id="${c.id}">
    <div class="course-info">
      <h3>${c.name}</h3>
      <span class="course-tasks">${c.completed} / ${c.total} tasks</span>
      ${c.ungradedTests > 0
        ? html`<span class="course-grading-note">${c.ungradedTests} test${c.ungradedTests === 1 ? '' : 's'} still need grading</span>`
        : ''}
      <span class="view-results-hint">View test results →</span>
    </div>
    <div class="progress-ring-container">
      <svg class="progress-ring" viewBox="0 0 36 36">
        <path class="progress-ring-bg" d="${RING}" fill="none" stroke-width="3"/>
        <path class="progress-ring-fill" d="${RING}" fill="none" stroke-width="3" stroke-dasharray="${c.pct}, 100"/>
      </svg>
      <span class="progress-text">${c.pct}%</span>
    </div>
  </div>
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

const view = (student, summary) => {
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
    let results = {};

    function render() {
      const summary = courseSummaries(student, results);
      root.innerHTML = String(view(student, summary));
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
      'view-results'(button) { ctx.navigate(`#/students/${uid}/results/${button.dataset.courseId}`); },

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
            const cert = { courseId, courseName, awardedAt: awardDate.toISOString() };
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
      if (button) actions[button.dataset.action]?.(button);
    }
    root.addEventListener('click', onClick);

    const ready = (async () => {
      student = await loadStudent(ctx, uid);
      if (!alive) return;
      if (!student) return ctx.navigate('#/students');
      results = await ctx.testResults.getForEmail(student.email).catch(() => ({}));
      if (!alive) return;
      store.upsertStudent(student);
      render();
    })();

    return {
      ready,
      dispose() {
        alive = false;
        root.removeEventListener('click', onClick);
      }
    };
  }
};
