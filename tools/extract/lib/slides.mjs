// Slide decks rebuilt in the site (tools/extract/slides/<Google deck id>.md), replacing the Google Slides links.
// Slides are separated by --- lines; each is markdown within the lesson vocabulary. Images live under
// assets/images/slides/<deck>/, so the site serves them like every other course image.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { renderMarkdown } from './exercises.mjs';
import { checkVocabulary } from './vocabulary.mjs';

const DECKS = 'tools/extract/slides';

export function deckId(url) {
  return url.match(/^https:\/\/docs\.google\.com\/presentation\/(?:u\/\d+\/)?d\/([A-Za-z0-9_-]+)/)?.[1] ?? null;
}

export function slidesFromMarkdown(markdown, where) {
  return markdown.replace(/\r\n/g, '\n').split(/^---[ \t]*$/m).map((part, index) => {
    const html = renderMarkdown(part.trim());
    if (!html) throw new Error(`${where}: slide ${index + 1} is empty`);
    const [finding] = checkVocabulary(html, where);
    if (finding) throw new Error(`${where}: slide ${index + 1} has ${finding.detail}`);
    return html;
  });
}

export function loadDecks(siteRoot) {
  const dir = join(siteRoot, DECKS);
  if (!existsSync(dir)) return new Map();
  return new Map(readdirSync(dir).filter(name => name.endsWith('.md')).sort().map(name => {
    const id = name.slice(0, -3);
    return [id, slidesFromMarkdown(readFileSync(join(dir, name), 'utf8'), `${DECKS}/${name}`)];
  }));
}

/** The course with each rebuilt deck's slides in place of its Google link; `used` collects the decks it took. */
export function withSlides(course, decks, used) {
  for (const item of course.units.flatMap(unit => unit.items)) {
    if (item.type !== 'slides') continue;
    const id = deckId(item.payload.slides_url ?? '');
    if (!decks.has(id)) continue;
    item.payload = { slides: decks.get(id) };
    used.add(id);
  }
  return course;
}
