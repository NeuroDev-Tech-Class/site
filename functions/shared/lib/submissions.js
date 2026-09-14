import { deriveTotals, percent } from './grade.js';

export const UNGRADED_STATUSES = ['submitted', 'needs_grading'];

export const submissionId = (uid, itemId, attempt = 1) => `${uid}__${itemId}__${attempt}`;

const titleCase = text => text.replace(/[-_]+/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

// Legacy testResults keys are "courseId_unitKey"; course ids contain only hyphens.
export function parseLegacyKey(key) {
  const i = key.indexOf('_');
  if (i < 1 || i === key.length - 1) return null;
  const unitKey = key.slice(i + 1);
  return { courseId: key.slice(0, i), unitKey, itemTitle: titleCase(unitKey) };
}

export const isUngraded = sub => UNGRADED_STATUSES.includes(sub?.status);

const hasNumber = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));

export function statusLabel(sub) {
  switch (sub?.status) {
    case 'graded': {
      const passed = sub.passed ?? deriveTotals(sub).passed;
      return passed === true ? 'Passed' : passed === false ? 'Not passed' : 'Graded';
    }
    case 'auto_graded': return 'Graded (provisional)';
    case 'returned': return 'Needs revision';
    case 'draft': return 'Draft';
    default: return 'Waiting for grading';
  }
}

export function scoreLabel(sub) {
  if (sub?.status !== 'graded') return 'Not graded';
  const totalScore = hasNumber(sub.totalScore) ? Number(sub.totalScore) : deriveTotals(sub).totalScore;
  if (totalScore === null) return 'Not graded';
  const max = hasNumber(sub.totalMax) && Number(sub.totalMax) > 0 ? Number(sub.totalMax) : null;
  return max === null ? `${totalScore} pts` : `${totalScore} / ${max} (${percent(totalScore, max)}%)`;
}
