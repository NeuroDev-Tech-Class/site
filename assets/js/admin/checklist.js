import { html } from '../lib/html.js';

export function getItemType(item) {
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

export function itemTitle(item) {
  if (typeof item?.title === 'string' && item.title.trim()) return item.title.trim();
  if (item?.type === 'html') {
    const text = plainText(item.html);
    if (text) return text;
  }
  return 'Untitled Task';
}

export const checklist = (unitData, progress) => html`
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
