import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { generate } from '../../tools/extract/lib/generate.mjs';

const SITE = fileURLToPath(new URL('../../', import.meta.url));
const files = await generate(SITE);
const json = path => JSON.parse(files.get(path));

test('generating twice gives byte-identical output', async () => {
  const again = await generate(SITE);
  assert.deepEqual([...again.keys()], [...files.keys()]);
  for (const [path, body] of files) assert.equal(again.get(path), body, path);
});

test('the catalog keeps the site\'s categories and course names in order', () => {
  const catalog = json('content/catalog.json');
  assert.deepEqual(catalog.categories.map(c => c.name),
    ['Computer Basics', 'Computer Programming', 'I.T.', 'Web Development', 'Game Development', 'Media']);
  const basics = catalog.categories[0].courses;
  assert.deepEqual(basics.map(c => c.id), ['digital-literacy', 'ai-usage', 'office-software']);
  assert.equal(basics[0].title, 'Digital Literacy');
  assert.equal(basics[0].status, 'published');
  const webDev1 = catalog.categories.find(c => c.name === 'Web Development').courses.find(c => c.id === 'web-dev-1');
  assert.equal(webDev1.status, 'draft');
});

test('each course file carries its category and its title from course-metadata.js', () => {
  const course = json('content/courses/python-1.json');
  assert.equal(course.title, 'Python I - Programming Fundamentals');
  assert.equal(course.category, 'Computer Programming');
  assert.ok(course.summary.length > 20);
});

test('the legacy map covers every item of every course and every old course URL', () => {
  const map = json('content/legacy-map.json');
  for (const path of [...files.keys()].filter(p => p.startsWith('content/courses/'))) {
    const course = json(path);
    const items = course.units.flatMap(u => u.items);
    const keys = map.progress[course.id];
    assert.equal(Object.keys(keys).length, items.length, course.id);
    for (const item of items) assert.equal(keys[item.legacy_key], item.id);
    assert.deepEqual(map.urls[`courses/${course.id}.html`], { course: course.id });
  }
});

test('every file ends with a newline and JSON is two-space indented, so diffs stay readable', () => {
  for (const [path, body] of files) {
    assert.ok(body.endsWith('\n'), path);
    if (path.endsWith('.json')) assert.equal(body, `${JSON.stringify(JSON.parse(body), null, 2)}\n`, path);
  }
});
