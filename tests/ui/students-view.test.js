import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom, click, keydown, text, settle } from '../helpers/dom.js';
import { makeCtx } from '../helpers/admin-ctx.js';
import { studentsView } from '../../assets/js/admin/views/students.js';

let dom;
beforeEach(() => { dom = setupDom(); });

const rows = (tab) => [...dom.root.querySelectorAll(`#${tab}-tab tbody tr[data-id]`)];
const ids = (tab) => rows(tab).map(r => r.dataset.id);
const activeTab = () => dom.root.querySelector('.admin-tab.active')?.dataset.tab;
const stat = (id) => text(dom.root.querySelector(`#${id}`));

async function mount(options = {}, route = { params: {}, query: {} }) {
  const made = makeCtx(options);
  const view = studentsView.mount(dom.root, route, made.ctx);
  await view.ready;
  return { ...made, view };
}

test('renders the stats and the three student tables from the users collection', async () => {
  await mount();
  assert.equal(stat('total-students'), '2');
  assert.equal(stat('pending-count'), '1');
  assert.equal(stat('courses-progress'), '1');
  assert.equal(stat('certs-awarded'), '1');
  assert.deepEqual(ids('pending'), ['p1']);
  assert.deepEqual(ids('current').sort(), ['c1', 'c2']);
  assert.deepEqual(ids('old'), ['o1']);
  assert.equal(activeTab(), 'current');
  assert.match(text(rows('pending')[0]), /Pat Pending pat@x\.com Aug 1, 2026/);
  assert.match(text(rows('current').find(r => r.dataset.id === 'c1')), /50% overall 1 certificate/);
  assert.equal(text(dom.root.querySelector('#welcome-message')), 'Manage your students');
});

test('student names from Firestore are rendered as text, never markup', async () => {
  await mount();
  assert.equal(dom.root.querySelector('img'), null);
  assert.ok(dom.root.textContent.includes('<img Src=x Onerror=1> Evil'));
});

test('approve writes the status and moves the student to the current table', async () => {
  const { fs } = await mount();
  click(dom.root.querySelector('[data-action="approve"][data-id="p1"]'));
  await settle();
  assert.equal(fs.get('users/p1').status, 'approved');
  assert.deepEqual(ids('pending'), []);
  assert.ok(ids('current').includes('p1'));
  assert.equal(stat('pending-count'), '0');
  assert.equal(stat('total-students'), '3');
});

test('deny asks for confirmation and deletes the document only when confirmed', async () => {
  const declined = await mount({ confirm: () => false });
  click(dom.root.querySelector('[data-action="deny"][data-id="p1"]'));
  await settle();
  assert.equal(declined.fs.has('users/p1'), true);
  assert.equal(declined.calls.confirms.length, 1);

  dom = setupDom();
  const accepted = await mount();
  click(dom.root.querySelector('[data-action="deny"][data-id="p1"]'));
  await settle();
  assert.equal(accepted.fs.has('users/p1'), false);
  assert.deepEqual(ids('pending'), []);
});

test('clicking a row or pressing Enter on it navigates to the student route', async () => {
  const { calls } = await mount();
  click(rows('current').find(r => r.dataset.id === 'c1').querySelector('td'));
  keydown(rows('old')[0], 'Enter');
  keydown(rows('old')[0], 'x');
  assert.deepEqual(calls.navigate, ['#/students/c1', '#/students/o1']);
});

test('the move buttons change studentType without opening the student', async () => {
  const { fs, calls } = await mount();
  click(dom.root.querySelector('[data-action="toggle-type"][data-id="c1"]'));
  await settle();
  assert.equal(fs.get('users/c1').studentType, 'old');
  assert.ok(ids('old').includes('c1'));
  click(dom.root.querySelector('[data-action="toggle-type"][data-id="o1"]'));
  await settle();
  assert.equal(fs.get('users/o1').studentType, 'current');
  assert.ok(ids('current').includes('o1'));
  assert.deepEqual(calls.navigate, []);
});

