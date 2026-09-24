import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { buildCourse, classifyItem, legacyKeys, parseCatalog, parseCoursePage } from '../../tools/extract/lib/courses.mjs';

const SITE = new URL('../../', import.meta.url);
const read = path => readFileSync(new URL(path, SITE), 'utf8');

const units = [
  {
    title: 'Unit 1: Basics',
    description: 'Start here.',
    content: [
      { type: 'video', title: 'Intro video', url: 'https://youtube.com/embed/d86ws7mQYIg' },
      { type: 'doc', title: 'Reading - Ports', url: 'assets/pdfs/it/computer_hardware/ports.html' },
      { type: 'doc', title: 'Unit 1 Test', url: 'https://docs.google.com/forms/d/e/abc/viewform' },
      { title: 'Slideshow - Why', url: 'https://docs.google.com/presentation/d/xyz/embed' },
      { type: 'html', html: 'Complete Lesson &amp; Exercise 1.2 - <a href="https://classroom.github.com/a/YRWXnfst">Data Types</a>' },
      { type: 'html', html: '<strong>Exercise 1.1:</strong> Record your voice.' },
      { type: 'html', html: 'Download and install <a href="https://www.audacityteam.org/download/">Audacity</a>.' }
    ]
  },
  {
    title: 'Unit 2: More',
    description: 'Keep going.',
    content: [
      { type: 'doc', title: 'Unit 2 Quiz', url: 'https://url' },
      { type: 'doc', title: 'Article - Prompting', url: 'https://example.com/article' },
      { type: 'doc', title: 'What Is ChatGPT Doing', url: 'https://example.com/book.pdf' }
    ]
  }
];

const page = (unitJson = JSON.stringify(units)) => `<!DOCTYPE html><html><head><base href="/site/" /></head><body>
  <header></header>
  <main id="main-content">
    <h1>Computer Hardware</h1>
    <section><h3>Course Overview</h3><p>
      Hands-on PC building.   Students build a computer.
    </p></section>
    <section><h3>Course Objectives</h3><ul><li>Identify hardware.</li><li>Build a PC.</li></ul></section>
    <section><h3>PC Building Guide</h3><ul><li><a href="assets/pdfs/it/computer_hardware/building_a_pc.html">Building a PC</a></li></ul></section>
    <script id="unit-data" type="application/json">${unitJson}</script>
    <div id="unit-container"></div>
  </main></body></html>`;

test('a course page gives its heading, intro sections and units', () => {
  const parsed = parseCoursePage(page());
  assert.equal(parsed.heading, 'Computer Hardware');
  assert.equal(parsed.summary, 'Hands-on PC building. Students build a computer.');
  assert.deepEqual(parsed.objectives, ['Identify hardware.', 'Build a PC.']);
  assert.match(parsed.introHtml, /PC Building Guide/);
  assert.match(parsed.introHtml, /building_a_pc\.html/);
  assert.doesNotMatch(parsed.introHtml, /unit-data|Course Overview|Course Objectives/, 'overview and objectives are fields, not intro');
  assert.equal(parsed.units.length, 2);
});

test('a page without unit data is not a course', () => {
  assert.equal(parseCoursePage('<main><h1>Coming soon</h1></main>'), null);
});

test('every kind of item is classified', () => {
  const kinds = units.flatMap(u => u.content).map(raw => {
    const item = classifyItem(raw);
    return [item.type, item.status, item.tags.join(',')];
  });
  assert.deepEqual(kinds, [
    ['video', 'ok', ''],
    ['lesson', 'ok', ''],
    ['test', 'needs_content', ''],
    ['slides', 'ok', ''],
    ['checkpoint', 'ok', 'github-exercise'],
    ['note', 'ok', 'exercise'],
    ['note', 'ok', ''],
    ['link', 'needs_content', ''],
    ['link', 'ok', ''],
    ['link', 'ok', '']
  ]);
});

