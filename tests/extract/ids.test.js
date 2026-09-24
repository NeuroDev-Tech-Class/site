import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkpointId, itemId, lessonId, testId, unitId } from '../../tools/extract/lib/ids.mjs';

test('each id is its prefix and 10 hex characters', () => {
  assert.match(unitId('linux', 0, 'Unit 1'), /^u_[0-9a-f]{10}$/);
  assert.match(itemId('linux', 0, 3, 'assets/pdfs/it/linux/bash_1.html'), /^i_[0-9a-f]{10}$/);
  assert.match(lessonId('it/linux/bash_1.html'), /^l_[0-9a-f]{10}$/);
  assert.match(checkpointId('i_0123456789'), /^c_[0-9a-f]{10}$/);
  assert.match(testId('i_0123456789'), /^t_[0-9a-f]{10}$/);
});

test('the same inputs always give the same id, so a rerun of the extractor changes nothing', () => {
  assert.equal(itemId('linux', 1, 2, 'x'), itemId('linux', 1, 2, 'x'));
  assert.equal(lessonId('it/linux/bash_1.html'), lessonId('it/linux/bash_1.html'));
});

test('any change to an input gives a different id', () => {
  const base = itemId('linux', 1, 2, 'x');
  for (const other of [itemId('gimp', 1, 2, 'x'), itemId('linux', 0, 2, 'x'), itemId('linux', 1, 3, 'x'), itemId('linux', 1, 2, 'y')]) {
    assert.notEqual(other, base);
  }
  assert.notEqual(unitId('linux', 0, 'Unit 1'), unitId('linux', 0, 'Unit 2'));
  assert.notEqual(checkpointId('i_a'), testId('i_a'), 'a checkpoint and a test on one item never share an id');
});
