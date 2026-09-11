import { courseMetadata } from '../course-metadata.js';
import { submissionId, parseLegacyKey } from './submissions.js';
import { fullName } from './format.js';

export const normaliseEmail = email => (email || '').trim().toLowerCase();

const num = value => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const parseDate = value => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function rowToSubmission({ uid, user, key, result, now }) {
  const parsed = parseLegacyKey(key);
  if (!parsed) return null;
  const course = courseMetadata[parsed.courseId];
  const score = num(result.score);
  const total = num(result.total);
  const graded = score !== null;
  const submittedAt = parseDate(result.submittedAt);
  return {
    id: submissionId(uid, key, 1),
    note: course ? '' : `unknown course ${parsed.courseId}`,
    doc: {
      kind: 'test',
      studentUid: uid,
      studentName: fullName(user),
      studentEmail: normaliseEmail(user.email),
      courseId: parsed.courseId,
      courseName: course?.name || parsed.courseId,
      itemId: key,
      itemTitle: parsed.itemTitle,
      legacyKey: key,
      legacy: true,
      attempt: 1,
      status: graded ? 'graded' : 'needs_grading',
      answers: result.answers || {},
      autoScore: null,
      manualScore: score,
      totalMax: total !== null && total > 0 ? total : null,
      totalScore: null,
      passed: null,
      provisional: false,
      feedback: '',
      submittedAt: submittedAt || parseDate(result.gradedAt) || now,
      submittedAtEstimated: !submittedAt,
      gradedAt: graded ? parseDate(result.gradedAt) : null,
      gradedBy: graded ? result.gradedBy || null : null,
      createdAt: now,
      updatedAt: now
    }
  };
}

export function planMigration({ users, testResults, existingIds, now }) {
  const byEmail = new Map();
  for (const user of users) {
    const email = normaliseEmail(user.email);
    if (email) byEmail.set(email, [...(byEmail.get(email) || []), user]);
  }
  const existing = new Set(existingIds);
  const claimed = new Map();
  const creates = [], skipped = [], orphans = [], conflicts = [];

  for (const { email: rawEmail, results } of testResults) {
    const email = normaliseEmail(rawEmail);
    const matches = byEmail.get(email) || [];
    if (matches.length !== 1) {
      orphans.push({
        email,
        reason: matches.length ? 'ambiguous' : 'no-user',
        candidates: matches.map(u => u.uid),
        keys: Object.keys(results || {}),
        data: results || {}
      });
      continue;
    }
    const user = matches[0];
    for (const [key, result] of Object.entries(results || {})) {
      const built = rowToSubmission({ uid: user.uid, user, key, result, now });
      if (!built) {
        skipped.push({ id: '', email, uid: user.uid, key, note: 'unparseable key' });
        continue;
      }
      const row = { id: built.id, email, uid: user.uid, key, note: built.note };
      if (claimed.has(built.id)) {
        conflicts.push({ ...row, note: `conflicts with document ${claimed.get(built.id)}` });
      } else if (existing.has(built.id)) {
        claimed.set(built.id, rawEmail);
        skipped.push({ ...row, note: 'already migrated' });
      } else {
        claimed.set(built.id, rawEmail);
        creates.push({ ...row, doc: built.doc });
      }
    }
  }
  return { creates, skipped, orphans, conflicts };
}
