import { createFakeFirestore } from './fake-firestore.js';
import { usersRepo } from '../../assets/js/data/users.js';
import { submissionsRepo } from '../../assets/js/data/submissions.js';
import { mailRepo } from '../../assets/js/data/mail.js';
import { createStore } from '../../assets/js/admin/store.js';

export const NOW = new Date('2026-09-10T15:00:00Z');

export const seed = () => ({
  'users/p1': {
    firstName: 'pat', lastName: 'pending', email: 'pat@x.com', role: 'student', status: 'pending',
    studentType: 'current', createdAt: '2026-08-01T12:00:00.000Z'
  },
  'users/c1': {
    firstName: 'cee', lastName: 'current', email: 'cee@x.com', role: 'student', status: 'approved',
    studentType: 'current',
    courses: { 'python-1': { '0-0': true, '0-1': true, '0-2': false, _total: 4 } },
    certificates: [{ courseId: 'linux', courseName: 'Introduction to Linux', awardedAt: '2026-05-02T12:00:00.000Z' }]
  },
  'users/c2': {
    firstName: '<img src=x onerror=1>', lastName: 'evil', email: 'evil@x.com', role: 'student',
    status: 'approved', studentType: 'current'
  },
  'users/o1': {
    firstName: 'old', lastName: 'one', email: 'old@x.com', role: 'student', status: 'approved',
    studentType: 'old', certificates: [{ courseId: 'gimp', courseName: '2D Digital Art - GIMP', awardedAt: '2026-09-05T12:00:00.000Z' }]
  },
  'users/a1': {
    firstName: 'ada', lastName: 'admin', email: 'ada@x.com', role: 'admin', status: 'approved',
    studentType: 'current', createdAt: '2026-07-01T12:00:00.000Z'
  },
  'submissions/c1__python-1_unit-1-test__1': {
    kind: 'test', studentUid: 'c1', studentName: 'Cee Current', studentEmail: 'cee@x.com',
    courseId: 'python-1', courseName: 'Python I - Programming Fundamentals',
    itemId: 'python-1_unit-1-test', itemTitle: 'Unit 1 Test', legacyKey: 'python-1_unit-1-test', legacy: true, attempt: 1,
    status: 'graded', answers: { 'What is a list?': '<b>bold</b>', 'Second question': 'Second answer' },
    autoScore: null, manualScore: 8, totalMax: 10, totalScore: 8, passed: true, provisional: false,
    feedback: 'Nice work.', submittedAt: '2026-06-01T12:00:00.000Z', submittedAtEstimated: false,
    gradedAt: '2026-06-02T12:00:00.000Z', gradedBy: 'me', createdAt: '2026-06-01T12:00:00.000Z', updatedAt: '2026-06-02T12:00:00.000Z'
  },
  'submissions/c1__python-1_unit-2-test__1': {
    kind: 'test', studentUid: 'c1', studentName: 'Cee Current', studentEmail: 'cee@x.com',
    courseId: 'python-1', courseName: 'Python I - Programming Fundamentals',
    itemId: 'python-1_unit-2-test', itemTitle: 'Unit 2 Test', legacyKey: 'python-1_unit-2-test', legacy: true, attempt: 1,
    status: 'needs_grading', answers: {}, autoScore: null, manualScore: null, totalMax: 10,
    totalScore: null, passed: null, provisional: false, feedback: '',
    submittedAt: '2026-06-05T12:00:00.000Z', submittedAtEstimated: false,
    gradedAt: null, gradedBy: null, createdAt: '2026-06-05T12:00:00.000Z', updatedAt: '2026-06-05T12:00:00.000Z'
  },
  'submissions/c1__linux_unit-1-test__1': {
    kind: 'test', studentUid: 'c1', studentName: 'Cee Current', studentEmail: 'cee@x.com',
    courseId: 'linux', courseName: 'Introduction to Linux',
    itemId: 'linux_unit-1-test', itemTitle: 'Unit 1 Test', legacyKey: 'linux_unit-1-test', legacy: true, attempt: 1,
    status: 'graded', answers: {}, autoScore: null, manualScore: 5, totalMax: 5,
    totalScore: 5, passed: true, provisional: false, feedback: '',
    submittedAt: '2026-04-01T12:00:00.000Z', submittedAtEstimated: false,
    gradedAt: '2026-04-02T12:00:00.000Z', gradedBy: 'me', createdAt: '2026-04-01T12:00:00.000Z', updatedAt: '2026-04-02T12:00:00.000Z'
  },
  'submissions/c2__python-1_unit-1-test__1': {
    kind: 'test', studentUid: 'c2', studentName: '<img src=x onerror=1> Evil', studentEmail: 'evil@x.com',
    courseId: 'python-1', courseName: 'Python I - Programming Fundamentals',
    itemId: 'python-1_unit-1-test', itemTitle: 'Unit 1 Test', legacyKey: 'python-1_unit-1-test', legacy: true, attempt: 1,
    status: 'needs_grading', answers: { 'What is a list?': '<img src=x onerror=1>' },
    autoScore: null, manualScore: null, totalMax: null, totalScore: null, passed: null, provisional: false,
    feedback: '', submittedAt: '2026-06-03T12:00:00.000Z', submittedAtEstimated: true,
    gradedAt: null, gradedBy: null, createdAt: '2026-06-03T12:00:00.000Z', updatedAt: '2026-06-03T12:00:00.000Z'
  }
});

export function makeCtx({ role = 'admin', confirm = () => true, courseStructure = null, seed: seedOverride = null } = {}) {
  const fs = createFakeFirestore({ now: NOW, seed: seedOverride || seed() });
  const calls = { navigate: [], alerts: [], confirms: [], downloads: [], certificates: [] };
  const ctx = {
    me: { id: 'me', firstName: 'coach', lastName: 'x', email: 'coach@x.com', role, status: 'approved' },
    currentUid: 'me',
    users: usersRepo(fs),
    submissions: submissionsRepo(fs),
    mail: mailRepo(fs),
    store: createStore(),
    navigate: path => calls.navigate.push(path),
    confirm: message => { calls.confirms.push(message); return confirm(message); },
    alert: message => calls.alerts.push(message),
    generateCertificate: async (studentName, courseName, date) => {
      calls.certificates.push([studentName, courseName, date]);
      return btoa('docx-bytes');
    },
    download: (fileName, bytes) => calls.downloads.push([fileName, bytes]),
    fetchCourseStructure: async () => courseStructure,
    now: () => new Date(NOW)
  };
  return { fs, ctx, calls };
}
