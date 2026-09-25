import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { importRepos } from '../../tools/exercises/import-repos.mjs';

const REPOS = fileURLToPath(new URL('../../../tech-class-courses/', import.meta.url));

function tree(root) {
  const out = [];
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(relative(root, full).split('\\').join('/'));
    }
  };
  walk(root);
  return out.sort();
}

function write(root, files) {
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), body);
  }
}

function fixtureRepos() {
  const root = mkdtempSync(join(tmpdir(), 'repos-'));
  write(root, {
    'Python-I-Assignments/Python-I-2.3-Loops/lesson.md': '# Loops\n\nFor loops.\n',
    'Python-I-Assignments/Python-I-2.3-Loops/exercise.py': 'def fizzBuzz():\n    pass\n',
    'Python-I-Assignments/Python-I-2.3-Loops/requirements.txt': 'pytest\n',
    'Python-I-Assignments/Python-I-2.3-Loops/tests/test_exercise.py': 'def test_x():\n    assert True\n',
    'Python-I-Assignments/Python-I-2.3-Loops/.gitignore': '__pycache__/\n',
    'Python-I-Assignments/Python-I-2.3-Loops/.github/workflows/classroom.yml': 'name: Autograding Tests\n',
    'Python-I-Assignments/Python-I-2.3-Loops/__pycache__/exercise.cpython-312.pyc': 'x',
    'Python-I-Assignments/Python-I-2.3-Loops/.pytest_cache/README.md': 'x',
    'Python-I-Assignments/Python-I-2.3-Loops/.git/HEAD': 'ref: refs/heads/main\n',
    'Python-I-Assignments/Python-I-2.3-Loops/.git/refs/heads/main': 'abc123def456\n',
    'Python-I-Assignments/Python-I-3.0-PEP8_Style_Guide/lesson.md': '# PEP 8\n\nStyle.\n',
    'Python-I-Assignments/Python-I-3.0-PEP8_Style_Guide/.gitignore': '__pycache__/\n',
    'Python-I-Assignments/Python-I-3.0-PEP8_Style_Guide/requirements.txt': 'pytest\n',
    'Python-I-Assignments/Python-I-3.0-PEP8_Style_Guide/.git/HEAD': 'ref: refs/heads/main\n',
    'Python-I-Assignments/Python-I-3.0-PEP8_Style_Guide/.git/packed-refs': '# pack-refs\n0f0f0f refs/heads/main\n',
    'WebDev-II-Assignments/WebDev-II-2.4-Arrays/README.md': '# JavaScript Arrays\n',
    'WebDev-II-Assignments/WebDev-II-2.4-Arrays/practice.js': 'let a = [];\n',
    'WebDev-II-Assignments/WebDev-II-2.4-Arrays/package.json': '{"scripts":{"test":"jest"}}\n',
    'WebDev-II-Assignments/WebDev-II-2.4-Arrays/__tests__/learn.test.js': 'test("x", () => {});\n',
    'WebDev-II-Assignments/WebDev-II-2.4-Arrays/node_modules/jest/index.js': 'x',
    'WebDev-II-Assignments/WebDev-II-2.4-Arrays/.git/HEAD': 'ref: refs/heads/master\n',
    'WebDev-II-Assignments/WebDev-II-2.4-Arrays/.git/refs/heads/master': '111222\n',
    'WebDev-III-Assignments/WebDev-III-1.1-Event_Listeners/learn.md': '# JavaScript: Event Listeners\n',
    'WebDev-III-Assignments/WebDev-III-1.1-Event_Listeners/README.md': '# Rock Paper Scissors\n',
    'WebDev-III-Assignments/WebDev-III-1.1-Event_Listeners/index.html': '<html></html>\n',
    'WebDev-III-Assignments/WebDev-III-1.1-Event_Listeners/.git/HEAD': 'ref: refs/heads/master\n',
    'WebDev-III-Assignments/WebDev-III-1.1-Event_Listeners/.git/refs/heads/master': '333444\n',
    'WebDev-III-Assignments/WebDev-III-1.6-Unit_1_Project/README.md': '# Wordle Recreation Project\n\nBuild it.\n',
    'WebDev-III-Assignments/WebDev-III-1.6-Unit_1_Project/practice.js': '',
    'WebDev-III-Assignments/WebDev-III-1.6-Unit_1_Project/.git/HEAD': 'ref: refs/heads/master\n',
    'WebDev-III-Assignments/WebDev-III-1.6-Unit_1_Project/.git/refs/heads/master': '555666\n',
    'WebDev-I-Assignments/WebDev-I-1.1-Creating_HTML_Docs/README.md': '# WebDev-I-Template\n',
  });
  return root;
}

