// Writes content/ from the live site's files. --check writes nothing and fails if content/ is out of date.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from './lib/generate.mjs';

const SITE = fileURLToPath(new URL('../../', import.meta.url));
const CONTENT = join(SITE, 'content');
const check = process.argv.includes('--check');

function onDisk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? onDisk(full) : [relative(SITE, full).split('\\').join('/')];
  });
}

const files = await generate(SITE);
const stale = onDisk(CONTENT).filter(path => !files.has(path));
const changed = [...files].filter(([path, body]) => !existsSync(join(SITE, path)) || readFileSync(join(SITE, path), 'utf8') !== body);

if (check) {
  if (changed.length || stale.length) {
    for (const [path] of changed) console.error(`out of date: ${path}`);
    for (const path of stale) console.error(`no longer generated: ${path}`);
    console.error('Run npm run extract and commit content/.');
    process.exit(1);
  }
  console.log(`content/ is up to date (${files.size} files).`);
} else {
  for (const path of stale) rmSync(join(SITE, path));
  for (const [path, body] of changed) {
    mkdirSync(dirname(join(SITE, path)), { recursive: true });
    writeFileSync(join(SITE, path), body);
  }
  console.log(`Wrote ${changed.length} of ${files.size} files, removed ${stale.length}.`);
}
