// The page GitHub Pages serves after cutover, in place of the old site: it sends every old address
// (neurodev-tech-class.github.io/site/...) to its page on the new site. Built from content/ at cutover:
//   node web/scripts/pages-redirect.mjs <out dir>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ORIGIN = 'https://tech.neurodevmentoring.com'

/** Old path (no /site/) -> new path, for the course and lesson pages in content/legacy-map.json */
export function redirectTable(legacy, courses, lessons) {
  const known = new Set(courses.map(c => c.id))
  const published = new Set(courses.filter(c => c.status === 'published').map(c => c.id))
  const firstItem = {}
  for (const course of courses.filter(c => published.has(c.id))) {
    for (const item of course.units.flatMap(u => u.items)) {
      const lesson = item.payload?.lesson_id
      if (lesson && !(lesson in firstItem)) firstItem[lesson] = item.id
    }
  }
  const coursePage = id => (published.has(id) ? `/courses/${id}` : known.has(id) ? '/catalog' : '/')
  return Object.fromEntries(Object.entries(legacy.urls).map(([url, target]) => {
    if (target.course) return [url, coursePage(target.course)]
    if (firstItem[target.lesson]) return [url, `/learn/${firstItem[target.lesson]}`]
    return [url, coursePage(lessons[target.lesson]?.used_by?.[0])]
  }))
}

// Runs in the browser too (the page carries its source), so it uses nothing from outside
export function newPath(pathname, table) {
  let path = pathname
  try { path = decodeURIComponent(pathname) } catch { /* keep it as it came */ }
  path = path.replace(/^\/site(?=\/|$)/, '').replace(/^\/+/, '')
  const pages = {
    '': '/', 'index.html': '/', 'catalog.html': '/catalog', 'resources.html': '/resources',
    'profile.html': '/my-courses', 'admin.html': '/admin',
  }
  return pages[path] ?? table[path] ?? '/'
}

export function stubPage(table, origin = ORIGIN) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>The NeuroDev Tech Class has moved</title>
<script>const TABLE = ${JSON.stringify(table)};
${newPath.toString()}
location.replace(${JSON.stringify(origin)} + newPath(location.pathname, TABLE) + location.hash);</script>
</head>
<body style="font-family:Arial,sans-serif;max-width:36rem;margin:3rem auto;padding:0 1rem;line-height:1.5">
<h1>The NeuroDev Tech Class has moved</h1>
<p>Your courses and progress are at <a href="${origin}/">${origin.replace(/^https?:\/\//, '')}</a>.</p>
</body>
</html>
`
}

export function writeStub(out, table, origin = ORIGIN) {
  mkdirSync(out, { recursive: true })
  const page = stubPage(table, origin)
  writeFileSync(join(out, 'index.html'), page)
  writeFileSync(join(out, '404.html'), page)
  writeFileSync(join(out, '.nojekyll'), '')
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const content = fileURLToPath(new URL('../../content/', import.meta.url))
  const read = name => JSON.parse(readFileSync(join(content, name), 'utf8'))
  const ids = read('catalog.json').categories.flatMap(c => c.courses).map(c => c.id)
  const table = redirectTable(read('legacy-map.json'), ids.map(id => read(`courses/${id}.json`)), read('lessons.json'))
  writeStub(process.argv[2] ?? '_site', table)
  console.log(`pages-redirect: ${Object.keys(table).length} old pages -> ${process.argv[2] ?? '_site'}`)
}
