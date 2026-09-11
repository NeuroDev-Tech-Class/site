// Shared by the browser and onSubmissionWrite (copied to functions/shared by sync-shared).
export const PASS_THRESHOLD = 70;

const num = value => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export function percent(score, max) {
  const s = num(score);
  const m = num(max);
  if (s === null || m === null || m <= 0) return null;
  return Math.round((s / m) * 100);
}

// Never includes a timestamp: the function compares this with what is stored to stop re-triggering.
export function deriveTotals({ autoScore, manualScore, totalMax } = {}) {
  const auto = num(autoScore);
  const manual = num(manualScore);
  const totalScore = auto === null && manual === null ? null : (auto || 0) + (manual || 0);
  const pct = percent(totalScore, totalMax);
  return { totalScore, passed: pct === null ? null : pct >= PASS_THRESHOLD, provisional: false };
}

export function sameDerived(a = {}, b = {}) {
  return ['totalScore', 'passed', 'provisional'].every(key => (a[key] ?? null) === (b[key] ?? null));
}
