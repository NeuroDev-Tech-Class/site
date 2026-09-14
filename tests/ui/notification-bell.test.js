import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom, click, settle, text } from '../helpers/dom.js';
import { createFakeFirestore } from '../helpers/fake-firestore.js';
import { notificationsRepo } from '../../assets/js/data/notifications.js';
import { mountBell } from '../../assets/js/ui/notification-bell.js';

const NOW = new Date('2026-09-11T18:00:00Z');
const minutesAgo = n => new Date(NOW.getTime() - n * 60000);

const notif = (title, createdAt, over = {}) => ({
  type: 'submission_graded', title, body: 'Python I: you scored 8 / 10 (80%). Passed.',
  link: 'profile.html', actorName: 'Topher', read: false, createdAt, ...over
});

const seed = () => ({
  'users/c1/meta/counters': { unread: 2 },
  'users/c1/inbox/n1': notif('Oldest, already read', minutesAgo(3 * 24 * 60), { read: true }),
  'users/c1/inbox/n2': notif('Unit 1 Test graded', minutesAgo(90)),
  'users/c1/inbox/n3': notif('Your account is approved', minutesAgo(5), { link: 'admin.html#/grade/x', type: 'account_approved' }),
  'users/c2/inbox/n9': notif('Someone else', minutesAgo(1))
});

let dom, header, fs, repo, navigations, bell;
beforeEach(() => {
  dom = setupDom();
  header = dom.document.createElement('header');
  dom.document.body.prepend(header);
  navigations = [];
});

async function mount(seedOverride) {
  fs = createFakeFirestore({ now: NOW, seed: seedOverride || seed() });
  repo = notificationsRepo(fs);
  bell = mountBell(header, { uid: 'c1', repo, now: () => NOW, navigate: href => navigations.push(href) });
  await settle();
  return bell;
}

const button = () => header.querySelector('.notif-btn');
const count = () => header.querySelector('.notif-count');
const panel = () => header.querySelector('.notif-panel');
const items = () => [...header.querySelectorAll('.notif-item')];

test('mounts one bell inside the header with the unread count showing', async () => {
  await mount();
  assert.equal(header.querySelectorAll('#notif-menu').length, 1);
  assert.equal(button().getAttribute('aria-label'), 'Notifications');
  assert.equal(count().hidden, false);
  assert.equal(text(count()), '2');
});

test('the count hides at zero and when the counters document does not exist', async () => {
  await mount();
  await fs.setDoc(fs.doc(fs.db, 'users', 'c1', 'meta', 'counters'), { unread: 0 });
  await settle();
  assert.equal(count().hidden, true);

  const { 'users/c1/meta/counters': _, ...noCounters } = seed();
  await mount(noCounters);
  assert.equal(count().hidden, true);
});

test('the count follows the counters document live', async () => {
  await mount();
  await fs.setDoc(fs.doc(fs.db, 'users', 'c1', 'meta', 'counters'), { unread: 7 });
  await settle();
  assert.equal(text(count()), '7');
  assert.equal(count().hidden, false);
});

test('lists newest first with title, body, relative time and an unread marker', async () => {
  await mount();
  assert.deepEqual(items().map(i => i.dataset.id), ['n3', 'n2', 'n1']);
  const [newest, middle, oldest] = items();
  assert.equal(text(newest.querySelector('.notif-title')), 'Your account is approved');
  assert.match(text(newest.querySelector('.notif-body')), /you scored 8 \/ 10 \(80%\)/);
  assert.equal(text(newest.querySelector('.notif-time')), '5 minutes ago');
  assert.equal(text(middle.querySelector('.notif-time')), '1 hour ago');
  assert.ok(newest.classList.contains('unread'));
  assert.ok(!oldest.classList.contains('unread'));
  assert.equal(header.querySelector('.notif-item[data-id="n9"]'), null, "another user's inbox never shows");
});

test('shows at most ten, the newest ten', async () => {
  const many = { 'users/c1/meta/counters': { unread: 12 } };
  for (let i = 0; i < 12; i++) many[`users/c1/inbox/m${i}`] = notif(`Item ${i}`, minutesAgo(i));
  await mount(many);
  assert.equal(items().length, 10);
  assert.equal(text(items()[0].querySelector('.notif-title')), 'Item 0');
  assert.equal(text(items()[9].querySelector('.notif-title')), 'Item 9');
});

