import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom, click, text, settle } from '../helpers/dom.js';
import { makeCtx, NOW } from '../helpers/admin-ctx.js';
import { studentDetailView } from '../../assets/js/admin/views/student-detail.js';

let dom;
beforeEach(() => { dom = setupDom(); });

const stat = (id) => text(dom.root.querySelector(`#${id}`));

async function mount(uid = 'c1', options = {}) {
  const made = makeCtx(options);
  const view = studentDetailView.mount(dom.root, { params: { uid }, query: {} }, made.ctx);
  await view.ready;
  return { ...made, view };
}

test('renders the header, stats, course cards and certificates for the student', async () => {
  await mount();
  assert.equal(text(dom.root.querySelector('h1')), 'Cee Current');
  assert.equal(text(dom.root.querySelector('.student-view-header .dashboard-subtitle')), 'cee@x.com');
  assert.equal(stat('sv-courses-started'), '1');
  assert.equal(stat('sv-courses-completed'), '0');
  assert.equal(stat('sv-certs-earned'), '1');
  assert.equal(stat('sv-tasks-completed'), '1');
  const card = dom.root.querySelector('.course-card');
  assert.match(text(card), /Python I - Programming Fundamentals 1 \/ 4 tasks 1 test still need grading/);
  assert.equal(text(card.querySelector('.progress-text')), '25%');
  const cert = dom.root.querySelector('.certificate-card');
  assert.match(text(cert), /Introduction to Linux Awarded May 2, 2026/);
});

test('shows empty states when the student has no courses or certificates', async () => {
  await mount('c2');
  assert.match(text(dom.root.querySelector('#sv-courses-container')), /No courses started yet/);
  assert.match(text(dom.root.querySelector('#sv-certs-container')), /No certificates earned yet/);
  assert.equal(dom.root.querySelector('img'), null);
  assert.ok(text(dom.root.querySelector('h1')).includes('<img Src=x Onerror=1> Evil'));
});

const courseStructure = [
  { title: 'Unit 1 <Basics>', content: [
    { type: 'video', title: 'Intro video' },
    { type: 'html', html: '<p>Read <em>this</em> first</p>' },
    { url: 'https://docs.google.com/forms/d/x' }
  ] },
  { title: 'Unit 2', content: [{ url: 'https://docs.google.com/presentation/d/y', title: 'Slides' }] }
];

test('Show checklist fetches the structure once and renders the marked items', async () => {
  let fetches = 0;
  const made = makeCtx();
  made.ctx.fetchCourseStructure = async () => { fetches++; return courseStructure; };
  const view = studentDetailView.mount(dom.root, { params: { uid: 'c1' }, query: {} }, made.ctx);
  await view.ready;

  const toggle = dom.root.querySelector('[data-action="toggle-checklist"]');
  assert.equal(text(toggle), 'Show checklist');
  click(toggle);
  await settle();
  const items = [...dom.root.querySelectorAll('.checklist-item')];
  assert.deepEqual(items.map(i => text(i.querySelector('.checklist-status'))), ['✓', '✓', '○', '○']);
  assert.deepEqual(items.map(i => text(i.querySelector('.checklist-type-badge'))), ['Video', 'Reading', 'Test', 'Slides']);
  assert.deepEqual(items.map(i => text(i.querySelector('.checklist-title'))), ['Intro video', 'Read this first', 'Untitled Task', 'Slides']);
  assert.equal(text(dom.root.querySelector('.checklist-unit h3')), 'Unit 1 <Basics>');
  assert.equal(dom.root.querySelector('.checklist-unit h3 em'), null);
  assert.equal(text(dom.root.querySelector('[data-action="toggle-checklist"]')), 'Hide checklist');

  click(dom.root.querySelector('[data-action="toggle-checklist"]'));
  await settle();
  assert.equal(dom.root.querySelector('[data-checklist]').hidden, true);
  click(dom.root.querySelector('[data-action="toggle-checklist"]'));
  await settle();
  assert.equal(dom.root.querySelector('[data-checklist]').hidden, false);
  assert.equal(fetches, 1);
});

test('the back button returns to the remembered tab', async () => {
  const { ctx, calls } = await mount();
  ctx.store.tab = 'old';
  click(dom.root.querySelector('[data-action="back"]'));
  assert.deepEqual(calls.navigate, ['#/students?tab=old']);
});

