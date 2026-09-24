// Builds every file under content/ in memory. Nothing here writes to disk; extract.mjs does.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildCourse, legacyKeys, parseCatalog } from './courses.mjs';

const asJson = value => `${JSON.stringify(value, null, 2)}\n`;

export async function generate(siteRoot) {
  const read = path => readFileSync(join(siteRoot, path), 'utf8');
  const { courseMetadata } = await import(pathToFileURL(join(siteRoot, 'assets/js/course-metadata.js')).href);
  const catalog = parseCatalog(read('catalog.html'));

  const files = new Map();
  const courses = [];
  for (const category of catalog) {
    for (const id of category.courseIds) {
      const course = buildCourse({ id, title: courseMetadata[id].name, category: category.name, html: read(`courses/${id}.html`) });
      courses.push(course);
      files.set(`content/courses/${id}.json`, asJson(course));
    }
  }

  const byId = new Map(courses.map(c => [c.id, c]));
  files.set('content/catalog.json', asJson({
    categories: catalog.map(category => ({
      name: category.name,
      courses: category.courseIds.map(id => {
        const { title, summary, status } = byId.get(id);
        return { id, title, summary, status };
      })
    }))
  }));

  files.set('content/legacy-map.json', asJson({
    urls: Object.fromEntries(courses.map(c => [`courses/${c.id}.html`, { course: c.id }])),
    progress: Object.fromEntries(courses.map(c => [c.id, legacyKeys(c)]))
  }));

  return new Map([...files.entries()].sort(([a], [b]) => a.localeCompare(b)));
}
