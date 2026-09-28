import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import type { Mock } from 'vitest'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { CourseProgress, TechAccount } from '../../lib/api'
import type { CourseMeta } from '../../lib/content'
import { account, fakeFetch, fakeHub, json, requests } from '../../test/fake-hub'

const COURSES: CourseMeta[] = [
  { id: 'gimp', heading: '2D Digital Art — GIMP', category: 'media' },
  { id: 'python-1', heading: 'Python I', category: 'programming' },
]
const PAGE_IDS = ['i_read']

const course = (overrides: Partial<CourseProgress>): CourseProgress => ({
  course_id: 'gimp', title: '2D Digital Art - GIMP', done: 12, total: 29, percent: 41,
  next_item: { id: 'i_read', title: 'Reading - Layers' }, last_activity_at: '2026-10-01T15:00:00Z', ...overrides,
})
const STARTED = [
  course({}),
  course({ course_id: 'python-1', title: 'Python I', done: 30, total: 30, percent: 100, next_item: null,
    last_activity_at: '2026-09-20T15:00:00Z' }),
]

let fetchMock: Mock

function hub(options: { account?: Partial<TechAccount> | null, courses?: CourseProgress[], fail?: boolean } = {}) {
  fakeHub(fetchMock, options.account === undefined ? {} : options.account, {
    '/api/v1/tech/progress': () => options.fail ? json(500, {}) : json(200, { courses: options.courses ?? STARTED }),
  })
}
const progressCalls = () => requests(fetchMock).filter(r => r === 'GET /api/v1/tech/progress').length

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
    expect(screen.getByText('Loading your courses…')).toBeTruthy()
    await act(async () => answer(json(200, { courses: [] })))
    expect(await screen.findByText("You haven't started a course yet.")).toBeTruthy()
  })

  test('while the sign-in is being checked, it neither shows courses nor asks to sign in', async () => {
    fetchMock.mockReturnValue(new Promise(() => undefined))
    await renderList()
    expect(screen.getByText('Loading your courses…')).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Sign in' })).toBeNull()
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
