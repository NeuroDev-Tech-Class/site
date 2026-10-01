import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import type { TestRow } from '../../lib/adminApi'
import type { TestView } from '../../lib/api'
import { fakeFetch, json, requests } from '../../test/fake-hub'
import type { AdminHub } from '../../test/fake-admin'
import { openAdmin } from '../../test/open-admin'

let fetchMock: Mock

const row = (overrides: Partial<TestRow> = {}): TestRow => ({
  item_id: 'i_5', title: 'Unit 2 Test', course: { id: 'gimp', title: '2D Digital Art - GIMP' }, uploaded: true,
  questions: 12, total_points: 20, coach_points: 8, pass_percent: 70, attempts_allowed: 2, version: 2,
  uploaded_at: '2026-09-28T15:00:00Z', uploaded_by: 'Ms Lee', handed_in: 3, ...overrides,
})

const ROWS: TestRow[] = [
  row(),
  row({ item_id: 'i_9', title: 'Unit 3 Test', uploaded: false, questions: 0, total_points: 0, coach_points: 0,
    pass_percent: null, attempts_allowed: null, version: 0, uploaded_at: null, uploaded_by: null, handed_in: 0 }),
  row({ item_id: 'i_p1', title: 'Unit 1 Test', course: { id: 'python-1', title: 'Python I' }, coach_points: 0 }),
]

const PREVIEW: TestView = {
  item_id: 'i_5', title: 'Unit 2 Test', instructions_html: '<p>Take your time.</p>', pass_percent: 70,
  attempts_allowed: 2, total_points: 9,
  questions: [
    { number: 1, type: 'mc', prompt_html: '<p>Which tool selects by colour?</p>', points: 1, choices: ['Fuzzy Select', 'Crop'] },
    { number: 2, type: 'multi', prompt_html: '<p>Pick two.</p>', points: 2, choices: ['A', 'B', 'C'] },
    { number: 3, type: 'tf', prompt_html: '<p>Layers stack.</p>', points: 1 },
    { number: 4, type: 'match', prompt_html: '<p>Match them.</p>', points: 2, rows: ['Ctrl + C', 'Ctrl + V'], options: ['Copy', 'Cut', 'Paste &amp; match'] },
    { number: 5, type: 'written', prompt_html: '<p>Why use layers?</p>', points: 3 },
  ],
}

const open = (hash = '#/tests', options: AdminHub & { rows?: TestRow[] } = {}) => openAdmin(fetchMock, hash, {
  ...options,
  routes: {
    '/api/v1/tech/tests': () => json(200, options.rows ?? ROWS),
    '/api/v1/tech/tests/i_5/preview': () => json(200, PREVIEW),
    ...options.routes,
  },
})

const table = (course: string) => screen.findByRole('table', { name: `Tests in ${course}` })
const rowOf = async (course: string, title: string) =>
  (await within(await table(course)).findAllByRole('row')).find(r => r.textContent?.includes(title)) as HTMLElement

beforeAll(async () => { await import('./AdminApp') }, 30_000)

beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-30T15:00:00Z'))
  fetchMock = fakeFetch()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  window.location.hash = ''
})

