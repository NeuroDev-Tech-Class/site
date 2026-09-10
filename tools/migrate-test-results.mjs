// One-time: turn legacy testResults/{email} rows into submissions/{uid}__{key}__1 documents.
// Usage: GOOGLE_APPLICATION_CREDENTIALS=~/keys/github-deploy.json \
//        node tools/migrate-test-results.mjs --project tech-certificates-af7c3 [--dry-run] [--strict]
// Rerunnable: existing ids are skipped, and create() never overwrites a grade made after migration.
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { planMigration } from '../assets/js/lib/legacy-results.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const strict = args.includes('--strict');
const projectFlag = args.indexOf('--project');
const projectId = projectFlag >= 0 ? args[projectFlag + 1] : args.find(a => a.startsWith('--project='))?.split('=')[1];

if (!projectId) {
  console.error('usage: node tools/migrate-test-results.mjs --project <projectId> [--dry-run] [--strict]');
  process.exit(2);
}

initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();

const [userSnap, resultSnap, existingSnap] = await Promise.all([
  db.collection('users').get(),
  db.collection('testResults').get(),
  db.collection('submissions').select().get()
]);

const plan = planMigration({
  users: userSnap.docs.map(d => ({ uid: d.id, ...d.data() })),
  testResults: resultSnap.docs.map(d => ({ email: d.id, results: d.data() })),
  existingIds: existingSnap.docs.map(d => d.id),
  now: new Date()
});

const rows = [];
const tableRow = (entry, action, extra = '') => ({
  email: entry.email, uid: entry.uid || '', key: entry.key || (entry.keys || []).join(' '),
  action, status: entry.doc?.status || '', score: entry.doc?.manualScore ?? '',
  note: [entry.note, extra].filter(Boolean).join('; ')
});

let created = 0, failed = 0, raced = 0;
for (const entry of plan.creates) {
  let action = dryRun ? 'create' : 'created';
  let extra = '';
  if (!dryRun) {
    try {
      await db.doc(`submissions/${entry.id}`).create(entry.doc);
      created++;
    } catch (err) {
      if (err.code === 6) { action = 'skip'; extra = 'already exists'; raced++; }
      else { action = 'failed'; extra = err.message; failed++; }
    }
  }
  rows.push(tableRow(entry, action, extra));
}
for (const entry of plan.skipped) rows.push(tableRow(entry, 'skip'));
for (const entry of plan.conflicts) rows.push(tableRow(entry, 'conflict'));
for (const orphan of plan.orphans) {
  let extra = orphan.reason === 'ambiguous' ? `candidates: ${orphan.candidates.join(' ')}` : '';
  if (!dryRun) {
    try {
      await db.doc(`legacyOrphans/${orphan.email}`).set({
        reason: orphan.reason, candidates: orphan.candidates, keys: orphan.keys, data: orphan.data
      });
    } catch (err) {
      extra = `orphan write failed: ${err.message}`;
      failed++;
    }
  }
  rows.push(tableRow({ ...orphan, note: orphan.reason }, 'orphan', extra));
}

console.table(rows);
const skips = plan.skipped.length + raced;
console.log(
  `${resultSnap.size} testResults documents: ` +
  `${dryRun ? `${plan.creates.length} would create` : `${created} created`}, ` +
  `${skips} skipped, ${plan.orphans.length} orphans, ${plan.conflicts.length} conflicts, ${failed} failed` +
  `${dryRun ? ' (dry run, nothing written)' : ''}`
);
process.exit(failed ? 1 : strict && plan.orphans.length ? 3 : 0);
