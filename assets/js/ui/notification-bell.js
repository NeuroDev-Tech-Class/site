import { html } from '../lib/html.js';
import { timeAgo } from '../lib/format.js';
import { icon } from '../admin/icons.js';

const MAX_ROWS = 10;

// One bell per header; mounting again replaces the previous instance and its listeners.
const mounted = new WeakMap();

const row = (n, now) => html`
  <li>
    <a class="notif-item ${n.read ? '' : 'unread'}" href="${n.link}" data-action="open" data-id="${n.id}">
      <span class="notif-title">${n.title}</span>
      <span class="notif-body">${n.body}</span>
      <span class="notif-time">${timeAgo(n.createdAt, now)}</span>
    </a>
  </li>
`;

const panelView = (list, now) => html`
  <div class="notif-head">
    <span class="notif-heading">Notifications</span>
    ${list.length ? html`<button type="button" class="notif-mark-all" data-action="mark-all">Mark all read</button>` : ''}
  </div>
  ${list.length
    ? html`<ul class="notif-list">${list.map(n => row(n, now))}</ul>`
    : html`<p class="notif-empty">Nothing new.</p>`}
`;

const shell = () => html`
  <button type="button" class="notif-btn" aria-label="Notifications" aria-haspopup="true" aria-expanded="false">
    ${icon('bell')}
    <span class="notif-count" hidden></span>
  </button>
  <div class="notif-panel"></div>
`;

export function mountBell(header, { uid, repo, now = () => new Date(), navigate = href => { window.location.href = href; } }) {
  mounted.get(header)?.dispose();

  const menu = document.createElement('div');
  menu.id = 'notif-menu';
  menu.className = 'notif-menu';
  menu.innerHTML = String(shell());
  header.appendChild(menu);

  const button = menu.querySelector('.notif-btn');
  const count = menu.querySelector('.notif-count');
  const panel = menu.querySelector('.notif-panel');
  let list = [];

  function setOpen(open) {
    panel.classList.toggle('show', open);
    button.setAttribute('aria-expanded', String(open));
  }

  function render() {
    panel.innerHTML = String(panelView(list, now()));
  }

  async function open(id, href) {
    const item = list.find(n => n.id === id);
    if (item && !item.read) {
      try {
        await repo.markRead(uid, id);
      } catch (error) {
        console.error('Could not mark the notification read:', error);
      }
    }
    navigate(href);
  }

  async function markAll() {
    const unread = list.filter(n => !n.read).map(n => n.id);
    if (!unread.length) return;
    try {
      await repo.markAllRead(uid, unread);
    } catch (error) {
      console.error('Could not mark notifications read:', error);
    }
  }

  function onMenuClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    if (target.dataset.action === 'open') {
      event.preventDefault();
      open(target.dataset.id, target.getAttribute('href'));
    } else if (target.dataset.action === 'mark-all') {
      markAll();
    }
  }

  // The click must reach document so the user menu's own outside-click check can close it.
  function onButtonClick() {
    setOpen(!panel.classList.contains('show'));
  }

  function onDocumentClick(event) {
    if (!menu.contains(event.target)) setOpen(false);
  }

  const logError = what => error => console.error(`Could not load ${what}:`, error);

  const unsubscribeCount = repo.subscribeUnreadCount(uid, n => {
    count.textContent = String(n);
    count.hidden = n === 0;
  }, logError('the unread count'));

  const unsubscribeInbox = repo.subscribeInbox(uid, rows => {
    list = rows;
    render();
  }, logError('notifications'), { limit: MAX_ROWS });

  button.addEventListener('click', onButtonClick);
  panel.addEventListener('click', onMenuClick);
  document.addEventListener('click', onDocumentClick);

  const api = {
    dispose() {
      unsubscribeCount();
      unsubscribeInbox();
      document.removeEventListener('click', onDocumentClick);
      menu.remove();
      if (mounted.get(header) === api) mounted.delete(header);
    }
  };
  mounted.set(header, api);
  return api;
}