describe('Tests', () => {
  test('is in the sidebar and lists every test by course, uploaded or not', async () => {
    await open()
    const unit2 = await rowOf('2D Digital Art - GIMP', 'Unit 2 Test')
    const link = screen.getByRole('navigation', { name: 'Dashboard' }).querySelector('a[href="#/tests"]')
    expect(link?.getAttribute('aria-current')).toBe('page')
    expect(unit2.textContent).toContain('Version 2')
    expect(unit2.textContent).toContain('Ms Lee')
    expect(unit2.textContent).toContain('12 questions, 20 points')
    expect(unit2.textContent).toContain('8 points for you to mark')
    expect(within(unit2).getAllByRole('cell')[3].textContent).toBe('3')
    const unit3 = await rowOf('2D Digital Art - GIMP', 'Unit 3 Test')
    expect(unit3.textContent).toContain('Not uploaded')
    expect(within(unit3).queryByRole('link', { name: /Preview/ })).toBeNull()
    expect(within(unit3).queryByRole('button', { name: /Download/ })).toBeNull()
    expect((await rowOf('Python I', 'Unit 1 Test')).textContent).not.toContain('for you to mark')
  })

  test('uploading a file sends its text and says it worked', async () => {
    const sent: unknown[] = []
    await open('#/tests', { routes: { '/api/v1/tech/tests/i_9': ({ method, body }) => {
      sent.push({ method, body })
      return json(200, row({ item_id: 'i_9', title: 'Unit 3 Test', version: 1 }))
    } } })
    const file = new File(['# Unit 3 Test\n\n1. [tf] (1pt) Yes?\n   answer: true\n'], 'unit-3.md', { type: 'text/markdown' })
    await userEvent.upload(await screen.findByLabelText('Upload a file for Unit 3 Test'), file)
    expect(await screen.findByText('Unit 3 Test uploaded (version 1).')).toBeTruthy()
    expect(sent).toEqual([{ method: 'PUT', body: { source: '# Unit 3 Test\n\n1. [tf] (1pt) Yes?\n   answer: true\n' } }])
    expect(requests(fetchMock).filter(r => r === 'GET /api/v1/tech/tests')).toHaveLength(2)
  })

  test('a file with problems lists each one with its line', async () => {
    await open('#/tests', { routes: { '/api/v1/tech/tests/i_5': () => json(422, { detail: {
      message: 'The test file needs fixing.',
      problems: [{ line: 0, message: 'There are no questions.' }, { line: 7, message: 'Mark the right choice with a * at the end.' }],
    } }) } })
    await userEvent.upload(await screen.findByLabelText('Upload a file for Unit 2 Test'), new File(['x'], 'bad.md'))
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain("Unit 2 Test wasn't uploaded. The file needs fixing:")
    expect(within(alert).getAllByRole('listitem').map(li => li.textContent)).toEqual([
      'There are no questions.', 'Line 7: Mark the right choice with a * at the end.',
    ])
  })

  test('downloading saves the file under the name the hub gives', async () => {
    const clicked: string[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { clicked.push(this.download) })
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} }))
    await open('#/tests', { routes: { '/api/v1/tech/tests/i_5/source': () => new Response('# Unit 2 Test\n', {
      status: 200, headers: { 'Content-Disposition': 'attachment; filename="gimp-unit-2-test.md"' },
    }) } })
    await userEvent.click(await screen.findByRole('button', { name: 'Download Unit 2 Test' }))
    await vi.waitFor(() => expect(clicked).toEqual(['gimp-unit-2-test.md']))
  })

  test('the hub not answering says so, with a way to try again', async () => {
    let up = false
    await open('#/tests', { routes: { '/api/v1/tech/tests': () => (up ? json(200, ROWS) : json(500, {})) } })
    expect(await screen.findByText("Couldn't load this.")).toBeTruthy()
    up = true
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await table('Python I')).toBeTruthy()
  })
})

describe('Preview', () => {
  test('shows the test as a student sees it, answers switched off', async () => {
    await open()
    await userEvent.click(await screen.findByRole('link', { name: 'Preview Unit 2 Test' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Unit 2 Test' })).toBeTruthy()
    expect(screen.getByText('Pass mark 70% · 2 attempts · 9 points')).toBeTruthy()
    expect(screen.getByText('Take your time.')).toBeTruthy()
    const first = screen.getByRole('group', { name: /Question 1/ })
    expect(within(first).getByText('1 point')).toBeTruthy()
    const choices = within(first).getAllByRole('radio')
    expect(choices.map(c => (c as HTMLInputElement).disabled)).toEqual([true, true])
    expect(within(screen.getByRole('group', { name: /Question 2/ })).getAllByRole('checkbox')).toHaveLength(3)
    expect(within(screen.getByRole('group', { name: /Question 3/ })).getByRole('radio', { name: 'True' })).toBeTruthy()
    const match = screen.getByRole('group', { name: /Question 4/ })
    const select = within(match).getByRole('combobox', { name: 'Ctrl + C' }) as HTMLSelectElement
    expect([...select.options].map(o => o.text)).toEqual(['Choose…', 'Copy', 'Cut', 'Paste & match'])
    expect((within(screen.getByRole('group', { name: /Question 5/ })).getByRole('textbox') as HTMLTextAreaElement).disabled).toBe(true)
    expect(screen.getByRole('link', { name: 'All tests' }).getAttribute('href')).toBe('#/tests')
    const link = screen.getByRole('navigation', { name: 'Dashboard' }).querySelector('a[href="#/tests"]')
    expect(link?.getAttribute('aria-current')).toBe('page')
  })

  test('a test not uploaded yet says so', async () => {
    await open('#/tests/i_9', { routes: { '/api/v1/tech/tests/i_9/preview': () => json(404, { detail: "This test hasn't been uploaded yet." }) } })
    expect(await screen.findByText("This test hasn't been uploaded yet.")).toBeTruthy()
  })
})
