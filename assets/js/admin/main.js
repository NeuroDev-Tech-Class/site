import * as fs from '../firebase-config.js';
import { usersRepo } from '../data/users.js';
import { submissionsRepo } from '../data/submissions.js';
import { mailRepo } from '../data/mail.js';
import { isAdmin } from '../lib/format.js';
import { refreshTokenIfStale } from '../lib/claims-refresh.js';
import { createStore } from './store.js';
import { createRouter } from './router.js';
import { mountNav } from './nav.js';
import { generateCertificateDocx } from './certificate-docx.js';
import { fetchCourseStructure } from './course-structure.js';
import { todayView } from './views/today.js';
import { queueView } from './views/queue.js';
import { gradeView } from './views/grade.js';
import { studentsView } from './views/students.js';
import { studentDetailView } from './views/student-detail.js';

const TEMPLATE_URL = 'assets/pdfs/Certificate-Template.docx';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

async function generateCertificate(studentName, courseName, date) {
  if (!window.JSZip) throw new Error('JSZip failed to load');
  const res = await fetch(TEMPLATE_URL);
  if (!res.ok) throw new Error('DOCX template not found');
  const templateBytes = await res.arrayBuffer();
  return generateCertificateDocx({ JSZip: window.JSZip, templateBytes }, studentName, courseName, date);
}

function download(fileName, bytes) {
  const url = URL.createObjectURL(new Blob([bytes], { type: DOCX_MIME }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const leave = () => { window.location.href = 'index.html'; };
let started = false;
let activeStore = null;

fs.onAuthStateChanged(fs.auth, async user => {
  if (!user) {
    activeStore?.disposeQueue();
    return leave();
  }
  if (started) return;
  started = true;

  const users = usersRepo(fs);
  const me = await users.getUser(user.uid).catch(() => null);
  if (!isAdmin(me)) return leave();
  await refreshTokenIfStale(user, me);

  const store = createStore();
  activeStore = store;
  const submissions = submissionsRepo(fs);

  const ctx = {
    me,
    currentUid: user.uid,
    users,
    submissions,
    mail: mailRepo(fs),
    store,
    confirm: message => window.confirm(message),
    alert: message => window.alert(message),
    generateCertificate,
    download,
    fetchCourseStructure,
    now: () => new Date()
  };

  store.subscribeQueue(submissions);
  const nav = mountNav(document.getElementById('admin-nav'), store);
  const routes = {
    today: todayView,
    queue: queueView,
    grade: gradeView,
    students: studentsView,
    student: studentDetailView
  };
  createRouter({
    window,
    root: document.getElementById('app'),
    routes,
    ctx,
    onRoute: nav.setRoute
  }).start();
});
