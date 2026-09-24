// Builds every file under content/ in memory. Nothing here writes to disk; extract.mjs does.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { replaceSubmissionEmails, validateSpec } from './checkpoints.mjs';
import { buildCourse, legacyKeys, parseCatalog } from './courses.mjs';
import { checkpointId, lessonId } from './ids.mjs';
import { extractLesson } from './lessons.mjs';
import { rewriteHtml } from './links.mjs';
import { renderReport } from './report.mjs';
import { VOCABULARY, checkVocabulary } from './vocabulary.mjs';

const asJson = value => `${JSON.stringify(value, null, 2)}\n`;
// Emailing the coach is the exercise itself here, so its address stays
const KEEPS_ITS_EMAIL = ['computer-basics/digital-literacy/unit3/hands-on_exercise-email_account.html'];

function htmlFilesUnder(dir, root = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFilesUnder(full, root);
    return entry.name.endsWith('.html') ? [relative(root, full).split('\\').join('/')] : [];
  });
}

export async function generate(siteRoot) {
  const read = path => readFileSync(join(siteRoot, path), 'utf8');
  const { courseMetadata } = await import(pathToFileURL(join(siteRoot, 'assets/js/course-metadata.js')).href);
  const catalog = parseCatalog(read('catalog.html'));
  const found = [];
  const usedBy = new Map();
  const use = (path, courseId) => {
    if (!usedBy.has(path)) usedBy.set(path, []);
    if (!usedBy.get(path).includes(courseId)) usedBy.get(path).push(courseId);
  };

  const spec = JSON.parse(read('tools/extract/checkpoints.json'));
  const targets = { lessons: new Set(), notes: new Set() };
  const pending = [];

  const courses = [];
  for (const category of catalog) {
    for (const id of category.courseIds) {
      const course = buildCourse({ id, title: courseMetadata[id].name, category: category.name, html: read(`courses/${id}.html`) });
      const where = `courses/${id}.html`;
      const links = [];
      course.intro_html = rewriteHtml(course.intro_html, where, links);
      found.push(...checkVocabulary(course.intro_html, where));
      for (const item of course.units.flatMap(u => u.items)) {
        if (item.type === 'lesson') {
          const path = item.payload.legacy_path;
          targets.lessons.add(path);
          if (spec[path]) {
            pending.push({ key: path, course: id, item, legacyPath: path });
            Object.assign(item, { type: 'checkpoint', payload: { legacy_path: path, checkpoint_id: checkpointId(item.id) } });
          } else {
            item.payload.lesson_id = lessonId(path);
            use(path, id);
          }
        } else if (item.type === 'note') {
          item.payload.html = rewriteHtml(item.payload.html, where, links);
          found.push(...checkVocabulary(item.payload.html, where));
          const key = `note:${id}:${item.legacy_key}`;
          targets.notes.add(key);
          if (spec[key]) {
            pending.push({ key, course: id, item, html: item.payload.html });
            Object.assign(item, { type: 'checkpoint', title: spec[key].title, payload: { checkpoint_id: checkpointId(item.id) } });
          }
        }
      }
      for (const link of links) {
        if (link.kind === 'lesson-ref') use(link.path, id);
        else found.push(link);
      }
      courses.push(course);
    }
  }

  const files = new Map();
  const lessons = [];
  for (const [path, courseIds] of usedBy) {
    if (!existsSync(join(siteRoot, 'assets/pdfs', path))) {
      found.push({ kind: 'missing-lesson', where: courseIds.map(c => `courses/${c}.html`).join(', '), path });
      continue;
    }
    const links = [];
    const lesson = extractLesson(read(`assets/pdfs/${path}`), path, links);
    found.push(...links.filter(l => l.kind !== 'lesson-ref'));
    found.push(...checkVocabulary(lesson.html, `assets/pdfs/${path}`));
    const { html, ...meta } = lesson;
    lessons.push({ ...meta, used_by: courseIds });
    files.set(`content/lessons/${lesson.id}.html`, `${html}\n`);
  }
  for (const { key, course, item, legacyPath, html } of pending) {
    const where = legacyPath ? `assets/pdfs/${legacyPath}` : `courses/${course}.html`;
    let instructions = html;
    if (legacyPath) {
      const links = [];
      instructions = extractLesson(read(where), legacyPath, links).html;
      found.push(...links.filter(l => l.kind !== 'lesson-ref'));
      if (!KEEPS_ITS_EMAIL.includes(legacyPath)) instructions = replaceSubmissionEmails(instructions, where, found);
      found.push(...checkVocabulary(instructions, where));
    }
    const { title, requires_sign_off, fields: specFields, required_one_of = [] } = spec[key];
    // A field's "note" is for whoever reviews the spec, not for students
    const fields = specFields.map(({ note, ...field }) => {
      if (note) found.push({ kind: 'spec-note', where: key, detail: `${field.id}: ${note}` });
      return field;
    });
    files.set(`content/checkpoints/${item.payload.checkpoint_id}.json`, asJson({
      id: item.payload.checkpoint_id,
      item_id: item.id,
      course_id: course,
      legacy_path: legacyPath ?? null,
      title,
      preset: null,
      requires_sign_off,
      fields,
      required_one_of,
      instructions_html: instructions,
      grading_hint: null,
    }));
  }
  const specProblems = validateSpec(spec, targets);
  const checkpointPaths = new Set(pending.map(p => p.legacyPath).filter(Boolean));
  const orphans = htmlFilesUnder(join(siteRoot, 'assets/pdfs'))
    .filter(path => !usedBy.has(path) && !checkpointPaths.has(path)).sort();

  for (const course of courses) files.set(`content/courses/${course.id}.json`, asJson(course));
  const byId = new Map(courses.map(c => [c.id, c]));
  files.set('content/catalog.json', asJson({
    categories: catalog.map(category => ({
      name: category.name,
      courses: category.courseIds.map(id => {
        const { title, summary, status } = byId.get(id);
        return { id, title, summary, status };
      }),
    })),
  }));
  files.set('content/lessons.json', asJson(Object.fromEntries(
    lessons.sort((a, b) => a.id.localeCompare(b.id)).map(({ id, ...rest }) => [id, rest]),
  )));
  files.set('content/legacy-map.json', asJson({
    urls: {
      ...Object.fromEntries(courses.map(c => [`courses/${c.id}.html`, { course: c.id }])),
      ...Object.fromEntries(lessons.map(l => [`assets/pdfs/${l.legacy_path}`, { lesson: l.id }])),
    },
    progress: Object.fromEntries(courses.map(c => [c.id, legacyKeys(c)])),
  }));
  files.set('content/vocabulary.json', asJson(VOCABULARY));
  files.set('content/report.md', renderReport({
    courses, lessonCount: lessons.length, checkpointCount: pending.length, orphans, findings: found, specProblems,
  }));

  return new Map([...files.entries()].sort(([a], [b]) => a.localeCompare(b)));
}
