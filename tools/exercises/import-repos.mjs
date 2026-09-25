// One-time move of the old GitHub Classroom repos (../tech-class-courses) into exercises/<course>/<number-slug>/.
// It refuses to run over an existing exercises/ folder: after the import, exercises/ is edited by hand.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const COURSES = {
  'Python-I-Assignments': { prefix: 'Python-I', course: 'python-1', language: 'python' },
  'Python-II-Assignments': { prefix: 'Python-II', course: 'python-2', language: 'python' },
  'WebDev-II-Assignments': { prefix: 'WebDev-II', course: 'web-dev-2', language: 'javascript' },
  'WebDev-III-Assignments': { prefix: 'WebDev-III', course: 'web-dev-3', language: 'web' },
};
const SKIPPED_DIRS = new Set(['.git', '.github', 'node_modules', '__pycache__', '.pytest_cache']);
const SKIPPED_FILES = new Set(['.DS_Store']);
const CODE = /\.(py|js|ts|html|css|sh)$/;
const WORKFLOWS = new URL('./workflows/', import.meta.url);

function filesIn(repo) {
  const out = [];
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRS.has(entry.name)) walk(join(dir, entry.name));
      } else if (!SKIPPED_FILES.has(entry.name)) {
        out.push(relative(repo, join(dir, entry.name)).split('\\').join('/'));
      }
    }
  };
  walk(repo);
  return out.sort();
}

function headCommit(repo) {
  const head = readFileSync(join(repo, '.git/HEAD'), 'utf8').trim();
  if (!head.startsWith('ref: ')) return head;
  const ref = head.slice(5);
  if (existsSync(join(repo, '.git', ref))) return readFileSync(join(repo, '.git', ref), 'utf8').trim();
  const packed = readFileSync(join(repo, '.git/packed-refs'), 'utf8').split('\n').find(line => line.endsWith(` ${ref}`));
  return packed.split(' ')[0];
}

/** Which top-level files are the instructions rather than starter code, for each course's layout. */
function instructionFiles(language, files) {
  const has = name => files.includes(name);
  // Web Dev III keeps the lesson in learn.md and the brief in README.md; with no learn.md the brief is the lesson
  if (language === 'web' && has('learn.md')) return { 'learn.md': 'lesson.md', 'README.md': 'assignment.md' };
  if (language === 'python' && has('lesson.md')) return { 'lesson.md': 'lesson.md' };
  return { 'README.md': 'lesson.md' };
}

function planRepo(repoDir, name, spec) {
  const match = name.match(new RegExp(`^${spec.prefix}-(\\d+\\.\\d+)-(.+)$`));
  if (!match) return null;
  const [, number, rest] = match;
  const files = filesIn(repoDir);
  const moves = instructionFiles(spec.language, files);
  const leftovers = files.filter(file => !moves[file]);
  const reading = !leftovers.some(f => CODE.test(f));
  // A reading has nothing to write, so nothing to download (a stray .gitignore or requirements.txt included)
  const starter = reading ? [] : leftovers;
  const lesson = Object.entries(moves).find(([, to]) => to === 'lesson.md')?.[0];
  const heading = lesson && files.includes(lesson) ? readFileSync(join(repoDir, lesson), 'utf8').match(/^#\s+(.+)$/m)?.[1] : null;

  const pytest = spec.language === 'python' && starter.some(f => /^tests\/test_.*\.py$/.test(f));
  const jest = spec.language !== 'python' && starter.includes('package.json') && starter.some(f => f.startsWith('__tests__/'));
  return {
    dir: `${spec.course}/${number}-${rest.toLowerCase().replace(/_/g, '-')}`,
    exercise: {
      course: spec.course,
      number,
      title: (heading || rest.replace(/_/g, ' ')).trim(),
      kind: reading ? 'reading' : 'exercise',
      language: spec.language,
      runner: pytest ? 'pytest' : jest ? 'jest' : 'none',
      source: { repo: `NeuroDev-Tech-Class/${name}`, commit: headCommit(repoDir) },
    },
    moves: Object.entries(moves).filter(([from]) => files.includes(from)),
    starter,
  };
}

export function importRepos(sourceRoot, target) {
  if (existsSync(target)) throw new Error(`${target} already exists; the import only runs once, before any hand edits`);
  const put = (path, write) => {
    mkdirSync(dirname(path), { recursive: true });
    write(path);
  };
  const imported = [];
  for (const [folder, spec] of Object.entries(COURSES)) {
    if (!existsSync(join(sourceRoot, folder))) continue;
    for (const name of readdirSync(join(sourceRoot, folder)).sort()) {
      const repoDir = join(sourceRoot, folder, name);
      const plan = planRepo(repoDir, name, spec);
      if (!plan) continue;
      const out = join(target, plan.dir);
      put(join(out, 'exercise.json'), path => writeFileSync(path, `${JSON.stringify(plan.exercise, null, 2)}\n`));
      for (const [from, to] of plan.moves) put(join(out, to), path => copyFileSync(join(repoDir, from), path));
      for (const file of plan.starter) put(join(out, 'starter', file), path => copyFileSync(join(repoDir, file), path));
      if (plan.exercise.runner !== 'none') {
        put(join(out, 'starter/.github/workflows/tests.yml'),
          path => copyFileSync(new URL(`${plan.exercise.runner}.yml`, WORKFLOWS), path));
      }
      imported.push(plan.dir);
    }
  }
  return imported;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const site = fileURLToPath(new URL('../../', import.meta.url));
  const imported = importRepos(join(site, '../tech-class-courses'), join(site, 'exercises'));
  console.log(`Imported ${imported.length} exercises into exercises/.`);
}
