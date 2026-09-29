import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { replaceSubmissionEmails, validateSpec, withoutChecklistBox } from '../../tools/extract/lib/checkpoints.mjs';
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
      { id: 'tried', type: 'checklist', label: 'Pick two', required: true, items: ['A', 'B', 'C'], min: 2 },
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
  fields.find(f => f.id === 'tried').min = 4;
  fields.find(f => f.id === 'repo').min = 1;
  bad['a/page.html'].required_one_of = [['repo', 'nope']];
  bad['note:linux:2-10'].requires_sign_off = true;
  bad['gone/page.html'] = { title: 'x', requires_sign_off: false, fields: [] };

  assert.deepEqual(validateSpec(bad, targets), [
    'a/page.html: min on repo, which is not a checklist',
    'a/page.html: file build lists no accepted extensions',
    'a/page.html: checklist steps has no items',
    'a/page.html: checklist tried asks for 4 of its 3 items',
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

test('a required checklist asks for every box, except the AI tools one, which asks for any two', () => {
  const checklists = checkpointFiles.flatMap(p => json(p).fields.filter(f => f.type === 'checklist'));
  const withMin = checklists.filter(f => 'min' in f);
  assert.deepEqual(withMin.map(f => [f.id, f.min, f.items.length]), [['features_tried', 2, 4]]);
});

// Uploads are for creative work only, and only the finished work (Topher, 2026-09-29)
const byName = name => checkpointFiles.map(json).find(c => `${c.course_id}: ${c.title}` === name);
const text = html => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

test('only the creative checkpoints take uploads', () => {
  const withUploads = checkpointFiles.map(json)
    .filter(c => c.fields.some(f => f.type === 'file' || f.type === 'image'))
    .map(c => `${c.course_id}: ${c.title}`).sort();
  assert.deepEqual(withUploads, [
    'audacity: Activity: 60-Second Personal Introduction',
    'audacity: Final Project: Mini Podcast Episode',
    'blender-zbrush-mini: Activity: Create a 3D Scene',
    'blender-zbrush-mini: Activity: Model & Print a Ring',
    'blender-zbrush-mini: Final Project',
    'davinci-resolve: Activity: Color Grade a Short Scene',
    'gimp: Activity: Movie Poster Design',
    'gimp: Activity: Photo Restoration',
    'gimp: Final Project: Portfolio Showcase',
  ]);
});

test('project files are never uploaded, only the finished work', () => {
  const accepted = checkpointFiles.flatMap(p => json(p).fields.flatMap(f => f.accept ?? []));
  assert.deepEqual([...new Set(accepted)].sort(), ['.mp3', '.obj', '.stl']);
  for (const name of ['audacity: Activity: 60-Second Personal Introduction', 'audacity: Final Project: Mini Podcast Episode']) {
    const [audio] = byName(name).fields.filter(f => f.type === 'file');
    assert.deepEqual([audio.accept, audio.multiple], [['.mp3'], false], name);
  }
});

test('office work is typed where the answer is content and linked where formatting is the skill', () => {
  for (const name of ['office-software: Application: Creating a Budget', 'office-software: Practice: Spreadsheets',
    'office-software: Worksheet: Spreadsheet Formulas']) {
    const checkpoint = byName(name);
    assert.ok(checkpoint.fields.every(f => !['file', 'url'].includes(f.type)), name);
    assert.ok(checkpoint.fields.filter(f => f.required).length >= 4, name);
    assert.deepEqual(checkpoint.required_one_of, [], name);
  }
  for (const name of ['office-software: Application: Creating a Résumé', 'office-software: Practice: Word Processors',
    'office-software: Application: Careers Day Presentation']) {
    const checkpoint = byName(name);
    const links = checkpoint.fields.filter(f => f.type === 'url');
    assert.deepEqual(links.map(f => f.required), [true], name);
    assert.deepEqual(checkpoint.required_one_of, [], name);
  }
});

test('the spreadsheet checkpoints carry their answers for the coach', () => {
  const formulas = byName('office-software: Worksheet: Spreadsheet Formulas').grading_hint.answers.join('\n');
  for (const answer of ['$247.46', '$15.12', '68%', '77%', 'April', 'Chicago', '2,746,388']) {
    assert.match(formulas, new RegExp(answer.replace(/[$.]/g, '\\$&')), answer);
  }
  const practice = byName('office-software: Practice: Spreadsheets').grading_hint.answers.join('\n');
  assert.match(practice, /=B2\*C2/);
  assert.match(practice, /\$80\.50/);
});

test('instructions no longer ask for screenshots or project files that are not handed in', () => {
  assert.doesNotMatch(text(byName('ai-usage: Final Assignment: AI Application').instructions_html), /screenshot/i);
  assert.doesNotMatch(text(byName('linux: Final Project: Linux Task Challenge').instructions_html), /screenshot/i);
  assert.doesNotMatch(text(byName('gimp: Final Project: Portfolio Showcase').instructions_html), /3 XCF project files —/);
  assert.doesNotMatch(text(byName('audacity: Final Project: Mini Podcast Episode').instructions_html), /saved and submitted/);
  assert.doesNotMatch(text(byName('audacity: Activity: 60-Second Personal Introduction').instructions_html),
    /Both a WAV file and a 192 kbps MP3 file are submitted/);
  assert.doesNotMatch(text(byName('blender-zbrush-mini: Activity: Create a 3D Scene').instructions_html), /Your \.blend file/);
  assert.doesNotMatch(text(byName('hardware: Final Project: Build a Custom PC').instructions_html), /Take photos/);
  assert.doesNotMatch(text(byName('hardware: Hands-on Exercise: Identifying Computer Hardware').instructions_html),
    /Take a photo/);
});

test('checkpoint instructions carry no page chrome, even when an override supplies them', () => {
  for (const path of checkpointFiles) {
    const { title, instructions_html: html } = json(path);
    assert.doesNotMatch(html, /class="(back-link|doc-header|doc-footer)"|← Back to/, title);
  }
});

test('the tick-box copy of a checklist leaves the instructions; its tip and the next section stay', () => {
  const html = withoutChecklistBox(`<div>
    <h2>Build it</h2><p>Model the ring.</p>
    <h2>Completion Checklist</h2>
    <p>Before submitting, check off every item:</p>
    <table><tr><td>☐</td><td>Torus made</td></tr></table>
    <div class="tip">Going Further: add a gem.</div>
    <h2>Submission</h2><p>Use the form below.</p>
  </div>`);
  const kept = text(html);
  assert.doesNotMatch(kept, /Completion Checklist|check off every item|Torus made/);
  assert.match(kept, /Model the ring\..*Going Further: add a gem\..*Submission Use the form below\./);
});

test('a checklist heading with no tick boxes under it is left alone', () => {
  const html = '<h2>Checklist</h2><p>Your coach goes through this with you.</p>';
  assert.equal(withoutChecklistBox(html), html);
});

test('checkpoints with a checklist question no longer repeat it as tick boxes in the instructions', () => {
  const withChecklist = checkpointFiles.map(json).filter(c => c.fields.some(f => f.type === 'checklist'));
  for (const checkpoint of withChecklist) {
    assert.doesNotMatch(checkpoint.instructions_html, /[☐□]/, checkpoint.title);
  }
  const castle = byName('unreal-engine: Activity: Castle Courtyard');
  assert.doesNotMatch(text(castle.instructions_html), /Completion Checklist/);
  assert.match(text(castle.instructions_html), /Going Further/);
});

test('a grading hint in the spec must list its answers', () => {
  const bad = structuredClone(good);
  bad['a/page.html'].grading_hint = { answers: [] };
  bad['note:linux:2-10'].grading_hint = 'D2 is =B2*C2';
  assert.deepEqual(validateSpec(bad, targets), [
    'a/page.html: grading_hint needs a list of answers',
    'note:linux:2-10: grading_hint needs a list of answers',
  ]);
  const fine = structuredClone(good);
  fine['a/page.html'].grading_hint = { answers: ['D2: =B2*C2'] };
  assert.deepEqual(validateSpec(fine, targets), []);
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