test('the Submissions table lists work newest first and opens the grade screen', async () => {
  const { calls } = await mount();
  const rows = [...dom.root.querySelectorAll('#sv-submissions tr[data-id]')];
  assert.deepEqual(rows.map(r => r.dataset.id), [
    'c1__python-1_unit-2-test__1', 'c1__python-1_unit-1-test__1', 'c1__linux_unit-1-test__1'
  ]);
  assert.match(text(rows[0]), /Unit 2 Test/);
  assert.match(text(rows[0]), /Waiting for grading/);
  assert.match(text(rows[0]), /Not graded/);
  assert.match(text(rows[1]), /Jun 1, 2026/);
  assert.match(text(rows[1]), /Passed/);
  assert.match(text(rows[1]), /8 \/ 10 \(80%\)/);
  assert.match(text(rows[2]), /Introduction to Linux/);
  click(rows[1].querySelector('td'));
  assert.equal(calls.navigate.at(-1), '#/grade/c1__python-1_unit-1-test__1');
});

test('a student with no submissions sees the empty state', async () => {
  await mount('o1');
  assert.match(text(dom.root.querySelector('#sv-submissions')), /No work submitted yet/);
});

test('a missing student sends the admin back to the list', async () => {
  const { calls } = await mount('nobody');
  assert.deepEqual(calls.navigate, ['#/students']);
});

test('the student loaded here replaces the stale cached copy used by the list', async () => {
  const made = makeCtx();
  made.ctx.store.students = [{ id: 'c1', firstName: 'stale', lastName: 'copy', email: 'stale@x.com' }, { id: 'o1' }];
  await studentDetailView.mount(dom.root, { params: { uid: 'c1' }, query: {} }, made.ctx).ready;
  assert.deepEqual(made.ctx.store.students.map(s => s.email), ['cee@x.com', undefined]);
});

test('award requires a course and refuses a duplicate', async () => {
  const { fs, calls } = await mount();
  click(dom.root.querySelector('[data-action="award"]'));
  await settle();
  dom.root.querySelector('#sv-cert-select').value = 'linux';
  click(dom.root.querySelector('[data-action="award"]'));
  await settle();
  assert.deepEqual(calls.alerts, ['Please select a course.', 'This student already has a certificate for this course.']);
  assert.deepEqual(fs.writes, []);
});

test('award stores the certificate, generates the docx, queues the email and re-renders', async () => {
  const { fs, calls } = await mount();
  dom.root.querySelector('#sv-cert-select').value = 'gimp';
  click(dom.root.querySelector('[data-action="award"]'));
  await settle();

  const certs = fs.get('users/c1').certificates;
  assert.equal(certs.length, 2);
  assert.deepEqual(certs[1],
    { courseId: 'gimp', courseName: '2D Digital Art - GIMP', awardedAt: NOW.toISOString(), awardedBy: 'me' });
  assert.deepEqual(calls.certificates, [['Cee Current', '2D Digital Art - GIMP', NOW]]);

  const mail = fs.writes.find(w => w.type === 'add' && w.path.startsWith('mail/')).data;
  assert.equal(mail.to, 'cee@x.com');
  assert.equal(mail.message.subject, 'Your NeuroDev Certificate — 2D Digital Art - GIMP');
  assert.deepEqual(mail.message.attachments, [{
    filename: 'NeuroDev-2D_Digital_Art_-_GIMP-Cee_Current.docx', content: btoa('docx-bytes'), encoding: 'base64'
  }]);
  assert.deepEqual(calls.alerts, ['Certificate awarded for 2D Digital Art - GIMP! An email has been sent to cee@x.com.']);
  assert.equal(dom.root.querySelectorAll('.certificate-card').length, 2);
  assert.equal(stat('sv-certs-earned'), '2');
  assert.equal(dom.root.querySelector('#sv-cert-select').value, '');
});

test('download builds the docx for that certificate and hands it to the downloader', async () => {
  const { calls } = await mount();
  click(dom.root.querySelector('[data-action="download-cert"][data-index="0"]'));
  await settle();
  assert.deepEqual(calls.certificates, [['Cee Current', 'Introduction to Linux', new Date('2026-05-02T12:00:00.000Z')]]);
  assert.equal(calls.downloads.length, 1);
  const [fileName, bytes] = calls.downloads[0];
  assert.equal(fileName, 'NeuroDev-Introduction_to_Linux-Cee_Current.docx');
  assert.equal(new TextDecoder().decode(bytes), 'docx-bytes');
  assert.equal(text(dom.root.querySelector('[data-action="download-cert"]')), 'Download / Print');
});
