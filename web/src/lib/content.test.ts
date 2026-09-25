import { describe, expect, test } from 'vitest'
import {
  catalog,
  categoryKey,
  courseStats,
  courses,
  itemLabel,
  publishedCatalog,
  sanitize,
  unitHeading,
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
  test('counts units and the items a student works through, leaving out untitled notes', () => {
    const course = {
      units: [
        { items: [item('lesson', 'Reading - A'), item('note', null), item('video', 'B')] },
        { items: [item('test', 'Unit 2 Test')] },
      ],
    } as unknown as Course
    expect(courseStats(course)).toEqual({ units: 2, items: 3 })
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
