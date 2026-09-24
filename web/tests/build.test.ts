// Checks the built site in dist/ (run `npm run build` first). Every page must stand on its own for screen readers
// and keyboards, and nothing may still point at the old GitHub Pages /site/ prefix.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
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
    for (const { html, file } of pages.map(page)) {
      for (const [, src] of html.matchAll(/(?:href|src)="(\/(?:favicon|logo|images\/)[^"]+)"/g)) {
        expect(existsSync(join(DIST, src)), `${file} links ${src}`).toBe(true)
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

  test('a course page invites a signed-out visitor to sign in and come back', () => {
    const html = readFileSync(join(DIST, 'courses/digital-literacy/index.html'), 'utf8')
    expect(html).toMatch(/<h1[^>]*>Digital Literacy<\/h1>/)
    expect(html).toMatch(/href="\/sign-in\?next=%2Fcourses%2Fdigital-literacy"[^>]*>\s*Sign in to start this course/)
  })

  test('the home page points new students at Digital Literacy and no longer mentions a password', () => {
    const home = readFileSync(join(DIST, 'index.html'), 'utf8')
    expect(home).toContain('href="/courses/digital-literacy"')
    expect(home).not.toMatch(/password/i)
  })
})
