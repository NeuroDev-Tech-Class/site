// Course pages and the catalog: courses/*.html carry their units as inline JSON in <script id="unit-data">.
import { JSDOM } from 'jsdom';
import { itemId, unitId } from './ids.mjs';

const LESSON_PREFIX = 'assets/pdfs/';
const PLACEHOLDER_URL = 'https://url';

const squash = text => text.replace(/\s+/g, ' ').trim();
const textOf = html => squash(JSDOM.fragment(html).textContent);

function youtubeId(url) {
  const match = url.match(/(?:embed\/|watch\?v=|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}

export function parseCoursePage(html) {
  const doc = new JSDOM(html).window.document;
  const script = doc.getElementById('unit-data');
  if (!script) return null;

  let summary = '';
  let objectives = [];
  const intro = [];
  for (const section of doc.querySelectorAll('main section')) {
    const heading = squash(section.querySelector('h3')?.textContent || '');
    if (heading === 'Course Overview') {
      summary = squash([...section.querySelectorAll('p')].map(p => p.textContent).join(' '));
    } else if (heading === 'Course Objectives') {
      objectives = [...section.querySelectorAll('li')].map(li => squash(li.textContent));
    } else {
      intro.push(section.outerHTML);
    }
  }
  return {
    heading: squash(doc.querySelector('main h1')?.textContent || ''),
    summary,
    objectives,
    introHtml: intro.join('\n'),
    units: JSON.parse(script.textContent)
  };
}

export function classifyItem(raw) {
  const url = raw.url || '';
  const html = raw.html || '';
  const item = (type, extra = {}) => ({ type, title: raw.title ?? null, status: 'ok', tags: [], payload: {}, ...extra });

  if (raw.type === 'video') return item('video', { payload: { youtube_id: youtubeId(url) } });
  if (raw.type === 'html') {
    const classroom = html.match(/https:\/\/classroom\.github\.com\/[^"'\s<>]+/);
    if (classroom) {
      return item('checkpoint', { tags: ['github-exercise'], payload: { classroom_url: classroom[0], label: textOf(html) } });
    }
    if (/Exercise\s+\d+\.\d+/.test(html)) return item('note', { tags: ['exercise'], payload: { html } });
    return item('note', { payload: { html } });
  }
  if (url.includes('docs.google.com/forms')) return item('test', { status: 'needs_content', payload: { form_url: url } });
  if (url.includes('docs.google.com/presentation')) return item('slides', { payload: { slides_url: url } });
  if (url === PLACEHOLDER_URL) return item('link', { status: 'needs_content', payload: { url: null } });
  if (url.startsWith(LESSON_PREFIX) && url.endsWith('.html')) {
    return item('lesson', { payload: { legacy_path: url.slice(LESSON_PREFIX.length) } });
  }
  return item('link', { payload: { url } });
}

export function buildCourse({ id, title, category, html }) {
  const parsed = parseCoursePage(html);
  if (!parsed) return null;
  const units = parsed.units.map((unit, unitIndex) => ({
    id: unitId(id, unitIndex, unit.title),
    legacy_key: String(unitIndex),
    title: unit.title,
    description: unit.description ?? '',
    items: (unit.content || []).map((raw, itemIndex) => ({
      id: itemId(id, unitIndex, itemIndex, raw.url || raw.html || ''),
      // The old site's progress key: position over every item, notes included (link-generator.js)
      legacy_key: `${unitIndex}-${itemIndex}`,
      ...classifyItem(raw)
    }))
  }));
  // A course still carrying placeholder links isn't ready for students (web-dev-1 today)
  const unfinished = units.some(u => u.items.some(i => i.type === 'link' && i.status === 'needs_content'));
  return {
    id,
    title,
    category,
    status: unfinished ? 'draft' : 'published',
    heading: parsed.heading,
    summary: parsed.summary,
    objectives: parsed.objectives,
    intro_html: parsed.introHtml,
    units
  };
}

export function legacyKeys(course) {
  return Object.fromEntries(course.units.flatMap(u => u.items).map(i => [i.legacy_key, i.id]));
}

export function parseCatalog(html) {
  const doc = new JSDOM(html).window.document;
  return [...doc.querySelectorAll('main h2')].map(heading => {
    const courseIds = [];
    for (let node = heading.nextElementSibling; node && node.tagName !== 'H2'; node = node.nextElementSibling) {
      for (const link of node.querySelectorAll('a[href]')) {
        const match = link.getAttribute('href').match(/courses\/([\w-]+)\.html/);
        if (match) courseIds.push(match[1]);
      }
    }
    return { name: squash(heading.textContent), courseIds };
  });
}
