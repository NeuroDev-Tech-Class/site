import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { replaceSubmissionEmails, validateSpec } from '../../tools/extract/lib/checkpoints.mjs';
import { generate } from '../../tools/extract/lib/generate.mjs';

const SITE = fileURLToPath(new URL('../../', import.meta.url));
const SUBMISSION_EMAILS = /neurodevtechcoach@gmail\.com|instructor@neurodevtech\.com/;

const targets = { lessons: new Set(['a/page.html']), notes: new Set(['note:linux:2-10']) };
const good = {
  'a/page.html': {
    title: 'Final Project',
    requires_sign_off: true,
    fields: [
      { id: 'design_notes', type: 'longText', label: 'Your design notes', required: true },
      { id: 'repo', type: 'url', label: 'Repository link', required: false },
      { id: 'build', type: 'file', label: 'Your file', required: false, accept: ['.blend'], multiple: false },
      { id: 'shots', type: 'image', label: 'Screenshots', required: false, multiple: true },
      { id: 'script', type: 'code', label: 'Your script', required: false, language: 'bash' },
      { id: 'steps', type: 'checklist', label: 'Before you submit', required: true, items: ['Saved', 'Rendered'] },
      { id: 'coach', type: 'mentorSignOff', label: 'Your coach sees it printed', required: true },
    ],
    required_one_of: [['repo', 'build']],
  },
  'note:linux:2-10': {
    title: 'Reflection: CLI vs GUI', requires_sign_off: false,
    fields: [{ id: 'reflection', type: 'longText', label: 'Your paragraph', required: true }],
  },
};

test('a well-formed spec has no problems', () => {
  assert.deepEqual(validateSpec(good, targets), []);
});

test('every kind of mistake in the spec is caught with where it is', () => {
  const bad = structuredClone(good);
  const fields = bad['a/page.html'].fields;
  fields.push({ id: 'design_notes', type: 'essay', label: '', required: true });
  fields.find(f => f.id === 'steps').items = [];
  fields.find(f => f.id === 'build').accept = [];
  bad['a/page.html'].required_one_of = [['repo', 'nope']];
  bad['note:linux:2-10'].requires_sign_off = true;
  bad['gone/page.html'] = { title: 'x', requires_sign_off: false, fields: [] };

  assert.deepEqual(validateSpec(bad, targets), [
    'a/page.html: file build lists no accepted extensions',
    'a/page.html: checklist steps has no items',
    'a/page.html: field id design_notes is used twice',
    'a/page.html: design_notes has unknown type essay',
    'a/page.html: design_notes has no label',
    'a/page.html: required_one_of names nope, which is not a field',
    'note:linux:2-10: requires_sign_off does not match its mentorSignOff fields',
    'gone/page.html: no course item has this page',
    'gone/page.html: has no fields',
  ]);
});

test('only the sentence asking for emailed work is replaced; the rest of the paragraph stays', () => {
  const replaced = [];
  const html = replaceSubmissionEmails(
    '<p>Write a few sentences about what surprised you. Email your notes to the tech coach at neurodevtechcoach@gmail.com.</p>',
    'ai/x.html', replaced,
  );
  assert.equal(html, '<p>Write a few sentences about what surprised you. Submit your work with the form below.</p>');
  assert.equal(replaced[0].after, 'Write a few sentences about what surprised you. Submit your work with the form below.');
});

test('a list item holding a paragraph is changed once, at the paragraph, keeping its heading', () => {
  const replaced = [];
  const html = replaceSubmissionEmails(
    '<ol><li><strong>Sharing</strong><p>Reach out for help if you get stuck. Once it looks right, share your spreadsheet with the tech coach at neurodevtechcoach@gmail.com.</p></li></ol>',
    'office/y.html', replaced,
  );
  assert.equal(replaced.length, 1);
  assert.match(html, /<strong>Sharing<\/strong>/);
  assert.match(html, /Reach out for help if you get stuck\. Submit your work with the form below\./);
});

