import { html } from '../../lib/html.js';
import { formatDate } from '../../lib/format.js';
import { statusLabel } from '../../lib/submissions.js';
import { deriveTotals } from '../../lib/grade.js';
import { emptyState } from '../icons.js';

const answersTable = answers => html`
  <table class="students-table">
    <thead><tr><th>Question</th><th>Answer</th></tr></thead>
    <tbody>${answers.map(([question, answer]) => html`<tr><td>${question}</td><td>${answer}</td></tr>`)}</tbody>
  </table>
`;

const view = (sub, { saved, remaining }) => {
  const answers = Object.entries(sub.answers || {});
  return html`
    <div class="student-view active">
      <div class="student-view-header">
        <a class="back-btn" href="#/queue">← Back to Queue</a>
        <div>
          <h1>${sub.itemTitle}</h1>
          <p class="dashboard-subtitle">
            <a href="#/students/${sub.studentUid}">${sub.studentName}</a>
            · ${sub.courseName} · Submitted ${formatDate(sub.submittedAt, { fallback: 'N/A' })} · ${statusLabel(sub)}
          </p>
        </div>
      </div>
      <section class="dashboard-section">
        <h2>Answers</h2>
        <div id="grade-answers">
          ${answers.length ? answersTable(answers) : emptyState('tasks', 'No answers were recorded for this submission.')}
        </div>
      </section>
      <section class="dashboard-section">
        <h2>Grade</h2>
        <div class="grade-panel">
          <div class="grade-input-row">
            <label class="grade-label" for="grade-score">Score</label>
            <input id="grade-score" class="grade-input" type="number" min="0" step="1" value="${sub.manualScore ?? ''}">
            ${sub.totalMax === null
              ? html`
                <label class="grade-label" for="grade-outof">out of</label>
                <input id="grade-outof" class="grade-input" type="number" min="1" step="1" placeholder="Total">`
              : html`<span class="grade-outof-label">out of ${sub.totalMax}</span>`}
          </div>
          <label class="grade-label" for="grade-feedback">Feedback</label>
          <textarea id="grade-feedback" class="grade-feedback" rows="4" placeholder="What the student should look at next">${sub.feedback || ''}</textarea>
          <div class="grade-actions">
            <button class="action-btn approve" id="grade-save">${sub.status === 'graded' ? 'Update grade' : 'Mark graded'}</button>
            <span id="grade-message" role="status">${saved ? 'Saved' : ''}</span>
            ${saved && remaining.length
              ? html`<button class="action-btn" id="grade-next">Grade next (${remaining.length} left)</button>` : ''}
            ${saved && !remaining.length
              ? html`<button class="action-btn" id="grade-back">Back to queue</button>` : ''}
          </div>
        </div>
      </section>
    </div>
  `;
};

export const gradeView = {
  mount(root, route, ctx) {
    const { id } = route.params;
    const { store } = ctx;
    let alive = true;
    let sub = null;
    let saved = false;

    const el = sel => root.querySelector(`#${sel}`);
    const remaining = () => (store.queue || []).filter(s => s.id !== id);

    function render() {
      root.innerHTML = String(view(sub, { saved, remaining: remaining() }));
    }

    function readNumber(input, { min = 0 } = {}) {
      const raw = (input?.value ?? '').trim();
      const value = Number(raw);
      return raw === '' || !Number.isFinite(value) || value < min ? null : value;
    }

    async function save(button) {
      const score = readNumber(el('grade-score'));
      if (score === null) {
        ctx.alert('Enter a valid score of 0 or higher.');
        return el('grade-score').focus();
      }
      let max = sub.totalMax;
      if (max === null) {
        max = readNumber(el('grade-outof'), { min: 1 });
        if (max === null) {
          ctx.alert('Enter the total this test is out of.');
          return el('grade-outof').focus();
        }
      }
      if (score > max) {
        ctx.alert(`Score cannot be higher than ${max}.`);
        return el('grade-score').focus();
      }
      const feedback = el('grade-feedback').value.trim();
      const label = button.textContent;
      button.disabled = true;
      button.textContent = 'Saving...';
      try {
        await ctx.submissions.grade(id, { manualScore: score, totalMax: max, feedback }, ctx.currentUid);
        sub = {
          ...sub, manualScore: score, totalMax: max, feedback, status: 'graded', gradedBy: ctx.currentUid,
          ...deriveTotals({ autoScore: sub.autoScore, manualScore: score, totalMax: max })
        };
        saved = true;
        if (alive) render();
      } catch (error) {
        console.error('Error saving grade:', error);
        ctx.alert('Failed to save the grade. Please try again.');
        button.disabled = false;
        button.textContent = label;
      }
    }

    function onClick(event) {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.id === 'grade-save') save(button);
      else if (button.id === 'grade-next') ctx.navigate(`#/grade/${remaining()[0].id}`);
      else if (button.id === 'grade-back') ctx.navigate('#/queue');
    }

    root.addEventListener('click', onClick);

    const ready = (async () => {
      try {
        sub = await ctx.submissions.get(id);
      } catch (error) {
        console.error('Error loading submission:', error);
        sub = null;
      }
      if (!alive) return;
      if (!sub) return ctx.navigate('#/queue');
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
