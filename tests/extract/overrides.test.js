import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildCourse, legacyKeys } from '../../tools/extract/lib/courses.mjs';
import { generate } from '../../tools/extract/lib/generate.mjs';
import { extractLesson } from '../../tools/extract/lib/lessons.mjs';
import { applyCoursePatches, unusedOverrides } from '../../tools/extract/lib/overrides.mjs';

const SITE = fileURLToPath(new URL('../../', import.meta.url));
const page = `<html><head><base href="/site/"></head><body><main>
  <a href="courses/x.html" class="back-link">Back</a>
  <div class="doc-header"><span class="course-tag">Digital Literacy</span><h1>Hands-on Exercise</h1></div>
  <p>Have each student bring you their laptop.</p>
  <div class="doc-footer"><p>NeuroDev</p></div></main></body></html>`;

test('an override replaces the body and keeps the page title and course tag', () => {
  const lesson = extractLesson(page, 'dl/x.html', null, '<p>Bring your laptop to your coach.</p>');
  assert.equal(lesson.html, '<p>Bring your laptop to your coach.</p>');
  assert.deepEqual([lesson.title, lesson.course_tag], ['Hands-on Exercise', 'Digital Literacy']);
});

test('an override for a page no course uses is reported, so a typo in its path is never silently ignored', () => {
  assert.deepEqual(unusedOverrides(['a/used.html', 'a/typo.html'], new Set(['a/used.html'])), ['a/typo.html']);
});

test('a course patch must match exactly once', () => {
  assert.equal(applyCoursePatches('<p>TODO: x</p><p>keep</p>', [{ find: '<p>TODO: x</p>', replace: '' }], 'c.html'),
    '<p>keep</p>');
  assert.throws(() => applyCoursePatches('<p>a</p>', [{ find: '<p>b</p>', replace: '' }], 'c.html'), /c\.html.*0 times/);
  assert.throws(() => applyCoursePatches('<p>a</p><p>a</p>', [{ find: '<p>a</p>', replace: '' }], 'c.html'), /2 times/);
});

// ── the real drafts ─────────────────────────────────────────────────────────

const files = await generate(SITE);
const json = path => JSON.parse(files.get(path));
const checkpointFor = legacyPath => [...files.keys()]
  .filter(p => p.startsWith('content/checkpoints/')).map(json).find(c => c.legacy_path === legacyPath);

test('the drafted pages are what students get', () => {
  const expectations = {
    'computer-basics/digital-literacy/unit1/hands-on_exercise-identifying_hardware.html': /Part 2: Inside a desktop/,
    'computer-basics/digital-literacy/unit2/hands-on_exercise-keyboard_shortcuts.html': /Google Docs or Microsoft Word/,
    'computer-basics/digital-literacy/unit3/hands-on_exercise-email_account.html': /This exercise|answer the question in the form below/,
    'computer-basics/digital-literacy/unit3/hands-on_exercise-social_media.html': /This exercise is optional/,
    'computer-basics/ai-prompt-engineering/hands-on_generative_ai_exercises.html': /write what you noticed in each exercise/,
    'it/computer_hardware/identifying_computer_hardware.html': /Find and read each part/,
    'computer-basics/ai-prompt-engineering/responsible_ai_use.html': /Answer these in a few sentences each in the form below/,
  };
  for (const [path, text] of Object.entries(expectations)) {
    const checkpoint = checkpointFor(path);
    assert.ok(checkpoint, `${path} is a checkpoint`);
    assert.match(checkpoint.instructions_html, text, path);
  }
});

test('the drafts link to the right lessons on the new site', () => {
  const html = checkpointFor('computer-basics/digital-literacy/unit1/hands-on_exercise-identifying_hardware.html').instructions_html;
  const lessons = json('content/lessons.json');
  const cables = Object.keys(lessons).find(id => lessons[id].legacy_path === 'computer-basics/digital-literacy/unit1/cables_and_ports.html');
  assert.match(html, new RegExp(`href="/lessons/${cables}"`));
});

test('no page tells the teacher what to do with "each student" any more', () => {
  for (const [path, body] of files) assert.doesNotMatch(body, /have (each|the) students?\b/i, path);
});

test('Web Dev I no longer shows its TODO line', () => {
  assert.doesNotMatch(json('content/courses/web-dev-1.json').summary, /TODO/);
});

test('overrides and patches never change an item id, so old progress still maps', () => {
  const progress = json('content/legacy-map.json').progress;
  for (const id of Object.keys(progress)) {
    const raw = buildCourse({ id, title: id, category: '', html: readFileSync(`${SITE}courses/${id}.html`, 'utf8') });
    const before = legacyKeys(raw);
    for (const [key, itemId] of Object.entries(progress[id])) assert.equal(itemId, before[key], `${id} ${key}`);
  }
});
