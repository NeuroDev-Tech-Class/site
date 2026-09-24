// Proves every exercise's tests actually run: each starter goes into a clean Python 3.12 or Node 22 container,
// its dependencies install, and its tests run against the unfinished work. Passing or failing both count;
// crashing on setup or collection does not. Needs Docker. Usage: node tools/exercises/verify.mjs [course/slug ...]
import { spawn } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SETUP_FAILED = 97;
const CONCURRENCY = 4;

const PYTEST_EXITS = {
  2: 'collection error or interrupted (pytest exit 2)',
  3: 'internal error (pytest exit 3)',
  4: 'usage error (pytest exit 4)',
  5: 'no tests found (pytest exit 5)',
};

export function judge(runner, exitCode, stdout) {
  if (runner === 'pytest') {
    if (exitCode === 0) return { ok: true, outcome: 'tests pass' };
    if (exitCode === 1) return { ok: true, outcome: 'tests fail on the starter' };
    return { ok: false, outcome: PYTEST_EXITS[exitCode] || `setup failed (exit ${exitCode})` };
  }
  let report;
  try { report = JSON.parse(stdout); } catch { return { ok: false, outcome: `setup failed (exit ${exitCode}, no jest report)` }; }
  if (report.numRuntimeErrorTestSuites > 0) return { ok: false, outcome: 'a test suite failed to run' };
  if (!report.numTotalTests) return { ok: false, outcome: 'no tests found' };
  return { ok: true, outcome: exitCode === 0 ? 'tests pass' : 'tests fail on the starter' };
}

const unpack = 'mkdir -p /work && tar -xf - -C /work && cd /work';
const COMMANDS = {
  pytest: {
    image: 'python:3.12-slim',
    cache: 'nd-exercises-pip:/root/.cache/pip',
    script: `${unpack} && (pip install -q --disable-pip-version-check --root-user-action=ignore -r requirements.txt >&2 || exit ${SETUP_FAILED}) && pytest -q -p no:cacheprovider >&2`,
  },
  jest: {
    image: 'node:22-slim',
    cache: 'nd-exercises-npm:/root/.npm',
    script: `${unpack} && (npm install --no-audit --no-fund --loglevel=error >&2 || exit ${SETUP_FAILED}) && npx jest --json`,
  },
};

function run(starter, runner) {
  const { image, cache, script } = COMMANDS[runner];
  const shell = `tar -C '${starter}' -cf - . | docker run --rm -i -v ${cache} ${image} sh -c '${script}'`;
  return new Promise(resolve => {
    const child = spawn('sh', ['-c', shell]);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('close', code => resolve({ code, stdout, stderr }));
  });
}

export function exercisesWithTests(root) {
  return readdirSync(root).flatMap(course => readdirSync(join(root, course)).map(slug => {
    const meta = JSON.parse(readFileSync(join(root, course, slug, 'exercise.json'), 'utf8'));
    return { id: `${course}/${slug}`, runner: meta.runner, starter: join(root, course, slug, 'starter') };
  })).filter(e => e.runner !== 'none');
}

async function main() {
  const root = fileURLToPath(new URL('../../exercises/', import.meta.url));
  const only = process.argv.slice(2);
  const todo = exercisesWithTests(root).filter(e => !only.length || only.includes(e.id));
  const results = [];
  const queue = [...todo];
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    for (let exercise = queue.shift(); exercise; exercise = queue.shift()) {
      const { code, stdout, stderr } = await run(exercise.starter, exercise.runner);
      const verdict = judge(exercise.runner, code, stdout);
      results.push({ ...exercise, ...verdict });
      console.log(`${verdict.ok ? 'ok  ' : 'FAIL'} ${exercise.id.padEnd(40)} ${verdict.outcome}`);
      if (!verdict.ok) console.log(stderr.split('\n').slice(-25).map(line => `      ${line}`).join('\n'));
    }
  }));
  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length} of ${results.length} exercises run cleanly.`);
  process.exit(failed.length ? 1 : 0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
