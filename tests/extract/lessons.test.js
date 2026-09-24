import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lessonId } from '../../tools/extract/lib/ids.mjs';
import { extractLesson } from '../../tools/extract/lib/lessons.mjs';
import { rewriteHtml, rewriteUrl } from '../../tools/extract/lib/links.mjs';
import { checkVocabulary } from '../../tools/extract/lib/vocabulary.mjs';
import { generate } from '../../tools/extract/lib/generate.mjs';

const SITE = fileURLToPath(new URL('../../', import.meta.url));
const read = path => readFileSync(new URL(path, new URL('../../', import.meta.url)), 'utf8');

const lessonPage = body => `<!DOCTYPE html><html lang="en"><head><base href="/site/" />
  <script src="assets/js/load-head.js" defer></script></head><body>
  <header></header><script src="/site/assets/js/load-header.js" type="module"></script>
  <main id="main-content">
    <a href="courses/hardware.html" class="back-link">&larr; Back to Computer Hardware</a>
    <div class="doc-header">
      <span class="course-tag">Computer Hardware</span>
      <h1>Ports and Cables</h1>
      <p class="subtitle">What plugs in where</p>
    </div>
    ${body}
    <div class="doc-footer"><p>NeuroDev Tech Class &mdash; Computer Hardware</p></div>
  </main><div id="footer-placeholder"></div></body></html>`;

// ── links ───────────────────────────────────────────────────────────────────

test('site links become new-site paths and nothing keeps the /site/ prefix', () => {
  assert.equal(rewriteUrl('courses/linux.html'), '/courses/linux');
  assert.equal(rewriteUrl('/site/courses/linux.html#unit-2'), '/courses/linux#unit-2');
  assert.equal(rewriteUrl('assets/images/hardware/building_a_pc_1.webp'), '/images/hardware/building_a_pc_1.webp');
  assert.equal(rewriteUrl('/site/assets/images/gimp/a.webp'), '/images/gimp/a.webp');
  assert.equal(rewriteUrl('assets/pdfs/it/linux/bash_1.html'), `/lessons/${lessonId('it/linux/bash_1.html')}`);
  // every page has <base href="/site/">, so relative links resolve against /site/, not the page's folder
  assert.equal(rewriteUrl('./courses/gimp.html', 'assets/pdfs/media/gimp/x.html'), '/courses/gimp');
});

test('outside links, mail links and in-page anchors are left alone', () => {
  for (const url of ['https://www.youtube.com/embed/abc', 'http://example.com/a?b=1', 'mailto:someone@example.com', '#step-3']) {
    assert.equal(rewriteUrl(url), url);
  }
});

test('a site link that points at nothing the new site serves is reported, not guessed', () => {
  const found = [];
  assert.equal(rewriteUrl('image.jpg', 'assets/pdfs/x/y.html', found), 'image.jpg');
  assert.deepEqual(found, [{ kind: 'unresolved-link', where: 'assets/pdfs/x/y.html', url: 'image.jpg' }]);
});

test('a code example that shows an href or src is text, and is never rewritten', () => {
  const found = [];
  const html = '<pre><code>&lt;img src="image.jpg" alt="My Image"&gt; &lt;a href="courses/gimp.html"&gt;</code></pre>';
  assert.equal(rewriteHtml(html, 'x.html', found), html);
  assert.deepEqual(found, []);
});

test('rewriting HTML touches href and src only', () => {
  const html = rewriteHtml('<p><a href="courses/gimp.html" class="tip">GIMP</a> <img src="assets/images/g.webp" alt="courses/gimp.html"></p>');
  assert.equal(html, '<p><a href="/courses/gimp" class="tip">GIMP</a> <img src="/images/g.webp" alt="courses/gimp.html"></p>');
});

// ── lessons ─────────────────────────────────────────────────────────────────

test('a lesson keeps its content and loses the page chrome', () => {
  const lesson = extractLesson(lessonPage(`
    <h2>USB</h2><div class="tip"><p>Look for the <strong>trident</strong>.</p></div>
    <img src="assets/images/hardware/usb.webp" alt="USB ports" class="img-small">
    <div class="video-embed"><iframe src="https://www.youtube.com/embed/d86ws7mQYIg?rel=0" title="Ports" allow="encrypted-media" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
    <p>Back to <a href="courses/hardware.html">the course</a>.</p>`), 'it/computer_hardware/ports.html');

  assert.deepEqual(
    { title: lesson.title, subtitle: lesson.subtitle, course_tag: lesson.course_tag, legacy_path: lesson.legacy_path },
    { title: 'Ports and Cables', subtitle: 'What plugs in where', course_tag: 'Computer Hardware', legacy_path: 'it/computer_hardware/ports.html' },
  );
  assert.equal(lesson.id, lessonId('it/computer_hardware/ports.html'));
  assert.deepEqual(lesson.youtube_ids, ['d86ws7mQYIg']);
  assert.match(lesson.html, /<h2>USB<\/h2>/);
  assert.match(lesson.html, /src="\/images\/hardware\/usb\.webp"/);
  assert.match(lesson.html, /href="\/courses\/hardware"/);
  for (const chrome of ['back-link', 'doc-header', 'doc-footer', 'Ports and Cables', 'load-header', 'footer-placeholder']) {
    assert.doesNotMatch(lesson.html, new RegExp(chrome), chrome);
  }
});

