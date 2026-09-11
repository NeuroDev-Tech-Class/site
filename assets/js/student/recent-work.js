import { html } from '../lib/html.js';
import { formatDate } from '../lib/format.js';
import { statusLabel, scoreLabel } from '../lib/submissions.js';
import { emptyState } from '../admin/icons.js';

const MAX_ROWS = 10;

const statusClass = sub => sub.passed === true ? 'pass' : sub.passed === false ? 'fail' : 'pending';

const row = sub => html`
  <li class="work-item">
    <div class="work-head">
      <h3>${sub.itemTitle}</h3>
      <span class="work-status ${statusClass(sub)}">${statusLabel(sub)}</span>
    </div>
    <p class="work-meta">${sub.courseName} &middot; Submitted ${formatDate(sub.submittedAt, { month: 'long', fallback: 'date unknown' })}</p>
    ${sub.status === 'graded' ? html`<p class="work-score">${scoreLabel(sub)}</p>` : ''}
    ${sub.feedback ? html`<p class="work-feedback"><strong>Feedback:</strong> ${sub.feedback}</p>` : ''}
  </li>
`;

export function renderRecentWork(container, submissions) {
  const recent = (submissions || []).slice(0, MAX_ROWS);
  container.innerHTML = String(recent.length
    ? html`<ul class="work-list">${recent.map(row)}</ul>`
    : emptyState('tasks', 'No work submitted yet. Scores and feedback will show here.'));
}