test('each kind keeps what it needs', () => {
  const [video, lesson, form, slides, classroom, exercise] = units[0].content.map(classifyItem);
  assert.deepEqual(video.payload, { youtube_id: 'd86ws7mQYIg' });
  assert.equal(video.title, 'Intro video');
  assert.deepEqual(lesson.payload, { legacy_path: 'it/computer_hardware/ports.html' });
  assert.deepEqual(form.payload, { form_url: 'https://docs.google.com/forms/d/e/abc/viewform' });
  assert.deepEqual(slides.payload, { slides_url: 'https://docs.google.com/presentation/d/xyz/embed' });
  assert.deepEqual(classroom.payload, { classroom_url: 'https://classroom.github.com/a/YRWXnfst', label: 'Complete Lesson & Exercise 1.2 - Data Types' });
  assert.equal(exercise.payload.html, '<strong>Exercise 1.1:</strong> Record your voice.');
});

test('a course gets stable ids and the old site\'s progress keys, counted over every item', () => {
  const course = buildCourse({ id: 'hardware', title: 'Computer Hardware', category: 'I.T.', html: page() });
  const again = buildCourse({ id: 'hardware', title: 'Computer Hardware', category: 'I.T.', html: page() });
  assert.deepEqual(course, again);

  const [u1, u2] = course.units;
  assert.match(u1.id, /^u_/);
  assert.equal(u1.description, 'Start here.');
  assert.deepEqual(u1.items.map(i => i.legacy_key), ['0-0', '0-1', '0-2', '0-3', '0-4', '0-5', '0-6']);
  assert.deepEqual(u2.items.map(i => i.legacy_key), ['1-0', '1-1', '1-2']);
  assert.equal(new Set(course.units.flatMap(u => u.items).map(i => i.id)).size, 10);

  const keys = legacyKeys(course);
  assert.equal(Object.keys(keys).length, 10);
  assert.equal(keys['0-4'], u1.items[4].id);
});

test('a course with a placeholder link is a draft; others are published', () => {
  assert.equal(buildCourse({ id: 'x', title: 'X', category: 'C', html: page() }).status, 'draft');
  const clean = JSON.stringify([{ ...units[0] }]);
  assert.equal(buildCourse({ id: 'y', title: 'Y', category: 'C', html: page(clean) }).status, 'published');
});

test('the catalog lists categories in page order and ignores commented-out courses', () => {
  const catalog = parseCatalog(`<main>
    <section><h2>Computer Basics</h2><ul><li><a href="courses/digital-literacy.html">Digital Literacy</a></li></ul></section>
    <section><h2>Computer Programming</h2><ul>
      <li><a href="courses/python-1.html">Python I</a></li>
      <!-- <li><a href="courses/algorithms.html">Algorithms</a></li> -->
    </ul></section></main>`);
  assert.deepEqual(catalog, [
    { name: 'Computer Basics', courseIds: ['digital-literacy'] },
    { name: 'Computer Programming', courseIds: ['python-1'] }
  ]);
});

test('the real course pages classify into the counts measured on 2026-09-24', () => {
  const tally = {};
  let courses = 0;
  for (const file of readdirSync(new URL('courses/', SITE)).filter(f => f.endsWith('.html'))) {
    const id = file.replace(/\.html$/, '');
    const course = buildCourse({ id, title: id, category: '', html: read(`courses/${file}`) });
    if (!course) continue;
    courses += 1;
    for (const item of course.units.flatMap(u => u.items)) {
      const key = [item.type, ...item.tags, item.status === 'ok' ? '' : item.status].filter(Boolean).join(':');
      tally[key] = (tally[key] || 0) + 1;
    }
  }
  assert.equal(courses, 15);
  assert.deepEqual(tally, {
    lesson: 153,
    'checkpoint:github-exercise': 58,
    'test:needs_content': 13,
    slides: 9,
    video: 29,
    'note:exercise': 68,
    note: 63,
    'link:needs_content': 6,
    link: 7
  });
});

test('every real catalog course has a course page, and every course is in the catalog', () => {
  const catalogIds = parseCatalog(read('catalog.html')).flatMap(c => c.courseIds);
  const pageIds = readdirSync(new URL('courses/', SITE))
    .filter(f => f.endsWith('.html') && f !== 'under-construction.html')
    .map(f => f.replace(/\.html$/, ''));
  assert.deepEqual([...catalogIds].sort(), [...pageIds].sort());
});