test('submission-email instructions become "use the form" and each change is recorded', () => {
  const replaced = [];
  const html = replaceSubmissionEmails(`
    <h2>Submit</h2>
    <p>When you're done, email your file to <a href="mailto:neurodevtechcoach@gmail.com">neurodevtechcoach@gmail.com</a>.</p>
    <ol><li>Share the document with instructor@neurodevtech.com as a viewer.</li><li>Keep a copy.</li></ol>
    <p>Send a screenshot to your tech coach.</p>
    <p>Email is how most offices talk.</p>`, 'office/x.html', replaced);

  assert.doesNotMatch(html, SUBMISSION_EMAILS);
  assert.equal((html.match(/Submit your work with the form below\./g) || []).length, 3);
  assert.match(html, /<li>Keep a copy\.<\/li>/);
  assert.match(html, /Email is how most offices talk\./, 'talking about email is not an instruction to send work');
  assert.equal(replaced.length, 3);
  assert.ok(replaced.every(r => r.kind === 'email-replaced' && r.where === 'office/x.html' && r.before));
});

// ── the real site ───────────────────────────────────────────────────────────

const spec = JSON.parse(readFileSync(new URL('../../tools/extract/checkpoints.json', import.meta.url), 'utf8'));
const files = await generate(SITE);
const json = path => JSON.parse(files.get(path));
const checkpointFiles = [...files.keys()].filter(p => p.startsWith('content/checkpoints/'));

test('the real spec is valid against the real courses', () => {
  const report = files.get('content/report.md');
  assert.match(report, /## Checkpoint spec problems\n\n_None\._/);
});

test('every spec entry turned exactly one course item into a checkpoint', () => {
  const items = [...files.keys()].filter(p => p.startsWith('content/courses/'))
    .flatMap(p => json(p).units.flatMap(u => u.items).map(i => ({ ...i, course: json(p).id })));
  const fromSpec = items.filter(i => i.type === 'checkpoint' && !i.tags.includes('github-exercise'));
  assert.equal(fromSpec.length, Object.keys(spec).length);
  for (const item of fromSpec) {
    const checkpoint = json(`content/checkpoints/${item.payload.checkpoint_id}.json`);
    assert.equal(checkpoint.item_id, item.id);
    assert.equal(checkpoint.course_id, item.course);
    assert.ok(checkpoint.fields.length > 0 && checkpoint.instructions_html.length > 0, checkpoint.title);
  }
});

test('the note checkpoints keep their instructions', () => {
  const linux = json('content/courses/linux.json').units.flatMap(u => u.items).find(i => i.legacy_key === '2-10');
  assert.equal(linux.type, 'checkpoint');
  const checkpoint = json(`content/checkpoints/${linux.payload.checkpoint_id}.json`);
  assert.match(checkpoint.instructions_html, /CLI vs GUI/);
});

test('no checkpoint asks students to email their work, except the one where the email is the task', () => {
  for (const path of checkpointFiles) {
    const checkpoint = json(path);
    const keeps = checkpoint.legacy_path === 'computer-basics/digital-literacy/unit3/hands-on_exercise-email_account.html';
    if (keeps) assert.match(checkpoint.instructions_html, /neurodevtechcoach@gmail\.com/);
    else assert.doesNotMatch(checkpoint.instructions_html, SUBMISSION_EMAILS, checkpoint.title);
  }
});

test('a page that became a checkpoint is not also a stand-alone lesson', () => {
  const lessons = json('content/lessons.json');
  const paths = new Set(Object.values(lessons).map(l => l.legacy_path));
  for (const key of Object.keys(spec).filter(k => !k.startsWith('note:'))) assert.ok(!paths.has(key), key);
});

test('reviewer notes in the spec stay out of the checkpoint files and are listed in the report', () => {
  for (const path of checkpointFiles) {
    for (const field of json(path).fields) assert.equal(field.note, undefined, `${path} ${field.id}`);
  }
  const notes = Object.values(spec).flatMap(c => c.fields.filter(f => f.note));
  const section = files.get('content/report.md').split('## Spec notes to review')[1].split('\n## ')[0];
  assert.equal((section.match(/^- /gm) || []).length, notes.length);
});

test('the report lists every email instruction it replaced', () => {
  const section = files.get('content/report.md').split('## Email instructions replaced')[1].split('\n## ')[0];
  assert.match(section, /word_processors\/practice-word_processors\.html/);
  assert.doesNotMatch(section, /hands-on_exercise-email_account/);
});