test('a repo becomes an exercise folder: instructions beside the starter, only student files in the starter', () => {
  const target = join(mkdtempSync(join(tmpdir(), 'ex-')), 'exercises');
  importRepos(fixtureRepos(), target);

  assert.deepEqual(tree(join(target, 'python-1/2.3-loops')), [
    'exercise.json',
    'lesson.md',
    'starter/.github/workflows/tests.yml',
    'starter/.gitignore',
    'starter/exercise.py',
    'starter/requirements.txt',
    'starter/tests/test_exercise.py',
  ]);
  const exercise = JSON.parse(readFileSync(join(target, 'python-1/2.3-loops/exercise.json'), 'utf8'));
  assert.deepEqual(exercise, {
    course: 'python-1', number: '2.3', title: 'Loops', kind: 'exercise', language: 'python', runner: 'pytest',
    source: { repo: 'NeuroDev-Tech-Class/Python-I-2.3-Loops', commit: 'abc123def456' },
  });
  assert.match(readFileSync(join(target, 'python-1/2.3-loops/starter/.github/workflows/tests.yml'), 'utf8'), /pytest/);
});

test('each course layout lands in the right files', () => {
  const target = join(mkdtempSync(join(tmpdir(), 'ex-')), 'exercises');
  importRepos(fixtureRepos(), target);
  const json = path => JSON.parse(readFileSync(join(target, path), 'utf8'));

  const pep8 = json('python-1/3.0-pep8-style-guide/exercise.json');
  assert.deepEqual([pep8.kind, pep8.runner, pep8.source.commit], ['reading', 'none', '0f0f0f']);
  assert.deepEqual(tree(join(target, 'python-1/3.0-pep8-style-guide')), ['exercise.json', 'lesson.md']);

  const arrays = json('web-dev-2/2.4-arrays/exercise.json');
  assert.deepEqual([arrays.language, arrays.runner, arrays.title], ['javascript', 'jest', 'JavaScript Arrays']);
  assert.ok(existsSync(join(target, 'web-dev-2/2.4-arrays/lesson.md')));
  assert.ok(!tree(join(target, 'web-dev-2/2.4-arrays')).some(p => p.includes('node_modules')));
  assert.match(readFileSync(join(target, 'web-dev-2/2.4-arrays/starter/.github/workflows/tests.yml'), 'utf8'), /npm test/);

  assert.deepEqual(tree(join(target, 'web-dev-3/1.1-event-listeners')), [
    'assignment.md', 'exercise.json', 'lesson.md', 'starter/index.html',
  ]);
  assert.equal(json('web-dev-3/1.1-event-listeners/exercise.json').language, 'web');

  // no learn.md: the brief is the whole lesson
  assert.deepEqual(tree(join(target, 'web-dev-3/1.6-unit-1-project')), ['exercise.json', 'lesson.md', 'starter/practice.js']);
  assert.equal(json('web-dev-3/1.6-unit-1-project/exercise.json').title, 'Wordle Recreation Project');
  assert.ok(!existsSync(join(target, 'web-dev-1')), 'the unused Web Dev I templates are not imported');
});

test('the import refuses to overwrite exercises that may already have been edited', () => {
  const target = join(mkdtempSync(join(tmpdir(), 'ex-')), 'exercises');
  const repos = fixtureRepos();
  importRepos(repos, target);
  assert.throws(() => importRepos(repos, target), /already exists/);
});

test('the real repos give 58 exercises in the expected shape', { skip: !existsSync(REPOS) && 'tech-class-courses is not next to the site repo' }, () => {
  const target = join(mkdtempSync(join(tmpdir(), 'ex-')), 'exercises');
  importRepos(REPOS, target);
  const exercises = ['python-1', 'python-2', 'web-dev-2', 'web-dev-3'].flatMap(course =>
    readdirSync(join(target, course)).map(dir => JSON.parse(readFileSync(join(target, course, dir, 'exercise.json'), 'utf8'))));

  const count = key => exercises.reduce((n, e) => ({ ...n, [e[key]]: (n[e[key]] || 0) + 1 }), {});
  assert.deepEqual(count('course'), { 'python-1': 21, 'python-2': 14, 'web-dev-2': 17, 'web-dev-3': 6 });
  assert.deepEqual(count('runner'), { pytest: 29, jest: 13, none: 16 });
  assert.ok(exercises.every(e => /^[0-9a-f]{40}$/.test(e.source.commit)), 'every exercise records its source commit');
  for (const file of tree(target)) {
    assert.doesNotMatch(file, /(^|\/)(\.git|node_modules|__pycache__|\.pytest_cache)\//, file);
    assert.doesNotMatch(file, /classroom\.yml$/, file);
  }
});
