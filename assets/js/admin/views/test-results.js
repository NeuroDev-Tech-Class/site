import { html, raw } from '../../lib/html.js';
import { fullName, formatDate } from '../../lib/format.js';
import { courseMetadata } from '../../course-metadata.js';
import { emptyState } from '../icons.js';
import { loadStudent } from './student-detail.js';

function getItemType(item) {
  if (item.type === 'video') return 'Video';
  if (item.type === 'html') return 'Reading';
  if (item.url?.includes('presentation')) return 'Slides';
  if (item.url?.includes('/forms/')) return 'Test';
  return 'Reading';
}

function plainText(markup) {
  if (!markup || typeof markup !== 'string') return '';
  const temp = document.createElement('div');
  temp.innerHTML = markup;
  return (temp.textContent || '').replace(/\s+/g, ' ').trim();
}

function itemTitle(item) {
  if (typeof item?.title === 'string' && item.title.trim()) return item.title.trim();
  if (item?.type === 'html') {
    const text = plainText(item.html);
    if (text) return text;
  }
  return 'Untitled Task';
}

const hasScore = value => value !== null && value !== undefined && value !== '';

const checklist = (unitData, progress) => html`
  <section class="dashboard-section checklist-section">
    <h2>Course Items</h2>
    ${unitData.map((unit, unitIndex) => html`
      <div class="checklist-unit">
        <h3>${unit.title}</h3>
        <div class="checklist-items">
          ${unit.content.map((item, itemIndex) => {
            const checked = progress[`${unitIndex}-${itemIndex}`] === true;
            return html`
              <div class="checklist-item ${checked ? 'checked' : ''}">
                <span class="checklist-status">${checked ? '✓' : '○'}</span>
                <span class="checklist-type-badge">${getItemType(item)}</span>
                <span class="checklist-title">${itemTitle(item)}</span>
              </div>
            `;
          })}
        </div>
      </div>
    `)}
  </section>
`;

function resultCard({ fullKey, unitKey, result }) {
  const rawScore = result.score;
  const graded = hasScore(rawScore);
  const total = Number.isFinite(Number(result.total)) ? Number(result.total) : null;
  const pct = graded && total > 0 ? Math.round((Number(rawScore) / total) * 100) : null;
  const scoreDisplay = !graded ? 'Not graded'
    : total ? html`${rawScore} / ${total} &nbsp;(${pct}%)`
    : html`${rawScore} pts`;
  const answers = Object.entries(result.answers || {});
  const unitLabel = unitKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const inputValue = graded && Number.isFinite(Number(rawScore)) ? Number(rawScore) : '';
  const inputId = `score-${fullKey.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

  return html`
    <div class="test-result-card">
      <div class="test-result-header">
        <h3>${unitLabel}</h3>
        <div class="test-result-meta">
          <span class="test-score ${pct === null ? '' : pct >= 70 ? 'pass' : 'fail'}">${scoreDisplay}</span>
          <span class="test-date">${formatDate(result.submittedAt, { fallback: 'N/A' })}</span>
        </div>
      </div>
      <div class="grade-editor">
        <label class="grade-label" for="${inputId}">Grade</label>
        <div class="grade-input-row">
          <input id="${inputId}" class="grade-input" type="number" min="0" ${raw(total != null ? `max="${total}"` : '')} step="1" value="${inputValue}" />
          <span class="grade-total">${total != null ? `/ ${total}` : 'points'}</span>
          <button class="action-btn approve grade-save-btn" data-action="save-score" data-key="${fullKey}">Save Score</button>
        </div>
      </div>
      ${answers.length ? html`
        <div class="test-answers">
          <h4>Answers</h4>
          ${answers.map(([question, answer]) => html`
            <div class="answer-row">
              <span class="answer-question">${question}</span>
              <span class="answer-value">${answer}</span>
            </div>
          `)}
        </div>
      ` : ''}
    </div>
  `;
}

const shell = (student, courseName) => html`
  <div class="student-view active">
    <div class="student-view-header">
      <button class="back-btn" data-action="back">← Back to Student</button>
      <div>
        <h1>${courseName}</h1>
        <p class="dashboard-subtitle">${fullName(student)}</p>
      </div>
    </div>
    <div id="tr-checklist"></div>
    <div id="tr-content"></div>
  </div>
`;

export const testResultsView = {
  mount(root, route, ctx) {
    const { uid, courseId } = route.params;
    let alive = true;
    let student = null;
    let results = {};

    // Results are stored as flat keys: "courseId_unitKey"
    function renderResults() {
      const prefix = `${courseId}_`;
      const unitResults = Object.entries(results)
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, result]) => ({ fullKey: key, unitKey: key.slice(prefix.length), result }))
        .sort((a, b) => a.unitKey.localeCompare(b.unitKey));
      root.querySelector('#tr-content').innerHTML = String(unitResults.length
        ? unitResults.map(resultCard)
        : emptyState('tasks', 'No test results for this course yet.'));
    }

    async function saveScore(key, button) {
      const current = results[key] || {};
      const input = button.closest('.test-result-card')?.querySelector('.grade-input');
      if (!input) return;
      const score = Number(input.value);
      if (!Number.isFinite(score) || score < 0) {
        ctx.alert('Enter a valid score of 0 or higher.');
        return input.focus();
      }
      const total = Number(current.total);
      if (Number.isFinite(total) && score > total) {
        ctx.alert(`Score cannot be higher than ${total}.`);
        return input.focus();
      }
      const updated = { ...current, score, gradedAt: ctx.now().toISOString(), gradedBy: ctx.currentUid };
      const label = button.textContent;
      button.disabled = true;
      button.textContent = 'Saving...';
      try {
        await ctx.testResults.saveScore(student.email, key, updated);
        results = { ...results, [key]: updated };
        if (alive) renderResults();
      } catch (error) {
        console.error('Error saving test score:', error);
        ctx.alert('Failed to save test score. Please try again.');
        button.disabled = false;
        button.textContent = label;
      }
    }

    function onClick(event) {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      if (button.dataset.action === 'back') ctx.navigate(`#/students/${uid}`);
      if (button.dataset.action === 'save-score') saveScore(button.dataset.key, button);
    }
    root.addEventListener('click', onClick);

    const ready = (async () => {
      student = await loadStudent(ctx, uid);
      if (!alive) return;
      if (!student) return ctx.navigate('#/students');
      results = await ctx.testResults.getForEmail(student.email).catch(() => ({}));
      if (!alive) return;
      root.innerHTML = String(shell(student, courseMetadata[courseId]?.name || courseId));
      renderResults();
      ctx.fetchCourseStructure(courseId).then(unitData => {
        if (!alive || !unitData) return;
        root.querySelector('#tr-checklist').innerHTML = String(checklist(unitData, student.courses?.[courseId] || {}));
      }).catch(() => {});
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
