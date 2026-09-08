import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { SHARED_FILES, sourcePath, targetPath } from '../../tools/sync-shared.mjs';
import { approvalMailDoc as clientApproval } from '../../assets/js/data/mail.js';
import { approvalMailDoc as functionsApproval } from '../../functions/shared/data/mail.js';

test('every shared file has an identical copy under functions/shared', () => {
  assert.ok(SHARED_FILES.length >= 4);
  for (const rel of SHARED_FILES) {
    const target = targetPath(rel);
    assert.ok(existsSync(target), `missing copy for ${rel}; run: node tools/sync-shared.mjs`);
    assert.equal(readFileSync(target, 'utf8'), readFileSync(sourcePath(rel), 'utf8'), `${rel} has drifted; run: node tools/sync-shared.mjs`);
  }
});

test('the functions copy of the approval mail matches the client version byte for byte', () => {
  const student = { firstName: 'jane', lastName: 'doe', email: 'jane@example.com' };
  const url = 'https://neurodev-tech-class.github.io/site/';
  assert.deepEqual(functionsApproval(student, url), clientApproval(student, url));
});
