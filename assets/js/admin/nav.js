import { html, raw } from '../lib/html.js';
import { icon } from './icons.js';

const QUEUE_LIMIT = 200;

const LINKS = [
  { label: 'Today', href: '#/today', icon: 'today', routes: ['today'], badge: false },
  { label: 'Grading Queue', href: '#/queue', icon: 'queue', routes: ['queue', 'grade'], badge: true },
  { label: 'Students', href: '#/students', icon: 'students', routes: ['students', 'student'], badge: false },
  { label: 'Activity', href: '#/activity', icon: 'activity', routes: ['activity'], badge: false }
];

export function mountNav(container, store) {
  let routeName = null;

  function render() {
    const count = store.queue?.length || 0;
    container.innerHTML = String(html`
      <nav class="admin-nav" aria-label="Admin">
        ${LINKS.map(link => html`
          <a class="admin-nav-link" href="${link.href}" ${link.routes.includes(routeName) ? raw('aria-current="page"') : ''}>
            ${icon(link.icon, 20)}
            <span class="admin-nav-label">${link.label}</span>
            ${link.badge ? html`<span class="nav-badge" ${count ? '' : raw('hidden')}>${count ? (count >= QUEUE_LIMIT ? `${QUEUE_LIMIT}+` : count) : ''}</span>` : ''}
          </a>
        `)}
      </nav>
    `);
  }

  const unsubscribe = store.subscribe(render);
  render();

  return {
    setRoute(route) {
      routeName = route?.name || null;
      render();
    },
    dispose: unsubscribe
  };
}
