import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import type { CourseProgress, MyCertificate, Submission, TechAccount } from '../../lib/api'
import type { CourseMeta } from '../../lib/content'
import { account, fakeFetch, fakeHub, json, requests, submission } from '../../test/fake-hub'

const COURSES: CourseMeta[] = [
  { id: 'gimp', heading: '2D Digital Art — GIMP', category: 'media' },
  { id: 'python-1', heading: 'Python I', category: 'programming' },
]
const PAGE_IDS = ['i_read', 'i_final']

const course = (overrides: Partial<CourseProgress>): CourseProgress => ({
  course_id: 'gimp', title: '2D Digital Art - GIMP', done: 12, total: 29, percent: 41,
  next_item: { id: 'i_read', title: 'Reading - Layers' }, last_activity_at: '2026-10-01T15:00:00Z', ...overrides,
})
const STARTED = [
  course({}),
  course({ course_id: 'python-1', title: 'Python I', done: 30, total: 30, percent: 100, next_item: null,
    last_activity_at: '2026-09-20T15:00:00Z' }),
]

const piece = (overrides: Partial<Submission>) =>
  submission({ id: 'a1__i_final__1', item: { id: 'i_final', title: 'Final Project' }, ...overrides })
const WORK = [
  piece({ id: 'a1__i_final__2', attempt: 2 }),
  piece({ status: 'returned', status_label: 'Needs revision', feedback: 'Add a <b>README</b>.',
    submitted_at: '2026-09-28T15:00:00Z' }),
  piece({ id: 'a1__i_test__1', kind: 'test', status: 'graded', status_label: 'Passed', score_label: '8 / 10 (80%)',
    item: { id: 'i_test', title: 'Unit 1 Test' }, course: { id: 'python-1', title: 'Python I' },
    submitted_at: '2026-09-20T15:00:00Z' }),
]

let fetchMock: Mock

function hub(options: {
  account?: Partial<TechAccount> | null, courses?: CourseProgress[], fail?: boolean, work?: Submission[],
  failWork?: boolean, certificates?: MyCertificate[], failCertificates?: boolean,
  // Requests that never answer, to see what shows while they load
  waiting?: ('progress' | 'work' | 'certificates')[],
} = {}) {
  const wait = (what: 'progress' | 'work' | 'certificates', answer: () => Response) =>
    () => (options.waiting?.includes(what) ? new Promise<Response>(() => undefined) : answer())
  fakeHub(fetchMock, options.account === undefined ? {} : options.account, {
    '/api/v1/tech/progress': wait('progress', () => options.fail ? json(500, {}) : json(200, { courses: options.courses ?? STARTED })),
    '/api/v1/tech/submissions/mine': wait('work', () => options.failWork ? json(500, {}) : json(200, options.work ?? [])),
    '/api/v1/tech/certificates/mine': wait('certificates', () => options.failCertificates ? json(500, {}) : json(200, options.certificates ?? [])),
    '/api/v1/tech/certificates/(c\\d)/link': ({ match }) => json(200, { url: `https://r2.test/${match[1]}.pdf` }),
  })
}
const progressCalls = () => requests(fetchMock).filter(r => r === 'GET /api/v1/tech/progress').length
const workCalls = () => requests(fetchMock).filter(r => r.startsWith('GET /api/v1/tech/submissions/mine')).length

// Compiles the component once, outside any test's time limit; each test still imports it afresh
beforeAll(async () => { await Promise.all([import('./MyCourses'), import('./HomeContinue'), import('./CourseRing')]) }, 30_000)

