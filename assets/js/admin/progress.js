import { courseMetadata } from '../course-metadata.js';

const completedCount = progress =>
  Object.entries(progress).filter(([key, value]) => !key.startsWith('_') && value === true).length;

const totalFor = (courseId, progress) => progress._total || courseMetadata[courseId].totalItems;

const hasNoScore = result => result?.score === null || result?.score === undefined || result?.score === '';

export function calculateOverallProgress(student) {
  let completed = 0;
  let total = 0;
  for (const [courseId, progress] of Object.entries(student.courses || {})) {
    if (!courseMetadata[courseId]) continue;
    completed += completedCount(progress);
    total += totalFor(courseId, progress);
  }
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

export function countUngradedTests(courseId, testResults) {
  if (!courseId || !testResults) return 0;
  const prefix = `${courseId}_`;
  return Object.entries(testResults).filter(([key, result]) => key.startsWith(prefix) && hasNoScore(result)).length;
}

// Ungraded tests count as incomplete until an admin scores them.
export function courseSummaries(student, testResults = {}) {
  const summary = { started: 0, completed: 0, tasks: 0, courses: [] };
  for (const [id, progress] of Object.entries(student.courses || {})) {
    const meta = courseMetadata[id];
    if (!meta) continue;
    const done = completedCount(progress);
    if (done === 0) continue;
    const total = totalFor(id, progress);
    const ungradedTests = countUngradedTests(id, testResults);
    const completed = Math.max(0, done - ungradedTests);
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    summary.started++;
    summary.tasks += completed;
    if (pct >= 100) summary.completed++;
    summary.courses.push({ id, name: meta.name, completed, total, pct, ungradedTests });
  }
  summary.courses.sort((a, b) => (a.pct >= 100) - (b.pct >= 100) || b.pct - a.pct);
  return summary;
}

export function dashboardStats(students) {
  const current = students.filter(s => s.status === 'approved' && s.studentType === 'current');
  let activeCourses = 0;
  let certificates = 0;
  for (const student of current) {
    activeCourses += Object.values(student.courses || {}).filter(progress => completedCount(progress) > 0).length;
    certificates += (student.certificates || []).length;
  }
  return {
    current: current.length,
    pending: students.filter(s => s.status === 'pending').length,
    activeCourses,
    certificates
  };
}