test('delete on the old tab confirms then removes the student', async () => {
  const { fs, calls } = await mount();
  click(dom.root.querySelector('[data-action="delete"][data-id="o1"]'));
  await settle();
  assert.match(calls.confirms[0], /Old One/);
  assert.equal(fs.has('users/o1'), false);
  assert.deepEqual(ids('old'), []);
});

test('tabs switch the visible panel, remember the choice and rewrite the hash without navigating', async () => {
  const { ctx, calls } = await mount();
  click(dom.root.querySelector('.admin-tab[data-tab="old"]'));
  assert.equal(activeTab(), 'old');
  assert.ok(dom.root.querySelector('#old-tab').classList.contains('active'));
  assert.equal(dom.root.querySelector('#current-tab').classList.contains('active'), false);
  assert.equal(ctx.store.tab, 'old');
  assert.equal(dom.window.location.hash, '#/students?tab=old');
  assert.deepEqual(calls.navigate, []);
});

test('a tab in the query string is selected on mount', async () => {
  await mount({}, { params: {}, query: { tab: 'pending' } });
  assert.equal(activeTab(), 'pending');
});

test('the admins tab does not exist for a plain admin', async () => {
  await mount({ role: 'admin' });
  assert.equal(dom.root.querySelector('.admin-tab[data-tab="admins"]'), null);
  assert.equal(dom.root.querySelector('#admins-tab'), null);
});

test('a superadmin sees the admins tab, the greeting and the current admins', async () => {
  await mount({ role: 'superadmin' });
  assert.equal(text(dom.root.querySelector('#welcome-message')), 'Super Admin — Coach X');
  assert.ok(dom.root.querySelector('.admin-tab[data-tab="admins"]'));
  assert.deepEqual(ids('admins'), ['a1']);
  assert.match(text(rows('admins')[0]), /Ada Admin ada@x\.com Jul 1, 2026/);
});

test('promoting from the add-admin modal writes the role and moves the student between tables', async () => {
  const { fs, calls } = await mount({ role: 'superadmin' });
  click(dom.root.querySelector('[data-action="open-add-admin"]'));
  const modal = dom.root.querySelector('#add-admin-modal');
  assert.ok(modal.classList.contains('show'));
  assert.deepEqual([...modal.querySelectorAll('[data-action="promote"]')].map(b => b.dataset.id).sort(), ['c1', 'c2']);
  click(modal.querySelector('[data-action="promote"][data-id="c1"]'));
  await settle();
  assert.match(calls.confirms[0], /Promote Cee Current to admin/);
  assert.equal(fs.get('users/c1').role, 'admin');
  assert.deepEqual(ids('current'), ['c2']);
  assert.deepEqual(ids('admins').sort(), ['a1', 'c1']);
  assert.deepEqual([...modal.querySelectorAll('[data-action="promote"]')].map(b => b.dataset.id), ['c2']);
  click(modal.querySelector('[data-action="close-add-admin"]'));
  assert.equal(modal.classList.contains('show'), false);
});

test('removing an admin restores a student record and puts them back in the current table', async () => {
  const { fs } = await mount({ role: 'superadmin' });
  click(dom.root.querySelector('[data-action="remove-admin"][data-id="a1"]'));
  await settle();
  assert.deepEqual(fs.writes.at(-1).data, { role: 'student', status: 'approved', studentType: 'current' });
  assert.deepEqual(ids('admins'), []);
  assert.ok(ids('current').includes('a1'));
});

test('a failed write reports the problem and leaves the tables unchanged', async () => {
  const { ctx, calls } = await mount();
  ctx.users.approve = async () => { throw new Error('boom'); };
  click(dom.root.querySelector('[data-action="approve"][data-id="p1"]'));
  await settle();
  assert.deepEqual(calls.alerts, ['Failed to approve student. Please try again.']);
  assert.deepEqual(ids('pending'), ['p1']);
});

test('dispose stops the view from reacting to clicks', async () => {
  const { view, fs } = await mount();
  view.dispose();
  click(dom.root.querySelector('[data-action="approve"][data-id="p1"]'));
  await settle();
  assert.equal(fs.get('users/p1').status, 'pending');
});
