import { html } from '../../lib/html.js';
import { timeAgo } from '../../lib/format.js';
import { NOTIFICATION_TYPES, TYPE_LABELS } from '../../lib/notifications.js';
import { emptyState } from '../icons.js';

const FEED_LIMIT = 100;
const TYPES = Object.values(NOTIFICATION_TYPES);

const shell = filters => html`
  <div class="dashboard-header">
    <h1>Activity</h1>
    <p class="dashboard-subtitle">Newest first, the last ${FEED_LIMIT} events</p>
  </div>
  <div class="queue-controls">
    <label class="queue-filter">Type
      <select id="feed-type">
        <option value="">All types</option>
        ${TYPES.map(type => html`<option value="${type}" ${filters.type === type ? 'selected' : ''}>${TYPE_LABELS[type]}</option>`)}
      </select>
    </label>
    <label class="queue-filter">Student
      <input id="feed-student" type="search" placeholder="Name" value="${filters.student}">
    </label>
  </div>
  <div id="feed"><p class="feed-loading">Loading activity...</p></div>
`;

const row = (entry, now) => html`
  <li class="feed-item" data-id="${entry.id}">
    <a class="feed-summary" href="${entry.link}">${entry.summary}</a>
    <span class="feed-time">${timeAgo(entry.createdAt, now)}</span>
  </li>
`;

export const activityView = {
  mount(root, route, ctx) {
    const filters = {
      type: TYPES.includes(route.query.type) ? route.query.type : '',
      student: route.query.student || ''
    };
    let alive = true;
    let feed = null;

    root.innerHTML = String(shell(filters));
    const box = root.querySelector('#feed');

    const visible = () => feed.filter(entry =>
      (!filters.type || entry.type === filters.type) &&
      (!filters.student || (entry.subjectName || '').toLowerCase().includes(filters.student.toLowerCase())));

    function render() {
      if (!feed) return;
      const list = visible();
      const now = ctx.now();
      box.innerHTML = String(list.length
        ? html`<ul class="feed-list">${list.map(entry => row(entry, now))}</ul>`
        : emptyState('activity', feed.length ? 'Nothing matches these filters.' : 'Nothing has happened yet.'));
    }

    function syncHash() {
      const params = new URLSearchParams();
      if (filters.type) params.set('type', filters.type);
      if (filters.student) params.set('student', filters.student);
      const search = params.toString();
      window.history.replaceState(null, '', `#/activity${search ? `?${search}` : ''}`);
    }

    function onFilter(event) {
      if (event.target.id === 'feed-type') filters.type = event.target.value;
      else if (event.target.id === 'feed-student') filters.student = event.target.value;
      else return;
      syncHash();
      render();
    }

    root.addEventListener('input', onFilter);
    root.addEventListener('change', onFilter);

    const unsubscribe = ctx.activity.subscribeFeed(rows => {
      if (!alive) return;
      feed = rows;
      render();
    }, error => {
      console.error('Error loading activity:', error);
      if (alive) box.innerHTML = String(html`<p class="feed-error">Could not load activity. Refresh to try again.</p>`);
    }, { limit: FEED_LIMIT });

    return {
      ready: Promise.resolve(),
      dispose() {
        alive = false;
        unsubscribe();
        root.removeEventListener('input', onFilter);
        root.removeEventListener('change', onFilter);
      }
    };
  }
};