test('a lesson without a subtitle has none', () => {
  const page = lessonPage('<p>Hi</p>').replace('<p class="subtitle">What plugs in where</p>', '');
  assert.equal(extractLesson(page, 'x/y.html').subtitle, null);
});

// ── vocabulary ──────────────────────────────────────────────────────────────

test('markup outside the lesson vocabulary is reported with where it was found', () => {
  const findings = checkVocabulary(`
    <p style="color:red">x</p><script>alert(1)</script><img src="/images/a.webp" onerror="alert(1)" alt="">
    <div class="sparkly tip">y</div><iframe src="https://evil.example.com/embed"></iframe>`, 'x/y.html');
  assert.deepEqual(findings.map(f => f.detail), [
    'attribute style on <p>',
    'tag <script>',
    'attribute onerror on <img>',
    'class sparkly',
    'iframe from https://evil.example.com/embed',
  ]);
  assert.ok(findings.every(f => f.kind === 'vocabulary' && f.where === 'x/y.html'));
});

test('the ordinary lesson vocabulary raises nothing', () => {
  const html = `<h2>A</h2><h3>B</h3><h4>C</h4><p><strong>s</strong> <b>b</b> <em>e</em> <i>i</i> <code>c</code> <kbd>Ctrl</kbd><br></p>
    <ul><li>x</li></ul><ol start="2" type="a"><li>y</li></ol><pre><code>z</code></pre><blockquote>q</blockquote><hr>
    <table><thead><tr><th colspan="2">h</th></tr></thead><tbody><tr><td>d</td></tr></tbody></table>
    <div class="tip warning activity card grid-2 img-row img-side img-small"><span class="subtitle">s</span></div>
    <a href="https://example.com" target="_blank" rel="noopener noreferrer" title="t">l</a><img src="/images/a.webp" alt="a" loading="lazy">
    <div class="video-embed"><iframe src="https://www.youtube.com/embed/abc" title="v" allow="x" loading="lazy" referrerpolicy="y" allowfullscreen></iframe></div>`;
  assert.deepEqual(checkVocabulary(html, 'x.html'), []);
});

// ── the real site ───────────────────────────────────────────────────────────

test('the largest real lesson extracts whole, with every image moved to /images/', () => {
  const lesson = extractLesson(read('assets/pdfs/it/computer_hardware/building_a_pc.html'), 'it/computer_hardware/building_a_pc.html');
  const images = [...lesson.html.matchAll(/<img[^>]*src="([^"]+)"/g)].map(m => m[1]);
  assert.ok(images.length >= 50, `${images.length} images`);
  assert.ok(images.every(src => src.startsWith('/images/hardware/')));
  assert.ok(lesson.html.length > 40000);
});

const files = await generate(SITE);
const json = path => JSON.parse(files.get(path));

test('every lesson any course reaches is extracted once, including ones only an intro or note links to', () => {
  const index = json('content/lessons.json');
  const ids = Object.keys(index);
  // 150 lessons items point at, plus 4 only an intro or note links to (Building a PC, two Python I side notes,
  // Windows Node installation)
  assert.equal(ids.length, 154);
  for (const id of ids) assert.ok(files.has(`content/lessons/${id}.html`), id);
  const byPath = Object.fromEntries(Object.values(index).map(l => [l.legacy_path, l]));
  assert.deepEqual(byPath['it/computer_hardware/building_a_pc.html'].used_by, ['hardware']);
  assert.deepEqual(byPath['web-development/Windows-Node-Installation.html'].used_by, ['web-dev-2']);
  assert.deepEqual(byPath['computer-science/python-1-intro_to_programming/unit1/github_setup.html'].used_by,
    ['python-1', 'web-dev-1', 'web-dev-2']);
});

test('every lesson item points at its extracted lesson', () => {
  for (const path of [...files.keys()].filter(p => p.startsWith('content/courses/'))) {
    for (const item of json(path).units.flatMap(u => u.items).filter(i => i.type === 'lesson')) {
      assert.equal(item.payload.lesson_id, lessonId(item.payload.legacy_path));
      assert.ok(files.has(`content/lessons/${item.payload.lesson_id}.html`), item.payload.legacy_path);
    }
  }
});

test('course intros and notes link to the new site too', () => {
  const hardware = json('content/courses/hardware.json');
  assert.match(hardware.intro_html, new RegExp(`href="/lessons/${lessonId('it/computer_hardware/building_a_pc.html')}"`));
});

test('nothing generated keeps the old /site/ prefix', () => {
  for (const [path, body] of files) assert.doesNotMatch(body, /["'(]\/site\//, path);
});

test('the report names the one orphan lesson and every vocabulary finding', () => {
  const report = files.get('content/report.md');
  const orphans = report.split('## Lesson files no course reaches')[1].split('##')[0];
  assert.match(orphans, /computer-science\/python-1-intro_to_programming\/unit3\/pep-8_style_guide\.html/);
  assert.doesNotMatch(orphans, /Windows-Node-Installation/, 'Web Dev II links it from a note');
  assert.match(report, /the_blender_interface\.html`: attribute style on <strong>/);
  assert.doesNotMatch(report, /image\.jpg/, 'a code example is not a broken link');
});
