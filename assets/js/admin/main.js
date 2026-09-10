import * as fs from '../firebase-config.js';
import { usersRepo } from '../data/users.js';
import { testResultsRepo } from '../data/test-results.js';
import { mailRepo } from '../data/mail.js';
import { isAdmin } from '../lib/format.js';
import { refreshTokenIfStale } from '../lib/claims-refresh.js';
import { createStore } from './store.js';
import { createRouter } from './router.js';
import { generateCertificateDocx } from './certificate-docx.js';
import { fetchCourseStructure } from './course-structure.js';
import { studentsView } from './views/students.js';
import { studentDetailView } from './views/student-detail.js';
import { testResultsView } from './views/test-results.js';

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

fs.onAuthStateChanged(fs.auth, async user => {
  if (!user) return leave();
  if (started) return;
  started = true;

  const users = usersRepo(fs);
  const me = await users.getUser(user.uid).catch(() => null);
  if (!isAdmin(me)) return leave();
  await refreshTokenIfStale(user, me);

  const ctx = {
    me,
    currentUid: user.uid,
    users,
    testResults: testResultsRepo(fs),
    mail: mailRepo(fs),
    store: createStore(),
    confirm: message => window.confirm(message),
    alert: message => window.alert(message),
    generateCertificate,
    download,
    fetchCourseStructure,
    now: () => new Date()
  };
  const routes = { students: studentsView, student: studentDetailView, results: testResultsView };
  createRouter({ window, root: document.getElementById('app'), routes, ctx }).start();
});
