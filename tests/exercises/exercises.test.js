// Every exercise in exercises/ is complete, free of GitHub Classroom leftovers, and ready to download.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../exercises/', import.meta.url));
const WORKFLOWS = fileURLToPath(new URL('../../tools/exercises/workflows/', import.meta.url));

function filesUnder(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(full) : [full];
  });
}

const exercises = readdirSync(ROOT).flatMap(course =>
  readdirSync(join(ROOT, course)).map(slug => {
    const dir = join(ROOT, course, slug);
    return { id: `${course}/${slug}`, dir, starter: join(dir, 'starter'), meta: JSON.parse(readFileSync(join(dir, 'exercise.json'), 'utf8')) };
  }));
const find = id => exercises.find(e => e.id === id);
const read = (exercise, path) => readFileSync(join(exercise.dir, path), 'utf8');

test('all 58 exercises are here, each with a description and instructions', () => {
  assert.equal(exercises.length, 58);
  for (const { id, meta, dir } of exercises) {
    assert.ok(['exercise', 'reading', 'project'].includes(meta.kind), id);
    assert.ok(['pytest', 'jest', 'none'].includes(meta.runner), id);
    assert.ok(['python', 'javascript', 'web'].includes(meta.language), id);
    assert.ok(meta.title && meta.number && meta.source?.commit, id);
    assert.ok(readFileSync(join(dir, 'lesson.md'), 'utf8').trim().length > 50, `${id} has a lesson`);
  }
});

test('an exercise has a test workflow exactly when it has tests to run, and it is the shared template', () => {
  for (const { id, meta, starter } of exercises) {
    const workflow = join(starter, '.github/workflows/tests.yml');
    if (meta.runner === 'none') {
      assert.ok(!existsSync(workflow), `${id} has no tests but has a workflow`);
    } else {
      assert.equal(readFileSync(workflow, 'utf8'), readFileSync(join(WORKFLOWS, `${meta.runner}.yml`), 'utf8'), id);
    }
  }
});

test('a reading has nothing to download', () => {
  for (const { id, meta, starter } of exercises.filter(e => e.meta.kind === 'reading')) {
    assert.deepEqual(filesUnder(starter), [], id);
  }
});

test('nothing refers to GitHub Classroom or the old private repos', () => {
  for (const { id, dir } of exercises) {
    for (const file of filesUnder(dir).filter(f => !f.endsWith('exercise.json'))) {
      assert.doesNotMatch(readFileSync(file, 'utf8'), /classroom|NeuroDev-Tech-Class/i, `${id}/${relative(dir, file)}`);
    }
  }
});

test('every package.json is a clean, valid npm package named after its exercise', () => {
  for (const { id, meta, starter } of exercises) {
    const path = join(starter, 'package.json');
    if (!existsSync(path)) continue;
    const pkg = JSON.parse(readFileSync(path, 'utf8'));
    assert.match(pkg.name, /^[a-z0-9][a-z0-9._-]*$/, id);
    assert.equal(pkg.description, meta.title, id);
    for (const key of ['repository', 'bugs', 'homepage']) assert.equal(pkg[key], undefined, `${id} ${key}`);
  }
});

test('the Web Dev II unit projects install prompt-sync and start from quiz.js', () => {
  for (const id of ['web-dev-2/2.7-unit-2-test', 'web-dev-2/3.4-unit-3-test']) {
    const exercise = find(id);
    assert.deepEqual([exercise.meta.kind, exercise.meta.runner], ['project', 'none'], id);
    const pkg = JSON.parse(readFileSync(join(exercise.starter, 'package.json'), 'utf8'));
    assert.ok(pkg.dependencies?.['prompt-sync'], id);
    assert.ok(existsSync(join(exercise.starter, 'quiz.js')) && !existsSync(join(exercise.starter, 'test.js')), id);
    assert.doesNotMatch(read(exercise, 'lesson.md'), /test file/i, `${id} still points at test.js`);
  }
});

test('every Web Dev III starter page loads its own stylesheet and script, and everything it links exists', () => {
  for (const exercise of exercises.filter(e => e.meta.course === 'web-dev-3')) {
    const html = readFileSync(join(exercise.starter, 'index.html'), 'utf8');
    assert.match(html, /<link[^>]+href="styles\.css"/, exercise.id);
    assert.match(html, /<script[^>]+src="practice\.js"/, exercise.id);
    for (const [, ref] of html.matchAll(/(?:src|href)="([^"#:]+)"/g)) {
      assert.ok(existsSync(join(exercise.starter, ref)), `${exercise.id} links ${ref}, which is missing`);
    }
    assert.equal(exercise.meta.runner, 'none', exercise.id);
    assert.ok(!existsSync(join(exercise.starter, '__tests__')), `${exercise.id} ships tests nothing can run`);
  }
});

test('GitHub Basics teaches the new way to hand in work', () => {
  const basics = find('python-1/0.0-github-basics');
  assert.equal(basics.meta.kind, 'exercise');
  const lesson = read(basics, 'lesson.md');
  assert.match(lesson, /submit/i);
  assert.match(lesson, /git push/);
  assert.doesNotMatch(lesson, /\bmaster\b/, 'GitHub names the first branch main');
});

test('Terminal Commands is a reading with its Linux and PowerShell notes in the lesson', () => {
  const terminal = find('web-dev-2/1.0-terminal-commands');
  assert.equal(terminal.meta.kind, 'reading');
  const lesson = read(terminal, 'lesson.md');
  assert.match(lesson, /PowerShell/);
  assert.match(lesson, /ls -al/);
});
