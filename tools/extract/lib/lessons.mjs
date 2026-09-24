// A lesson file under assets/pdfs/ is a whole page; the lesson is <main> minus its back-link, header and footer.
import { JSDOM } from 'jsdom';
import { lessonId } from './ids.mjs';
import { rewriteHtml } from './links.mjs';

const squash = text => text.replace(/\s+/g, ' ').trim();

export function extractLesson(html, legacyPath, found = null) {
  const main = new JSDOM(html).window.document.querySelector('main');
  const header = main.querySelector('.doc-header');
  const subtitle = header?.querySelector('.subtitle');
  const meta = {
    title: squash(header?.querySelector('h1')?.textContent || ''),
    subtitle: subtitle ? squash(subtitle.textContent) : null,
    course_tag: squash(header?.querySelector('.course-tag')?.textContent || ''),
  };
  for (const chrome of main.querySelectorAll('.back-link, .doc-header, .doc-footer')) chrome.remove();

  const youtubeIds = [...main.querySelectorAll('iframe[src]')]
    .map(frame => frame.getAttribute('src').match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/)?.[1])
    .filter(Boolean);

  return {
    id: lessonId(legacyPath),
    legacy_path: legacyPath,
    ...meta,
    youtube_ids: youtubeIds,
    html: rewriteHtml(main.innerHTML.trim(), `assets/pdfs/${legacyPath}`, found),
  };
}
