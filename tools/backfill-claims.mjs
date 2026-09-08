// One-time: copy role and status from every users/{uid} document into custom auth claims.
// Usage: GOOGLE_APPLICATION_CREDENTIALS=~/keys/github-deploy.json \
//        node tools/backfill-claims.mjs --project tech-certificates-af7c3 [--dry-run]
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { syncClaims } from '../functions/lib/claims.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const projectFlag = args.indexOf('--project');
const projectId = projectFlag >= 0 ? args[projectFlag + 1] : args.find(a => a.startsWith('--project='))?.split('=')[1];

if (!projectId) {
  console.error('usage: node tools/backfill-claims.mjs --project <projectId> [--dry-run]');
  process.exit(2);
}

initializeApp({ credential: applicationDefault(), projectId });
const auth = getAuth();
const db = getFirestore();

const snap = await db.collection('users').get();
const rows = [];
let invalid = 0;

for (const d of snap.docs) {
  const data = d.data();
  const valid = typeof data.role === 'string' && typeof data.status === 'string';
  if (!valid) invalid++;
  const result = valid
    ? await syncClaims(auth, d.id, data, { dryRun })
    : { changed: false, reason: 'missing role or status' };
  rows.push({
    uid: d.id,
    email: data.email || '',
    role: data.role ?? '',
    status: data.status ?? '',
    changed: result.changed ? 'yes' : 'no',
    note: result.reason || ''
  });
}

console.table(rows);
const changed = rows.filter(r => r.changed === 'yes').length;
console.log(`${rows.length} users, ${changed} ${dryRun ? 'would change' : 'changed'}, ${invalid} invalid`);
process.exit(invalid ? 1 : 0);
