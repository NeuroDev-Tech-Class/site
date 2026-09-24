import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handInBlock, loadExercises, matchExercise, renderMarkdown } from '../../tools/extract/lib/exercises.mjs';
import { checkVocabulary } from '../../tools/extract/lib/vocabulary.mjs';
import { generate } from '../../tools/extract/lib/generate.mjs';

const SITE = fileURLToPath(new URL('../../', import.meta.url));
const exercises = loadExercises(SITE);

test('every course link finds its exercise by number, and the final project by name', () => {
  assert.equal(matchExercise(exercises, 'python-1', 'Complete Lesson & Exercise 2.3 - Loops').id, 'python-1/2.3-loops');
  assert.equal(matchExercise(exercises, 'python-1', 'Reading 3.0 - PEP-8 Style Guide').id, 'python-1/3.0-pep8-style-guide');
  assert.equal(matchExercise(exercises, 'web-dev-2', 'Test 2.7 - Unit 2 Test').id, 'web-dev-2/2.7-unit-2-test');
  assert.equal(matchExercise(exercises, 'python-2', 'Final Project - Chess Game').id, 'python-2/3.5-final-project');
  assert.equal(matchExercise(exercises, 'python-1', 'Exercise 9.9 - Nothing'), null);
});

test('Markdown becomes lesson HTML, with code blocks tagged by language', () => {
  const html = renderMarkdown('# Loops\n\nA `for` loop.\n\n```python\nfor i in range(3):\n    print(i)\n```\n');
  assert.match(html, /<h1>Loops<\/h1>/);
  assert.match(html, /<code>for<\/code>/);
  assert.match(html, /<pre><code class="language-python">for i in range\(3\):/);
  assert.deepEqual(checkVocabulary(html.replace('<h1>', '<h2>').replace('</h1>', '</h2>'), 'x'), []);
});

test('the hand-in block says how to submit, and mentions tests only when there are some', () => {
  const pytest = handInBlock('pytest');
  assert.match(pytest, /Download the starter files/);
  assert.match(pytest, /green check/);
  assert.match(pytest, /Submit/);
  assert.doesNotMatch(handInBlock('none'), /green check/);
});

// ── the real exercises ──────────────────────────────────────────────────────

const files = await generate(SITE);
const json = path => JSON.parse(files.get(path));
const items = [...files.keys()].filter(p => p.startsWith('content/courses/'))
  .flatMap(p => json(p).units.flatMap(u => u.items).map(item => ({ ...item, course: json(p).id })));
const fromExercises = items.filter(i => i.tags.includes('github-exercise'));

test('all 58 course links become a checkpoint or, for the two readings, a lesson', () => {
  assert.equal(fromExercises.length, 58);
  const readings = fromExercises.filter(i => i.type === 'lesson').map(i => i.payload.exercise).sort();
  assert.deepEqual(readings, ['python-1/3.0-pep8-style-guide', 'web-dev-2/1.0-terminal-commands']);
  assert.equal(fromExercises.filter(i => i.type === 'checkpoint').length, 56);
});

test('an exercise checkpoint asks for the repo link, points at its starter and tells the grader how to check it', () => {
  for (const item of fromExercises.filter(i => i.type === 'checkpoint')) {
    const checkpoint = json(`content/checkpoints/${item.payload.checkpoint_id}.json`);
    assert.equal(checkpoint.preset, 'github-exercise');
    assert.equal(checkpoint.exercise, item.payload.exercise);
    const repo = checkpoint.fields.find(f => f.id === 'repo_url');
    assert.deepEqual([repo.type, repo.required], ['url', true], checkpoint.exercise);
    assert.match(checkpoint.instructions_html, /Submit/, checkpoint.exercise);
    if (checkpoint.starter_path) assert.ok(existsSync(join(SITE, checkpoint.starter_path)), checkpoint.starter_path);
    for (const path of checkpoint.grading_hint?.tests || []) assert.ok(existsSync(join(SITE, path)), path);
  }
});

test('Loops keeps its lesson, its pytest hint and its starter', () => {
  const item = fromExercises.find(i => i.payload.exercise === 'python-1/2.3-loops');
  assert.equal(item.title, '2.3 Loops');
  const checkpoint = json(`content/checkpoints/${item.payload.checkpoint_id}.json`);
  assert.match(checkpoint.instructions_html, /<h2>Loops<\/h2>/, 'the lesson heading sits under the page title');
  assert.equal(checkpoint.starter_path, 'exercises/python-1/2.3-loops/starter');
  assert.deepEqual(checkpoint.grading_hint, {
    runner: 'pytest', tests: ['exercises/python-1/2.3-loops/starter/tests/test_exercise.py'],
  });
});

test('a Web Dev III exercise shows its lesson and then its assignment', () => {
  const item = fromExercises.find(i => i.payload.exercise === 'web-dev-3/1.1-event-listeners');
  const html = json(`content/checkpoints/${item.payload.checkpoint_id}.json`).instructions_html.toLowerCase();
  const lesson = html.indexOf('event listeners');
  const assignment = html.indexOf('rock, paper, scissors');
  assert.ok(lesson > -1 && assignment > lesson);
});

test('the PEP-8 reading is a lesson taken from its repo', () => {
  const item = fromExercises.find(i => i.payload.exercise === 'python-1/3.0-pep8-style-guide');
  assert.match(files.get(`content/lessons/${item.payload.lesson_id}.html`), /PEP/);
  assert.equal(json('content/lessons.json')[item.payload.lesson_id].source, 'exercises/python-1/3.0-pep8-style-guide/lesson.md');
});

test('no GitHub Classroom link survives anywhere in content/', () => {
  for (const [path, body] of files) assert.doesNotMatch(body, /classroom\.github\.com/, path);
});
