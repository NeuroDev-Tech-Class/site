import { createFakeFirestore } from './fake-firestore.js';
import { usersRepo } from '../../assets/js/data/users.js';
import { testResultsRepo } from '../../assets/js/data/test-results.js';
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
    studentType: 'old', certificates: []
  },
  'users/a1': {
    firstName: 'ada', lastName: 'admin', email: 'ada@x.com', role: 'admin', status: 'approved',
    studentType: 'current', createdAt: '2026-07-01T12:00:00.000Z'
  },
  'testResults/cee@x.com': {
    'python-1_unit-1-test': {
      score: 8, total: 10, submittedAt: '2026-06-01T12:00:00.000Z',
      answers: { 'What is a list?': '<b>bold</b>', 'Second question': 'Second answer' }
    },
    'python-1_unit-2-test': { score: null, total: 10, submittedAt: '2026-06-05T12:00:00.000Z', answers: {} },
    'linux_unit-1-test': { score: 5, total: 5, submittedAt: '2026-04-01T12:00:00.000Z' }
  }
});

export function makeCtx({ role = 'admin', confirm = () => true, courseStructure = null } = {}) {
  const fs = createFakeFirestore({ now: NOW, seed: seed() });
  const calls = { navigate: [], alerts: [], confirms: [], downloads: [], certificates: [] };
  const ctx = {
    me: { id: 'me', firstName: 'coach', lastName: 'x', email: 'coach@x.com', role, status: 'approved' },
    currentUid: 'me',
    users: usersRepo(fs),
    testResults: testResultsRepo(fs),
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
