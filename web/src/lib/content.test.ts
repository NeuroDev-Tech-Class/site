import { describe, expect, test } from 'vitest'
import {
  catalog,
  categoryKey,
  courseStats,
  courses,
  itemLabel,
  itemPages,
  publishedCatalog,
  publishedCourses,
  sanitize,
  slidesEmbedUrl,
  unitHeading,
  unitViews,
  type Catalog,
  type Course,
  type Item,
} from './content'

const item = (type: Item['type'], title: string | null): Item =>
  ({ id: 'i_1', legacy_key: '0-0', type, title, status: 'ok', tags: [], payload: {} })

describe('publishedCatalog', () => {
  const fixture: Catalog = {
    categories: [
      { name: 'Basics', courses: [
        { id: 'a', title: 'A', summary: '', status: 'published' },
        { id: 'b', title: 'B', summary: '', status: 'draft' },
      ] },
      { name: 'Only drafts', courses: [{ id: 'c', title: 'C', summary: '', status: 'draft' }] },
      { name: 'Media', courses: [{ id: 'd', title: 'D', summary: '', status: 'published' }] },
    ],
  }

  test('keeps categories and courses in order, leaving out drafts and categories left empty', () => {
    expect(publishedCatalog(fixture).map(c => [c.name, c.courses.map(x => x.id)]))
      .toEqual([['Basics', ['a']], ['Media', ['d']]])
  })
})

describe('the committed content', () => {
  const listed = publishedCatalog(catalog).flatMap(c => c.courses.map(x => x.id))

  test('lists the six categories in the old catalog order', () => {
    expect(publishedCatalog(catalog).map(c => c.name)).toEqual([
      'Computer Basics', 'Computer Programming', 'I.T.', 'Web Development', 'Game Development', 'Media',
    ])
  })

  test('has a published course for every published catalog entry, and keeps the web-dev-1 draft out', () => {
    expect(listed).toHaveLength(14)
    expect(listed).not.toContain('web-dev-1')
    for (const id of listed) expect(courses.find(c => c.id === id)?.status, id).toBe('published')
  })
})

describe('sanitize', () => {
  test('removes scripts, event handlers and javascript: links', () => {
    const html = sanitize('<p onclick="x()">Hi<script>alert(1)</script></p><img src="/a.webp" onerror="alert(1)" alt="a"><a href="javascript:alert(1)">x</a>')
    expect(html).not.toMatch(/script|onclick|onerror|javascript:/)
    expect(html).toContain('<img src="/a.webp" alt="a" />')
  })

  test('keeps the vocabulary classes, including language- on code, and drops anything else', () => {
    expect(sanitize('<div class="tip evil">t</div>')).toBe('<div class="tip">t</div>')
    expect(sanitize('<code class="language-python">x</code>')).toBe('<code class="language-python">x</code>')
  })

  test('keeps YouTube embeds and drops iframes from anywhere else', () => {
    expect(sanitize('<iframe src="https://www.youtube.com/embed/abc"></iframe>')).toContain('youtube.com/embed/abc')
    expect(sanitize('<iframe src="https://evil.example/x"></iframe>')).not.toContain('evil.example')
  })

  test('makes links that open a new tab safe', () => {
    expect(sanitize('<a href="https://x.example" target="_blank">x</a>'))
      .toBe('<a href="https://x.example" target="_blank" rel="noopener noreferrer">x</a>')
  })

  test('can shift headings up a level so a course intro sits under the page sections', () => {
    expect(sanitize('<h3>Req</h3><h4>Sub</h4>', { shiftHeadings: true })).toBe('<h2>Req</h2><h3>Sub</h3>')
    expect(sanitize('<h3>Req</h3>')).toBe('<h3>Req</h3>')
  })
})

describe('courseStats', () => {
  test('counts what the progress totals count: exercises in, plain notes and tests without content out', () => {
    const exercise = { ...item('note', null), tags: ['exercise'] }
    const course = {
      units: [
        { items: [item('lesson', 'Reading - A'), item('note', null), exercise, exercise, item('video', 'B')] },
        { items: [{ ...item('test', 'Unit 2 Test'), status: 'needs_content' }] },
      ],
    } as unknown as Course
    expect(courseStats(course)).toEqual({ units: 2, items: 4 })
  })

  test.each([['digital-literacy', 34], ['gimp', 29]])('%s matches the hub progress total (%i)', (id, total) => {
    expect(courseStats(courses.find(c => c.id === id) as Course).items).toBe(total)
  })
})

describe('unitViews', () => {
  test('prepares each unit for the course page: number, labels, exercises, what counts, cleaned note text', () => {
    const exercise = { ...item('note', null), id: 'i_ex', tags: ['exercise'], payload: { html: '<b onclick="x()">Exercise 1.1:</b> Try it.' } }
    const course = {
      units: [
        { id: 'u_1', title: 'Unit 1: Basics', description: 'Start here.', items: [
          { ...item('lesson', 'Reading - Layers'), id: 'i_r' },
          exercise,
          { ...item('note', null), id: 'i_n', payload: { html: 'Tip: save often.' } },
          { ...item('test', 'Unit 1 Test'), id: 'i_t', status: 'needs_content' },
        ] },
        { id: 'u_2', title: 'Getting Started', description: '', items: [] },
      ],
    } as unknown as Course
    const [basics, start] = unitViews(course)
    expect({ ...basics, items: undefined }).toEqual({ id: 'u_1', number: '1', title: 'Basics', description: 'Start here.', items: undefined })
    expect(basics.items).toEqual([
      { id: 'i_r', type: 'lesson', label: 'Reading', title: 'Layers', html: null, exercise: false, counts: true },
      { id: 'i_ex', type: 'note', label: 'Note', title: '', html: '<b>Exercise 1.1:</b> Try it.', exercise: true, counts: true },
      { id: 'i_n', type: 'note', label: 'Note', title: '', html: 'Tip: save often.', exercise: false, counts: false },
      { id: 'i_t', type: 'test', label: 'Test', title: 'Unit 1 Test', html: null, exercise: false, counts: false },
    ])
    expect(start).toEqual({ id: 'u_2', number: null, title: 'Getting Started', description: '', items: [] })
  })
})

