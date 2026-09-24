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

  test('the home page marks Home as the current page', () => {
    const home = readFileSync(join(DIST, 'index.html'), 'utf8')
    expect(home).toMatch(/<a[^>]*href="\/"[^>]*aria-current="page"[^>]*>\s*Home/)
  })

  test('the favicon and logo each page points at exist', () => {
    for (const { html, file } of pages.map(page)) {
      for (const [, src] of html.matchAll(/(?:href|src)="(\/(?:favicon|logo)[^"]+)"/g)) {
        expect(existsSync(join(DIST, src)), `${file} links ${src}`).toBe(true)
      }
    }
  })
})
