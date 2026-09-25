// Old-site URLs to new-site paths. Every old page sets <base href="/site/">, so relative links resolve against /site/.
import { JSDOM } from 'jsdom';
import { lessonId } from './ids.mjs';

const OLD_SITE = 'https://old-site.invalid/site/';

/** `found` collects what the caller should know: lesson links (to extract them) and links nothing will serve. */
export function rewriteUrl(url, where = '', found = null) {
  if (!url || /^(https?:|mailto:|#|data:)/i.test(url)) return url;
  const resolved = new URL(url, OLD_SITE);
  const path = decodeURIComponent(resolved.pathname).replace(/^\/(site\/)?/, '');

  const course = path.match(/^courses\/([\w-]+)\.html$/);
  if (course) return `/courses/${course[1]}${resolved.hash}`;
  const image = path.match(/^assets\/images\/(.+)$/);
  if (image) return `/images/${image[1]}`;
  const lesson = path.match(/^assets\/pdfs\/(.+\.html)$/);
  if (lesson) {
    found?.push({ kind: 'lesson-ref', where, path: lesson[1] });
    return `/lessons/${lessonId(lesson[1])}${resolved.hash}`;
  }
  found?.push({ kind: 'unresolved-link', where, url });
  return url;
}

/** Rewrites real href/src attributes only: a code example that shows `src="..."` as text is left alone. */
export function rewriteHtml(html, where = '', found = null) {
  const holder = JSDOM.fragment('<div></div>').firstChild;
  holder.innerHTML = html;
  for (const el of holder.querySelectorAll('[href], [src]')) {
    for (const attr of ['href', 'src']) {
      if (el.hasAttribute(attr)) el.setAttribute(attr, rewriteUrl(el.getAttribute(attr), where, found));
    }
  }
  return holder.innerHTML;
}
