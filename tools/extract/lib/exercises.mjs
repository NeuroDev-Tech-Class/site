// The coding exercises in exercises/ (the old GitHub Classroom repos). Each course link to one becomes a checkpoint
// asking for the student's repo link, or a lesson when the exercise is only reading.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { marked } from 'marked';

const TEST_FILES = { pytest: /^tests\/test_.*\.py$/, jest: /^__tests__\/.*\.js$/ };
const RUN = { pytest: 'pytest', jest: 'npm test' };

function filesUnder(root, dir = root) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(root, full) : [full.slice(root.length + 1).split('\\').join('/')];
  });
}

export function loadExercises(siteRoot) {
  const root = join(siteRoot, 'exercises');
  return readdirSync(root).sort().flatMap(course => readdirSync(join(root, course)).sort().map(slug => {
    const dir = join(root, course, slug);
    const read = name => (existsSync(join(dir, name)) ? readFileSync(join(dir, name), 'utf8') : null);
    const starter = filesUnder(join(dir, 'starter'));
    return {
      id: `${course}/${slug}`,
      ...JSON.parse(read('exercise.json')),
      lesson: read('lesson.md'),
      assignment: read('assignment.md'),
      starter,
    };
  }));
}

/** Course links read "Complete Lesson & Exercise 2.3 - Loops", "Reading 3.0 - ..." or "Final Project - Chess Game". */
export function matchExercise(exercises, courseId, label) {
  const inCourse = exercises.filter(e => e.course === courseId);
  const number = label.match(/\b(\d+\.\d+)\b/)?.[1];
  if (number) return inCourse.find(e => e.number === number) ?? null;
  if (/final project/i.test(label)) return inCourse.find(e => e.id.endsWith('final-project')) ?? null;
  return null;
}

export function renderMarkdown(markdown) {
  return marked.parse(markdown, { async: false, gfm: true }).trim();
}

/** The page already shows the exercise's title, so the lesson's own headings move down a level. */
export function shiftHeadings(html) {
  return html.replace(/<(\/?)h([1-5])(\b[^>]*)>/g, (_, slash, level, rest) => `<${slash}h${Number(level) + 1}${rest}>`);
}

export function handInBlock(runner, hasStarter = true) {
  const steps = [
    hasStarter && 'Download the starter files from this page and unzip them into a new folder.',
    'Make a new repository on GitHub and push your folder to it. (GitHub Basics, the first exercise in Python I, walks through this.)',
    runner !== 'none' && `Run the tests yourself with <code>${RUN[runner]}</code>. When you push, GitHub runs them too: a green check next to your latest commit means they pass, a red X means something still needs work.`,
    'Submit the link to your repository with the form below.',
  ].filter(Boolean);
  return `<h2>Hand it in</h2>\n<ol>\n${steps.map(step => `<li>${step}</li>`).join('\n')}\n</ol>`;
}

export function exerciseCheckpoint(exercise) {
  const parts = [exercise.lesson, exercise.assignment].filter(Boolean).map(md => shiftHeadings(renderMarkdown(md)));
  const tests = exercise.runner === 'none' ? [] : exercise.starter.filter(f => TEST_FILES[exercise.runner].test(f));
  return {
    title: exercise.title,
    preset: 'github-exercise',
    requires_sign_off: false,
    fields: [
      { id: 'repo_url', type: 'url', label: 'Link to your GitHub repository', required: true,
        help: 'It looks like https://github.com/your-username/your-repository' },
      { id: 'notes', type: 'longText', label: 'Anything you want your coach to know?', required: false },
    ],
    required_one_of: [],
    instructions_html: [...parts, handInBlock(exercise.runner, exercise.starter.length > 0)].join('\n'),
    starter_path: exercise.starter.length ? `exercises/${exercise.id}/starter` : null,
    grading_hint: exercise.runner === 'none' ? null
      : { runner: exercise.runner, tests: tests.map(f => `exercises/${exercise.id}/starter/${f}`) },
  };
}
