// Checks the built site in dist/ (run `npm run build` first). Every page must stand on its own for screen readers
// and keyboards, and nothing may still point at the old GitHub Pages /site/ prefix.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { unzipSync } from 'fflate'
import { describe, expect, test } from 'vitest'

const DIST = fileURLToPath(new URL('../dist/', import.meta.url))

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name)
    return entry.isDirectory() ? filesUnder(full) : [full]
  })
}

const files = existsSync(DIST) ? filesUnder(DIST) : []
const pages = files.filter(f => f.endsWith('.html'))
const page = (file: string) => ({ file: relative(DIST, file), html: readFileSync(file, 'utf8') })

describe('the built site', () => {
  test('exists (run npm run build first)', () => {
    expect(pages.length).toBeGreaterThan(0)
  })

  test('never refers to the old /site/ prefix', () => {
    for (const file of files.filter(f => /\.(html|js|css|json|xml|txt)$/.test(f))) {
      expect(readFileSync(file, 'utf8'), relative(DIST, file)).not.toMatch(/["'(]\/site\//)
    }
  })

  test.each(pages.map(page))('$file has a language, a title, one h1 and a skip link to the main content', ({ html }) => {
    expect(html).toMatch(/<html[^>]* lang="en"/)
    expect(html).toMatch(/<title>[^<]+<\/title>/)
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1)
    expect(html).toMatch(/<a[^>]+href="#main"[^>]*>Skip to content<\/a>/)
    expect(html).toMatch(/<main[^>]+id="main"/)
  })

  test.each(pages.map(page))('$file has the shared header, footer and theme handling', ({ html }) => {
    const nav = html.match(/<nav[^>]*aria-label="Main"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? ''
    expect([...nav.matchAll(/<a[^>]*>([^<]+)<\/a>/g)].map(m => m[1].trim()))
      .toEqual(['Home', 'Course Catalog', 'Resources'])
    expect(html).toMatch(/<footer[\s\S]*Back to top[\s\S]*<\/footer>/)
    expect(html).toMatch(/Switch to (light|dark) theme/)
    // The theme is applied before the page paints, and again after each in-site navigation
    expect(html).toMatch(/<script[^>]*>[^<]*localStorage[^<]*astro:after-swap/)
    expect(html).toMatch(/<meta name="astro-view-transitions-enabled"/)
  })

  test.each([
    ['index.html', '/', 'Home'],
    ['catalog/index.html', '/catalog', 'Course Catalog'],
    ['resources/index.html', '/resources', 'Resources'],
  ])('%s marks %s as the current page', (file, href, label) => {
    const html = readFileSync(join(DIST, file), 'utf8')
    expect(html).toMatch(new RegExp(`<a[^>]*href="${href}"[^>]*aria-current="page"[^>]*>\\s*${label}`))
    expect(html.match(/aria-current="page"/g)).toHaveLength(1)
  })

  test('every local image, favicon and logo a page points at exists', () => {
    // Every page shares the header's logos, so each path is looked up on disk once
    const found = new Map<string, boolean>()
    const exists = (src: string) => found.get(src) ?? found.set(src, existsSync(join(DIST, src))).get(src)
    for (const { html, file } of pages.map(page)) {
      for (const [, src] of html.matchAll(/(?:href|src)="(\/(?:favicon|logo|images\/)[^"]+)"/g)) {
        expect(exists(src), `${file} links ${src}`).toBe(true)
      }
    }
  })

  test('has the public pages, the sign-in pages and a not-found page', () => {
    const signInPages = ['sign-in', 'register', 'verify', 'forgot-password', 'reset-password', 'waiting']
    for (const path of ['index.html', 'catalog/index.html', 'resources/index.html', '404.html',
      ...signInPages.map(page => `${page}/index.html`)]) {
      expect(existsSync(join(DIST, path)), path).toBe(true)
    }
  })
})

describe('the catalog and course pages', () => {
  const catalogJson = JSON.parse(readFileSync(new URL('../../content/catalog.json', import.meta.url), 'utf8')) as {
    categories: { name: string, courses: { id: string, title: string, status: string }[] }[]
  }
  const all = catalogJson.categories.flatMap(c => c.courses)
  const published = all.filter(c => c.status === 'published')
  const catalogHtml = () => readFileSync(join(DIST, 'catalog/index.html'), 'utf8')

  test('the catalog links every published course and no draft', () => {
    for (const { id } of published) expect(catalogHtml()).toContain(`href="/courses/${id}"`)
    for (const { id } of all.filter(c => c.status !== 'published')) expect(catalogHtml()).not.toContain(`/courses/${id}"`)
  })

  test('every published course has a page, and drafts have none', () => {
    for (const { id } of published) expect(existsSync(join(DIST, `courses/${id}/index.html`)), id).toBe(true)
    for (const { id } of all.filter(c => c.status !== 'published')) expect(existsSync(join(DIST, `courses/${id}`)), id).toBe(false)
  })

  // The Sign in button (and its way back) appears once the page knows the visitor is signed out: CourseProgress.test
  test('a course page is built with its heading and a loading line where Sign in or progress will go', () => {
    const html = readFileSync(join(DIST, 'courses/digital-literacy/index.html'), 'utf8')
    expect(html).toMatch(/<h1[^>]*>Digital Literacy<\/h1>/)
    expect(html).toContain('Loading your progress…')
  })

  test('the home page points new students at Digital Literacy and no longer mentions a password', () => {
    const home = readFileSync(join(DIST, 'index.html'), 'utf8')
    expect(home).toContain('href="/courses/digital-literacy"')
    expect(home).not.toMatch(/password/i)
  })
})

const text = (html: string) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')
const read = (path: string) => readFileSync(join(DIST, path), 'utf8')

describe('the revamped pages', () => {
  test('the header carries a logo for each theme', () => {
    const header = read('index.html').match(/<header[\s\S]*?<\/header>/)?.[0] ?? ''
    expect(header).toContain('src="/logo-white.png"')
    expect(header).toContain('src="/logo-black.png"')
  })

  test("every page's footer gives the phone number, tappable on a phone", () => {
    for (const { file, html } of pages.map(page)) {
      const footer = html.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? ''
      expect(footer, file).toMatch(/<a[^>]*href="tel:\+18017345508"[^>]*>801-734-5508<\/a>/)
    }
  })

  test("every page's header has the notification bell beside the account menu", () => {
    for (const { file, html } of pages.map(page)) {
      const header = html.match(/<header[\s\S]*?<\/header>/)?.[0] ?? ''
      expect(header, file).toMatch(/component-url="[^"]*NotificationBell[^"]*"/)
    }
  })

  test('home opens with a way in and the three steps', () => {
    const home = read('index.html')
    expect(home).toMatch(/<a[^>]*href="\/courses\/digital-literacy"[^>]*>\s*Start with Digital Literacy/)
    expect(home).toMatch(/<a[^>]*href="\/catalog"[^>]*>\s*Browse the catalog/)
    const steps = home.match(/<ol[^>]*data-steps[^>]*>([\s\S]*?)<\/ol>/)?.[1] ?? ''
    expect([...steps.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map(m => m[1].trim()))
      .toEqual(['Create an account', 'Learn at your own pace', 'Earn certificates'])
  })

  test('every catalog card shows its units and items, and every category heading has an icon', () => {
    const html = read('catalog/index.html')
    const cards = html.match(/<li[^>]*data-course[^>]*>[\s\S]*?<\/li>/g) ?? []
    expect(cards).toHaveLength(14)
    for (const card of cards) expect(text(card)).toMatch(/\d+ units?\b.*\b\d+ items?\b/)
    const headings = html.match(/<h2[^>]*>[\s\S]*?<\/h2>/g) ?? []
    expect(headings).toHaveLength(6)
    for (const heading of headings) expect(heading).toContain('<svg')
  })

  test('every item on a course page carries an icon with its label', () => {
    const html = read('courses/digital-literacy/index.html')
    const items = html.match(/<li[^>]*data-item[^>]*>[\s\S]*?<\/li>/g) ?? []
    expect(items.length).toBeGreaterThan(30)
    for (const item of items) expect(item).toContain('<svg')
  })

  test('Resources keeps a space between a link and the words after it', () => {
    expect(text(read('resources/index.html'))).toContain('Atwood Innovation Plaza (Access to 3D printers')
  })
})

const CONTENT = fileURLToPath(new URL('../../content/', import.meta.url))
type ContentItem = { id: string, type: string, payload: { lesson_id?: string, checkpoint_id?: string } }
const published = readdirSync(join(CONTENT, 'courses'))
  .map(name => JSON.parse(readFileSync(join(CONTENT, 'courses', name), 'utf8')))
const itemsOf = (courses: typeof published): ContentItem[] =>
  courses.flatMap(c => c.units.flatMap((u: { items: ContentItem[] }) => u.items))
const PAGED = ['lesson', 'video', 'slides', 'link', 'checkpoint', 'test']

describe('item pages', () => {
  const learn = (id: string) => join(DIST, 'learn', id, 'index.html')

  test('every reading, video, slides, link, checkpoint and test of a published course has one, and nothing else does', () => {
    const live = itemsOf(published.filter(c => c.status === 'published'))
    for (const item of live) expect(existsSync(learn(item.id)), item.id).toBe(PAGED.includes(item.type))
    for (const item of itemsOf(published.filter(c => c.status !== 'published'))) {
      expect(existsSync(learn(item.id)), `draft ${item.id}`).toBe(false)
    }
    expect(readdirSync(join(DIST, 'learn'))).toHaveLength(267)
  })

  test('never carry the lesson text, which only comes from the hub after sign-in', () => {
    const live = itemsOf(published.filter(c => c.status === 'published')).filter(i => i.type === 'lesson')
    expect(live.length).toBe(116)
    for (const item of live) {
      const lesson = readFileSync(join(CONTENT, 'lessons', `${item.payload.lesson_id}.html`), 'utf8')
      const words = text(lesson).trim().split(' ').slice(0, 12).join(' ')
      expect(text(read(`learn/${item.id}/index.html`)), item.id).not.toContain(words)
    }
  })

  test("never carry a checkpoint's instructions, which also come from the hub after sign-in", () => {
    const live = itemsOf(published.filter(c => c.status === 'published')).filter(i => i.type === 'checkpoint')
    expect(live.length).toBe(94)
    for (const item of live) {
      const checkpoint = JSON.parse(readFileSync(join(CONTENT, 'checkpoints', `${item.payload.checkpoint_id}.json`), 'utf8'))
      const words = text(checkpoint.instructions_html).trim().split(' ').slice(0, 12).join(' ')
      if (words.split(' ').length >= 6) expect(text(read(`learn/${item.id}/index.html`)), item.id).not.toContain(words)
    }
  })

  test('are kept out of search engines', () => {
    for (const dir of readdirSync(join(DIST, 'learn'))) {
      expect(read(`learn/${dir}/index.html`), dir).toContain('<meta name="robots" content="noindex"')
    }
  })

  test('every item link on a course page leads to one', () => {
    for (const dir of readdirSync(join(DIST, 'courses'))) {
      for (const [, id] of read(`courses/${dir}/index.html`).matchAll(/href="\/learn\/([^"#?]+)"/g)) {
        expect(existsSync(learn(id)), `${dir} -> ${id}`).toBe(true)
      }
    }
  })
})

describe('My Courses', () => {
  test('has its own page, kept out of search engines', () => {
    const html = read('my-courses/index.html')
    expect(html).toContain('<meta name="robots" content="noindex"')
    expect(html).toMatch(/<h1[^>]*>\s*My Courses\s*<\/h1>/)
  })
})

describe('the dashboard', () => {
  test('is one page kept out of search engines, built showing "Loading" with its heading and room for tables', () => {
    const html = read('admin/index.html')
    expect(html).toContain('<meta name="robots" content="noindex"')
    expect(html).toMatch(/<h1[^>]*>\s*Dashboard\s*<\/h1>/)
    expect(text(html)).toContain('Loading…')
    expect(text(html)).not.toMatch(/Sign in with a coach account|The dashboard is for coaches/)
    expect(html).toMatch(/<main[^>]*class="[^"]*max-w-7xl/)
  })
})

describe('pages that depend on the sign-in', () => {
  test('are built showing "Loading", never telling a signed-in student to sign in first', () => {
    const wording = /Sign in to (open this|start this course|see the courses)/
    expect(read('my-courses/index.html')).not.toMatch(wording)
    expect(read('courses/gimp/index.html')).not.toMatch(wording)
    for (const dir of readdirSync(join(DIST, 'learn')).slice(0, 20)) {
      expect(read(`learn/${dir}/index.html`), dir).not.toMatch(wording)
    }
  })
})

describe('exercise starters', () => {
  const SITE = fileURLToPath(new URL('../../', import.meta.url))
  const CHECKPOINTS = join(SITE, 'content/checkpoints')
  const withStarters = readdirSync(CHECKPOINTS)
    .map(name => JSON.parse(readFileSync(join(CHECKPOINTS, name), 'utf8')))
    .filter(checkpoint => checkpoint.starter_path)

  test('every exercise with starter code has one', () => {
    expect(withStarters).toHaveLength(56)
  })

  test.each(withStarters.map(c => [c.exercise, c]))('%s: its starter is zipped whole, inside a folder of its own', (_, c) => {
    const starter = join(SITE, c.starter_path)
    const folder = c.exercise.split('/').pop()
    const expected = filesUnder(starter).map(f => `${folder}/${relative(starter, f).split('\\').join('/')}`).sort()
    const zip = unzipSync(readFileSync(join(DIST, 'starters', `${c.id}.zip`)))
    expect(Object.keys(zip).sort()).toEqual(expected)
    for (const name of expected) {
      expect(Buffer.from(zip[name]).equals(readFileSync(join(starter, name.slice(folder.length + 1)))), name).toBe(true)
    }
  })

  test('nothing else is served under /starters', () => {
    expect(readdirSync(join(DIST, 'starters')).sort()).toEqual(withStarters.map(c => `${c.id}.zip`).sort())
  })
})