beforeEach(() => {
  vi.resetModules()
  fetchMock = fakeFetch()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('My Courses', () => {
  async function renderList() {
    const { default: MyCourses } = await import('./MyCourses')
    render(<MyCourses courses={COURSES} pageIds={PAGE_IDS} />)
  }

  test('lists started courses as the hub orders them, with progress, last activity and where to go next', async () => {
    hub()
    await renderList()
    const cards = await screen.findAllByRole('article')
    expect(cards.map(c => within(c).getByRole('heading').textContent)).toEqual(['2D Digital Art — GIMP', 'Python I'])
    const [gimp, python] = cards
    expect(within(gimp).getByRole('img', { name: '41% complete' })).toBeTruthy()
    expect(within(gimp).getByText('12 of 29 done')).toBeTruthy()
    expect(within(gimp).getByText(/Last worked on Oct 1, 2026/)).toBeTruthy()
    expect(within(gimp).getByRole('link', { name: /Continue/ }).getAttribute('href')).toBe('/learn/i_read')
    expect(within(gimp).getByRole('link', { name: '2D Digital Art — GIMP' }).getAttribute('href')).toBe('/courses/gimp')
    expect(within(python).getByText('Finished')).toBeTruthy()
    expect(within(python).queryByRole('link', { name: /Continue/ })).toBeNull()
  })

  test("on a shared computer, the next student never sees the last one's courses", async () => {
    hub()
    await renderList()
    await screen.findAllByRole('article')
    let answer: (response: Response) => void = () => undefined
    fakeHub(fetchMock, null, {
      '/api/v1/tech/auth/logout': () => new Response(null, { status: 204 }),
      '/api/v1/tech/progress': () => new Promise<Response>(resolve => { answer = resolve }),
    })
    const { setAccount, signOut } = await import('../../lib/session')
    await act(() => signOut())
    act(() => setAccount(account({ id: 'a2', email: 'ana@example.com', first_name: 'Ana' })))
    expect(screen.queryByRole('article')).toBeNull()
    expect(screen.getByRole('status', { name: 'Loading your courses' })).toBeTruthy()
    await act(async () => answer(json(200, { courses: [] })))
    expect(await screen.findByText("You haven't started a course yet.")).toBeTruthy()
  })

  test('while the sign-in is being checked, it neither shows courses nor asks to sign in', async () => {
    fetchMock.mockReturnValue(new Promise(() => undefined))
    await renderList()
    expect(screen.getByRole('status', { name: 'Loading your courses' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Sign in' })).toBeNull()
  })

  test('while the courses load, placeholders shaped like the cards hold their place', async () => {
    hub({ waiting: ['progress'] })
    await renderList()
    const loading = await screen.findByRole('status', { name: 'Loading your courses' })
    expect(loading.getAttribute('aria-busy')).toBe('true')
    expect(screen.queryByRole('article')).toBeNull()
  })

  test('Continue to an item without its own page opens the course page there', async () => {
    hub({ courses: [course({ next_item: { id: 'i_check', title: 'Checkpoint - Final' } })] })
    await renderList()
    expect((await screen.findByRole('link', { name: /Continue/ })).getAttribute('href')).toBe('/courses/gimp#item-i_check')
  })

  test('nothing started yet points at the catalog', async () => {
    hub({ courses: [] })
    await renderList()
    expect(await screen.findByText("You haven't started a course yet.")).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Browse the catalog' }).getAttribute('href')).toBe('/catalog')
  })

  test('signed out: a way to sign in that comes back here', async () => {
    hub({ account: null })
    await renderList()
    expect((await screen.findByRole('link', { name: 'Sign in' })).getAttribute('href')).toBe('/sign-in?next=%2Fmy-courses')
    expect(progressCalls()).toBe(0)
  })

  test('a pending account is told why', async () => {
    hub({ account: { status: 'pending' } })
    await renderList()
    expect(await screen.findByText(/waiting for your tech coach/)).toBeTruthy()
    expect(progressCalls()).toBe(0)
  })

  test('the hub not answering says to try again', async () => {
    hub({ fail: true })
    await renderList()
    expect(await screen.findByText("Couldn't load your courses. Reload the page to try again.")).toBeTruthy()
  })
})

describe('Recent work on My Courses', () => {
  async function renderList() {
    const { default: MyCourses } = await import('./MyCourses')
    render(<MyCourses courses={COURSES} pageIds={PAGE_IDS} />)
  }
  const recent = async () => (await screen.findByRole('heading', { name: 'Recent work' })).closest('section') as HTMLElement

  test('lists handed-in work as the hub orders it, with its status, date and where it lives', async () => {
    hub({ work: WORK })
    await renderList()
    const rows = within(await recent()).getAllByRole('listitem')
    expect(rows.map(r => within(r).getByRole('link').textContent)).toEqual(['Final Project', 'Final Project', 'Unit 1 Test'])
    expect(within(rows[0]).getByRole('link').getAttribute('href')).toBe('/learn/i_final')
    expect(within(rows[2]).getByRole('link').getAttribute('href')).toBe('/courses/python-1#item-i_test')
    expect(within(rows[0]).getByText('Waiting for grading')).toBeTruthy()
    expect(within(rows[0]).getByText(/GIMP · Handed in October 2, 2026/)).toBeTruthy()
    expect(within(rows[0]).getByText('Attempt 2')).toBeTruthy()
    expect(within(rows[1]).queryByText(/Attempt/)).toBeNull()
  })

  test("shows the coach's feedback as plain text, and a graded test's score", async () => {
    hub({ work: WORK })
    await renderList()
    const [, returned, test] = within(await recent()).getAllByRole('listitem')
    expect(within(returned).getByText('Needs revision')).toBeTruthy()
    expect(within(returned).getByText('Add a <b>README</b>.')).toBeTruthy()
    expect(returned.querySelector('b')).toBeNull()
    expect(within(test).getByText('Passed · 8 / 10 (80%)')).toBeTruthy()
    expect(within(test).queryByText(/feedback/i)).toBeNull()
  })

  test('while it loads a placeholder holds its place', async () => {
    hub({ waiting: ['work'] })
    await renderList()
    expect(await screen.findByRole('status', { name: 'Loading your recent work' })).toBeTruthy()
  })

  test('nothing handed in yet: no Recent work section at all', async () => {
    hub({ work: [] })
    await renderList()
    await screen.findAllByRole('article')
    await waitFor(() => expect(workCalls()).toBe(1))
    expect(screen.queryByRole('heading', { name: 'Recent work' })).toBeNull()
    await waitFor(() => expect(screen.queryByRole('status', { name: 'Loading your recent work' })).toBeNull())
  })

  test("work that can't be loaded says so without hiding the courses", async () => {
    hub({ work: WORK, failWork: true })
    await renderList()
    expect(await screen.findByText("Couldn't load your recent work. Reload the page to try again.")).toBeTruthy()
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })

  test("on a shared computer, the next student never sees the last one's work", async () => {
    hub({ work: WORK })
    await renderList()
    await recent()
    let answer: (response: Response) => void = () => undefined
    fakeHub(fetchMock, null, {
      '/api/v1/tech/auth/logout': () => new Response(null, { status: 204 }),
      '/api/v1/tech/progress': () => json(200, { courses: STARTED }),
      '/api/v1/tech/submissions/mine': () => new Promise<Response>(resolve => { answer = resolve }),
    })
    const { setAccount, signOut } = await import('../../lib/session')
    await act(() => signOut())
    act(() => setAccount(account({ id: 'a2', email: 'ana@example.com', first_name: 'Ana' })))
    await screen.findAllByRole('article')
    expect(screen.queryByRole('heading', { name: 'Recent work' })).toBeNull()
    await act(async () => answer(json(200, [])))
    expect(screen.queryByText('Final Project')).toBeNull()
  })

  test.each([
    ['signed out', null, { name: 'Sign in' }],
    ['waiting for approval', { status: 'pending' }, /waiting for your tech coach/],
  ] as const)('%s, no work is asked for', async (_, who, shown) => {
    hub({ account: who as Partial<TechAccount> | null, work: WORK })
    await renderList()
    if (shown instanceof RegExp) await screen.findByText(shown)
    else await screen.findByRole('link', shown)
    expect(workCalls()).toBe(0)
  })
})

describe('Certificates on My Courses', () => {
  const CERTIFICATES: MyCertificate[] = [
    { id: 'c1', course: { id: 'python-1', title: 'Python I' }, course_name: 'Python I', awarded_on: '2026-09-30' },
    { id: 'c2', course: { id: 'gimp', title: '2D Digital Art - GIMP' }, course_name: 'GIMP', awarded_on: '2026-06-01' },
  ]
  async function renderList() {
    const { default: MyCourses } = await import('./MyCourses')
    render(<MyCourses courses={COURSES} pageIds={PAGE_IDS} />)
  }
  const section = async () => (await screen.findByRole('heading', { name: 'Certificates' })).closest('section') as HTMLElement
  const certificateCalls = () => requests(fetchMock).filter(r => r === 'GET /api/v1/tech/certificates/mine').length

  test('lists the ones the coach has shared, each opening its PDF', async () => {
    const opened: unknown[][] = []
    vi.stubGlobal('open', (...args: unknown[]) => { opened.push(args); return null })
    hub({ certificates: CERTIFICATES })
    await renderList()
    const rows = within(await section()).getAllByRole('listitem')
    expect(rows.map(r => r.textContent)).toEqual([
      expect.stringContaining('Python I'), expect.stringContaining('GIMP'),
    ])
    expect(within(rows[0]).getByText('Awarded September 30, 2026')).toBeTruthy()
    await userEvent.click(within(rows[0]).getByRole('button', { name: 'View the Python I certificate' }))
    await waitFor(() => expect(opened).toEqual([['https://r2.test/c1.pdf', '_blank', 'noopener']]))
  })

  test('while they load a placeholder holds their place', async () => {
    hub({ waiting: ['certificates'] })
    await renderList()
    expect(await screen.findByRole('status', { name: 'Loading your certificates' })).toBeTruthy()
  })

  test('none shared yet: no Certificates section at all', async () => {
    hub({ certificates: [] })
    await renderList()
    await screen.findAllByRole('article')
    await waitFor(() => expect(certificateCalls()).toBe(1))
    expect(screen.queryByRole('heading', { name: 'Certificates' })).toBeNull()
    await waitFor(() => expect(screen.queryByRole('status', { name: 'Loading your certificates' })).toBeNull())
  })

  test("certificates that can't be loaded say so without hiding the courses", async () => {
    hub({ certificates: CERTIFICATES, failCertificates: true })
    await renderList()
    expect(await screen.findByText("Couldn't load your certificates. Reload the page to try again.")).toBeTruthy()
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })

  test("on a shared computer, the next student never sees the last one's certificates", async () => {
    hub({ certificates: CERTIFICATES })
    await renderList()
    await section()
    let answer: (response: Response) => void = () => undefined
    fakeHub(fetchMock, null, {
      '/api/v1/tech/auth/logout': () => new Response(null, { status: 204 }),
      '/api/v1/tech/progress': () => json(200, { courses: STARTED }),
      '/api/v1/tech/submissions/mine': () => json(200, []),
      '/api/v1/tech/certificates/mine': () => new Promise<Response>(resolve => { answer = resolve }),
    })
    const { setAccount, signOut } = await import('../../lib/session')
    await act(() => signOut())
    act(() => setAccount(account({ id: 'a2', email: 'ana@example.com', first_name: 'Ana' })))
    await screen.findAllByRole('article')
    expect(screen.queryByRole('heading', { name: 'Certificates' })).toBeNull()
    await act(async () => answer(json(200, [])))
    expect(screen.queryByText('Awarded September 30, 2026')).toBeNull()
  })

  test('a student waiting for approval asks for none', async () => {
    hub({ account: { status: 'pending' }, certificates: CERTIFICATES })
    await renderList()
    await screen.findByText(/waiting for your tech coach/)
    expect(certificateCalls()).toBe(0)
  })
})

describe('the Home card', () => {
  async function renderCard() {
    const { default: HomeContinue } = await import('./HomeContinue')
    return render(<HomeContinue courses={COURSES} pageIds={PAGE_IDS} />)
  }

  test('shows the most recent course with Continue', async () => {
    hub()
    await renderCard()
    expect(await screen.findByRole('heading', { name: 'Pick up where you left off' })).toBeTruthy()
    expect(screen.getByText('2D Digital Art — GIMP')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Continue/ }).getAttribute('href')).toBe('/learn/i_read')
  })

  test('while progress loads, a placeholder card holds its place', async () => {
    hub({ waiting: ['progress'] })
    await renderCard()
    expect(await screen.findByRole('status', { name: 'Loading where you left off' })).toBeTruthy()
  })

  test('skips a finished course to the most recent one still going', async () => {
    hub({ courses: [STARTED[1], STARTED[0]] })
    await renderCard()
    expect(await screen.findByText('2D Digital Art — GIMP')).toBeTruthy()
    expect(screen.queryByText('Python I')).toBeNull()
  })

  test.each([
    ['signed out', { account: null }],
    ['nothing started', { courses: [] }],
    ['every started course finished', { courses: [STARTED[1]] }],
  ] as const)('%s: shows nothing', async (_, options) => {
    hub(options as never)
    const view = await renderCard()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(view.container.textContent).toBe('')
  })
})

describe('catalog rings', () => {
  async function renderRings(ids: string[]) {
    const { default: CourseRing } = await import('./CourseRing')
    render(<>{ids.map(id => <div key={id} data-testid={id}><CourseRing courseId={id} /></div>)}</>)
  }

  test('a started course shows how far along it is; finished says Complete; others show nothing', async () => {
    hub()
    await renderRings(['gimp', 'python-1', 'linux'])
    expect(await within(screen.getByTestId('gimp')).findByText('In progress · 41%')).toBeTruthy()
    expect(within(screen.getByTestId('python-1')).getByText('Complete')).toBeTruthy()
    expect(screen.getByTestId('linux').textContent).toBe('')
  })

  test('while progress loads each card holds a quiet placeholder, announced to no one', async () => {
    hub({ waiting: ['progress'] })
    await renderRings(['gimp', 'linux'])
    await waitFor(() => expect(progressCalls()).toBe(1))
    for (const id of ['gimp', 'linux']) {
      expect(screen.getByTestId(id).querySelector('[aria-hidden="true"]')).toBeTruthy()
      expect(screen.getByTestId(id).textContent).toBe('')
    }
  })

  test('every ring on the page shares one request', async () => {
    hub()
    await renderRings(['gimp', 'python-1', 'linux'])
    await within(screen.getByTestId('gimp')).findByText('In progress · 41%')
    expect(progressCalls()).toBe(1)
  })

  test('signed out, the catalog is plain', async () => {
    hub({ account: null })
    await renderRings(['gimp'])
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(screen.getByTestId('gimp').textContent).toBe('')
    expect(progressCalls()).toBe(0)
  })
})