describe('itemPages', () => {
  const course = {
    id: 'gimp', heading: '2D Digital Art — GIMP', category: 'Media',
    units: [
      { id: 'u_1', title: 'Unit 1: Basics', description: '', items: [
        { ...item('lesson', 'Reading - Layers'), id: 'i_r' },
        { ...item('note', null), id: 'i_n', payload: { html: 'Tip.' } },
        { ...item('note', null), id: 'i_ex', tags: ['exercise'], payload: { html: '<b>Exercise 1.1:</b> Try it.' } },
        { ...item('video', 'Watch'), id: 'i_v' },
      ] },
      { id: 'u_2', title: 'Unit 2: More', description: '', items: [
        { ...item('checkpoint', 'Checkpoint - Final'), id: 'i_c' },
        { ...item('slides', 'Slideshow - Colour'), id: 'i_s' },
        { ...item('link', 'Article - Read this'), id: 'i_l' },
      ] },
    ],
  } as unknown as Course

  test('gives readings, videos, slides and links a page each, and nothing else', () => {
    expect(itemPages(course).map(p => p.id)).toEqual(['i_r', 'i_v', 'i_s', 'i_l'])
  })

  test('each page knows its course, unit, label and title', () => {
    const [reading] = itemPages(course)
    expect(reading).toMatchObject({
      id: 'i_r', type: 'lesson', label: 'Reading', title: 'Layers',
      course: { id: 'gimp', heading: '2D Digital Art — GIMP', category: 'media' }, unit: { id: 'u_1', title: 'Basics' },
    })
  })

  test('Next skips plain notes; an item without a page opens on the course page; the last has no Next', () => {
    const next = Object.fromEntries(itemPages(course).map(p => [p.id, p.next]))
    expect(next.i_r).toEqual({ href: '/courses/gimp#item-i_ex', text: 'Exercise 1.1: Try it.' })
    expect(next.i_v).toEqual({ href: '/courses/gimp#item-i_c', text: 'Checkpoint: Final' })
    expect(next.i_s).toEqual({ href: '/learn/i_l', text: 'Article: Read this' })
    expect(next.i_l).toBeNull()
  })

  test('the committed content has a page for every reading, video, slides and link of every published course', () => {
    const pages = publishedCourses().flatMap(itemPages)
    expect(pages).toHaveLength(160)
    expect(new Set(pages.map(p => p.id)).size).toBe(160)
  })
})

describe('slidesEmbedUrl', () => {
  test.each([
    'https://docs.google.com/presentation/d/ABC_12-x/edit?usp=sharing',
    'https://docs.google.com/presentation/u/0/d/ABC_12-x',
    'https://docs.google.com/presentation/d/ABC_12-x',
  ])('%s', url => {
    expect(slidesEmbedUrl(url)).toBe('https://docs.google.com/presentation/d/ABC_12-x/embed?start=false&loop=false')
  })

  test('anything that is not a Google Slides deck gives no embed', () => {
    expect(slidesEmbedUrl('https://evil.example/presentation/d/ABC/edit')).toBeNull()
  })
})

describe('categoryKey', () => {
  test('gives every catalog category its own colour and icon key', () => {
    const keys = publishedCatalog(catalog).map(c => categoryKey(c.name))
    expect(keys).toEqual(['basics', 'programming', 'it', 'web', 'game', 'media'])
  })

  test('refuses a category it has no colour for, so a new one is noticed', () => {
    expect(() => categoryKey('Robotics')).toThrow('Robotics')
  })
})

describe('unitHeading', () => {
  test.each([
    ['Unit 1: Intro to Computers', { number: '1', title: 'Intro to Computers' }],
    ['Unit 12: Final Project', { number: '12', title: 'Final Project' }],
    ['Getting Started', { number: null, title: 'Getting Started' }],
  ])('%s', (heading, expected) => {
    expect(unitHeading(heading)).toEqual(expected)
  })
})

describe('itemLabel', () => {
  test.each([
    ['lesson', 'Reading - What Is Digital Audio?', 'Reading', 'What Is Digital Audio?'],
    ['slides', 'Slideshow - AI Ethics', 'Slideshow', 'AI Ethics'],
    ['test', 'Quiz - Generative AI', 'Quiz', 'Generative AI'],
    ['test', 'Unit 1 Test', 'Test', 'Unit 1 Test'],
    ['link', 'Article - Prompt Engineering 101', 'Article', 'Prompt Engineering 101'],
    ['link', 'Reading - What Is a Web App?', 'Link', 'Reading - What Is a Web App?'],
    ['checkpoint', 'Checkpoint - How Will Technology Help Me?', 'Checkpoint', 'How Will Technology Help Me?'],
    ['checkpoint', 'Unit 1 Activity - Make a Budget', 'Checkpoint', 'Unit 1 Activity - Make a Budget'],
    ['video', 'Audacity Tutorial for Beginners', 'Video', 'Audacity Tutorial for Beginners'],
  ] as const)('%s "%s" shows as %s: %s', (type, title, label, shown) => {
    expect(itemLabel(item(type, title))).toEqual({ label, title: shown })
  })
})
