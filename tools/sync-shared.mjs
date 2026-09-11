// Copies browser modules the Cloud Functions also need into functions/shared.
// Deploy packages only functions/, so the copies are committed; the test suite checks for drift.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

export const SHARED_FILES = ['lib/escape-html.js', 'lib/html.js', 'lib/format.js', 'lib/grade.js', 'data/mail.js'];

export const sourcePath = rel => join(root, 'assets', 'js', rel);
export const targetPath = rel => join(root, 'functions', 'shared', rel);

function sync({ check }) {
  let drift = 0;
  for (const rel of SHARED_FILES) {
    const source = readFileSync(sourcePath(rel), 'utf8');
    const target = targetPath(rel);
    if (existsSync(target) && readFileSync(target, 'utf8') === source) continue;
    drift++;
    if (check) {
      console.error(`drift: ${rel}`);
      continue;
    }
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(sourcePath(rel), target);
    console.log(`synced ${rel}`);
  }
  if (check && drift) process.exit(1);
  if (!drift) console.log('functions/shared is up to date');
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) sync({ check: process.argv.includes('--check') });
