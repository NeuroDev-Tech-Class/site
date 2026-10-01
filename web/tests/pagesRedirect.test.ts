import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { newPath, redirectTable, stubPage, writeStub } from '../scripts/pages-redirect.mjs'

const CONTENT = join(import.meta.dirname, '..', '..', 'content')
const DIST = join(import.meta.dirname, '..', 'dist')
const read = (name: string) => JSON.parse(readFileSync(join(CONTENT, name), 'utf8'))

const LEGACY = { urls: {
  'courses/gimp.html': { course: 'gimp' },
  'assets/pdfs/media/gimp/unit1/layers.html': { lesson: 'l_1' },
  'assets/pdfs/media/gimp/unit1/unused.html': { lesson: 'l_2' },
  'assets/pdfs/old/lost.html': { lesson: 'l_3' },
  'courses/web-dev-1.html': { course: 'web-dev-1' },
  'assets/pdfs/web/draft.html': { lesson: 'l_4' },
} }
const COURSES = [
  { id: 'gimp', status: 'published', units: [{ items: [
    { id: 'i_1', payload: { lesson_id: 'l_1' } }, { id: 'i_9', payload: { lesson_id: 'l_1' } }, { id: 'i_2', payload: {} },
  ] }] },
  { id: 'web-dev-1', status: 'draft', units: [{ items: [{ id: 'i_4', payload: { lesson_id: 'l_4' } }] }] },
]
const LESSONS = { l_1: { used_by: ['gimp'] }, l_2: { used_by: ['gimp'] }, l_3: { used_by: [] }, l_4: { used_by: ['web-dev-1'] } }
const TABLE = redirectTable(LEGACY, COURSES, LESSONS)

/** Runs the stub's script as a browser would, at an old address, and returns where it sent the visitor. */
function visit(page: string, pathname: string, hash = '') {
  const script = page.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? ''
  let went = ''
  new Function('location', script)({ pathname, hash, replace: (url: string) => { went = url } })
  return went
}

let out: string | undefined
afterEach(() => { if (out) rmSync(out, { recursive: true, force: true }) })

describe('where each old address goes', () => {
  test('a course page goes to the course; a lesson to the first item showing it, else its course; drafts to the catalog', () => {
    expect(TABLE).toEqual({
      'courses/gimp.html': '/courses/gimp',
      'assets/pdfs/media/gimp/unit1/layers.html': '/learn/i_1',
      'assets/pdfs/media/gimp/unit1/unused.html': '/courses/gimp',
      'assets/pdfs/old/lost.html': '/',
      'courses/web-dev-1.html': '/catalog',
      'assets/pdfs/web/draft.html': '/catalog',
    })
  })

  test('the old pages go to their new homes, under /site/ or not, and anything else goes home', () => {
    const cases: [string, string][] = [
      ['/site/', '/'], ['/site', '/'], ['/site/index.html', '/'], ['/site/catalog.html', '/catalog'],
      ['/site/resources.html', '/resources'], ['/site/profile.html', '/my-courses'], ['/site/admin.html', '/admin'],
      ['/site/courses/gimp.html', '/courses/gimp'], ['/courses/gimp.html', '/courses/gimp'],
      ['/site/slides.html', '/'], ['/site/nothing-here.html', '/'],
    ]
    expect(cases.map(([from]) => [from, newPath(from, TABLE)])).toEqual(cases)
  })
})

describe('the redirect page', () => {
  test('sends the visitor on at once, keeping the part after #, with a link for anyone without script', () => {
    const page = stubPage(TABLE, 'https://tech.example.com')
    expect(visit(page, '/site/assets/pdfs/media/gimp/unit1/layers.html', '#step-2'))
      .toBe('https://tech.example.com/learn/i_1#step-2')
    expect(visit(page, '/site/')).toBe('https://tech.example.com/')
    expect(page).toContain('<meta name="robots" content="noindex">')
    expect(page).toContain('<a href="https://tech.example.com/">')
  })

  test('is written as the home page and the not-found page, so every old address reaches it', () => {
    out = mkdtempSync(join(tmpdir(), 'pages-'))
    writeStub(out, TABLE, 'https://tech.example.com')
    expect(readFileSync(join(out, 'index.html'), 'utf8')).toBe(readFileSync(join(out, '404.html'), 'utf8'))
    expect(existsSync(join(out, '.nojekyll'))).toBe(true)
  })
})

describe('the real content', () => {
  test('every old address in content/legacy-map.json lands on a page the site builds', () => {
    const table = redirectTable(read('legacy-map.json'), readCourses(), read('lessons.json'))
    expect(Object.keys(table)).toHaveLength(Object.keys(read('legacy-map.json').urls).length)
    const missing = Object.entries(table).filter(([, to]) => !existsSync(join(DIST, to, 'index.html')))
    expect(missing).toEqual([])
  })
})

function readCourses() {
  const catalog = read('catalog.json') as { categories: { courses: { id: string }[] }[] }
  return catalog.categories.flatMap(c => c.courses).map(c => read(join('courses', `${c.id}.json`)))
}
