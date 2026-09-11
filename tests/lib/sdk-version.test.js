import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = rel => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
const config = read('../../assets/js/firebase-config.js');
const installed = JSON.parse(read('../../node_modules/firebase/package.json')).version;

test('every gstatic import pins the same SDK version as the installed firebase package', () => {
  const versions = [...config.matchAll(/firebasejs\/(\d+\.\d+\.\d+)\//g)].map(m => m[1]);
  assert.equal(versions.length, 3);
  assert.deepEqual(new Set(versions), new Set([installed]));
});

test('the config exports the firestore functions the data layer needs and nothing unused', () => {
  const exportBlock = config.slice(config.lastIndexOf('export {'));
  for (const name of ['onSnapshot', 'limit', 'orderBy', 'serverTimestamp']) {
    assert.match(exportBlock, new RegExp(`\\b${name}\\b`), `${name} missing from exports`);
  }
  assert.doesNotMatch(exportBlock, /sendEmailVerification/);
});
