// The fixed markup vocabulary of lesson HTML (LMS-ROADMAP, "Facts from the audit"). The extractor only reports what
// falls outside it; the hub's importer sanitises against content/vocabulary.json, the same list, so there is one allowlist.
import { JSDOM } from 'jsdom';

export const VOCABULARY = {
  tags: [
    'a', 'b', 'blockquote', 'br', 'code', 'div', 'em', 'h2', 'h3', 'h4', 'h5', 'hr', 'i', 'iframe', 'img', 'kbd', 'li', 'ol', 'p',
    'pre', 'section', 'span', 'strong', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'ul',
  ],
  attributes: {
    '*': ['class'],
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'loading', 'title', 'width', 'height'],
    iframe: ['src', 'title', 'allow', 'loading', 'referrerpolicy', 'allowfullscreen', 'frameborder', 'width', 'height'],
    ol: ['start', 'type'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan', 'scope'],
  },
  classes: ['tip', 'warning', 'activity', 'card', 'grid-2', 'img-row', 'img-side', 'img-small', 'video-embed', 'subtitle'],
  // Markdown code blocks name their language ("language-python"), which a highlighter can use later
  class_prefixes: ['language-'],
  iframe_hosts: ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com'],
};

export function checkVocabulary(html, where) {
  const findings = [];
  const note = detail => findings.push({ kind: 'vocabulary', where, detail });
  for (const el of JSDOM.fragment(html).querySelectorAll('*')) {
    const tag = el.tagName.toLowerCase();
    if (!VOCABULARY.tags.includes(tag)) {
      note(`tag <${tag}>`);
      continue;
    }
    const allowed = [...VOCABULARY.attributes['*'], ...(VOCABULARY.attributes[tag] || [])];
    for (const { name } of el.attributes) {
      if (!allowed.includes(name)) note(`attribute ${name} on <${tag}>`);
    }
    for (const cls of el.classList) {
      if (!VOCABULARY.classes.includes(cls) && !VOCABULARY.class_prefixes.some(p => cls.startsWith(p))) note(`class ${cls}`);
    }
    if (tag === 'iframe') {
      const src = el.getAttribute('src') || '';
      let host = '';
      try { host = new URL(src).host; } catch { /* reported below */ }
      if (!VOCABULARY.iframe_hosts.includes(host)) note(`iframe from ${src}`);
    }
  }
  return findings;
}