test('the panel opens on the bell, closes on an outside click, and reports its state', async () => {
  await mount();
  assert.equal(panel().classList.contains('show'), false);
  assert.equal(button().getAttribute('aria-expanded'), 'false');

  click(button());
  assert.equal(panel().classList.contains('show'), true);
  assert.equal(button().getAttribute('aria-expanded'), 'true');

  click(panel());
  assert.equal(panel().classList.contains('show'), true, 'a click inside the panel keeps it open');

  click(dom.document.body);
  assert.equal(panel().classList.contains('show'), false);
  assert.equal(button().getAttribute('aria-expanded'), 'false');

  click(button());
  click(button());
  assert.equal(panel().classList.contains('show'), false, 'the bell toggles');
});

test('clicking an unread row marks it read, then follows its link', async () => {
  await mount();
  click(button());
  click(items()[0]);
  await settle();

  assert.deepEqual(fs.writes, [{ type: 'update', path: 'users/c1/inbox/n3', data: { read: true } }]);
  assert.deepEqual(navigations, ['admin.html#/grade/x']);
  assert.equal(fs.get('users/c1/inbox/n3').read, true);
});

test('clicking a row that is already read only navigates', async () => {
  await mount();
  click(items()[2]);
  await settle();
  assert.deepEqual(fs.writes, []);
  assert.deepEqual(navigations, ['profile.html']);
});

test('a failed mark-read write still follows the link', async () => {
  await mount();
  repo.markRead = async () => { throw new Error('permission-denied'); };
  const errors = [];
  const original = console.error;
  console.error = (...args) => errors.push(args);
  try {
    click(items()[0]);
    await settle();
  } finally {
    console.error = original;
  }
  assert.deepEqual(navigations, ['admin.html#/grade/x']);
  assert.equal(errors.length, 1);
});

test('Mark all read writes one read-only update per unread row and the dots clear', async () => {
  await mount();
  click(header.querySelector('[data-action="mark-all"]'));
  await settle();

  assert.deepEqual(fs.writes.map(w => [w.type, w.path, w.data]), [
    ['update', 'users/c1/inbox/n3', { read: true }],
    ['update', 'users/c1/inbox/n2', { read: true }]
  ]);
  assert.equal(header.querySelectorAll('.notif-item.unread').length, 0);
  assert.deepEqual(navigations, []);

  click(header.querySelector('[data-action="mark-all"]'));
  await settle();
  assert.equal(fs.writes.length, 2, 'nothing unread, nothing written');
});

test('a notification arriving while open is added at the top', async () => {
  await mount();
  click(button());
  await fs.setDoc(fs.doc(fs.db, 'users', 'c1', 'inbox', 'n4'), notif('Brand new', NOW));
  await settle();
  assert.equal(items()[0].dataset.id, 'n4');
  assert.equal(text(items()[0].querySelector('.notif-time')), 'just now');
  assert.equal(panel().classList.contains('show'), true, 'a re-render does not close the panel');
});

test('titles and bodies render as text, never markup', async () => {
  await mount({
    'users/c1/inbox/x': notif('<img src=x onerror=alert(1)>', NOW, { body: '<b>bold</b>' })
  });
  assert.equal(header.querySelector('img, b'), null);
  assert.equal(text(items()[0].querySelector('.notif-title')), '<img src=x onerror=alert(1)>');
  assert.equal(text(items()[0].querySelector('.notif-body')), '<b>bold</b>');
});

test('an empty inbox shows the empty state and no Mark all read', async () => {
  await mount({});
  assert.equal(items().length, 0);
  assert.equal(text(panel().querySelector('.notif-empty')), 'Nothing new.');
  assert.equal(header.querySelector('[data-action="mark-all"]'), null);
});

test('dispose drops both listeners, removes the bell and stops listening to the document', async () => {
  await mount();
  assert.equal(fs.listenerCount(), 2);
  bell.dispose();
  assert.equal(fs.listenerCount(), 0);
  assert.equal(header.querySelector('#notif-menu'), null);
  click(dom.document.body);
  await fs.setDoc(fs.doc(fs.db, 'users', 'c1', 'inbox', 'late'), notif('Late', NOW));
  await settle();
  assert.equal(header.querySelector('#notif-menu'), null);
});

test('mounting twice replaces the first bell rather than adding a second', async () => {
  await mount();
  const second = mountBell(header, { uid: 'c1', repo, now: () => NOW, navigate: () => {} });
  await settle();
  assert.equal(header.querySelectorAll('#notif-menu').length, 1);
  assert.equal(fs.listenerCount(), 2);
  second.dispose();
  assert.equal(fs.listenerCount(), 0);
});
