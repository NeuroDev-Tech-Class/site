import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { fakeFetch, json, requests } from '../../test/fake-hub'
import { adminHub, OWNER, queueRow, studentRow, type AdminHub } from '../../test/fake-admin'

let fetchMock: Mock

async function open(hash: string, hub: AdminHub = {}) {
  window.location.hash = hash
  adminHub(fetchMock, hub)
  const { default: AdminApp } = await import('./AdminApp')
  render(<AdminApp />)
}

const nav = () => screen.getByRole('navigation', { name: 'Dashboard' })

// Compiles the component once, outside any test's time limit; each test still imports it afresh
beforeAll(async () => { await Promise.all([import('./AdminApp')]) }, 30_000)

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

describe('who gets in', () => {
  test('signed out: a way to sign in that comes back here', async () => {
    await open('#/today', { account: null })
    const link = await screen.findByRole('link', { name: 'Sign in' })
    expect(link.getAttribute('href')).toBe('/sign-in?next=%2Fadmin')
    expect(screen.queryByRole('navigation', { name: 'Dashboard' })).toBeNull()
  })

  test('a student is told the dashboard is for coaches, and nothing is fetched for it', async () => {
    await open('#/today', { account: { role: 'student' } })
    expect(await screen.findByText('The dashboard is for coaches.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Go to My Courses' }).getAttribute('href')).toBe('/my-courses')
    expect(requests(fetchMock).filter(r => !r.endsWith('/auth/refresh'))).toEqual([])
  })

  test('before the sign-in is known the page still has its heading', async () => {
    fetchMock.mockReturnValue(new Promise(() => undefined))
    const { default: AdminApp } = await import('./AdminApp')
    render(<AdminApp />)
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeTruthy()
  })
})

describe('the shell', () => {
  test('a coach gets the sidebar with how much is waiting, on Today', async () => {
    await open('', {
      queue: [queueRow(), queueRow({ id: 's2__i_8__1' })],
      students: [studentRow({ id: 'p1', status: 'pending', approved_at: null })],
    })
    expect(await screen.findByRole('heading', { level: 1, name: 'Today' })).toBeTruthy()
    expect(window.location.hash).toBe('#/today')
    const today = within(nav()).getByRole('link', { name: 'Today' })
    expect(today.getAttribute('aria-current')).toBe('page')
    await waitFor(() => expect(within(nav()).getByRole('link', { name: /Grading Queue/ }).textContent).toContain('2'))
    expect(within(nav()).getByRole('link', { name: /Grading Queue, 2 waiting/ }).getAttribute('href')).toBe('#/queue')
  })

  test('Storage is in the sidebar for the superadmin only', async () => {
    await open('#/today', { account: OWNER })
    await screen.findByRole('heading', { name: 'Today' })
    expect(within(nav()).queryByRole('link', { name: 'Storage' })).not.toBeNull()
    cleanup()
    vi.resetModules()
    await open('#/today')
    await screen.findByRole('heading', { name: 'Today' })
    expect(within(nav()).queryByRole('link', { name: 'Storage' })).toBeNull()
  })

  test('an address the dashboard does not know opens Today', async () => {
    await open('#/nowhere')
    expect(await screen.findByRole('heading', { level: 1, name: 'Today' })).toBeTruthy()
    expect(window.location.hash).toBe('#/today')
  })
})

describe('Today', () => {
  const STUDENTS = [
    studentRow({ id: 'p1', name: 'Nia New', email: 'nia@example.com', status: 'pending', approved_at: null,
      created_at: '2026-09-29T15:00:00Z', last_activity_at: null }),
    studentRow({ id: 'p2', name: 'Unconfirmed', status: 'pending', email_verified: false, last_activity_at: null }),
    studentRow({ id: 's1', last_activity_at: '2026-09-28T15:00:00Z' }),
    studentRow({ id: 's2', name: 'Ana Old', last_activity_at: '2026-09-10T15:00:00Z' }),
  ]
  const QUEUE = Array.from({ length: 7 }, (_, n) => queueRow({
    id: `s1__i_${n}__1`, item: { id: `i_${n}`, title: `Checkpoint ${n}` }, submitted_at: `2026-09-2${n}T15:00:00Z`,
  }))

  test('tiles say what is waiting, each opening where to deal with it', async () => {
    await open('#/today', { students: STUDENTS, queue: QUEUE })
    const tiles = await screen.findByRole('list', { name: 'At a glance' })
    await waitFor(() => expect(within(tiles).getByRole('link', { name: /Awaiting grading/ }).textContent).toContain('7'))
    expect(within(tiles).getByRole('link', { name: /Awaiting grading/ }).getAttribute('href')).toBe('#/queue')
    const pending = within(tiles).getByRole('link', { name: /Pending sign-ups/ })
    expect(pending.textContent).toContain('1')
    expect(pending.getAttribute('href')).toBe('#/students?tab=pending')
    expect(within(tiles).getByRole('link', { name: /Active this week/ }).textContent).toContain('1')
  })

  test('needs your attention: sign-ups to approve, then the five oldest pieces of work to grade', async () => {
    await open('#/today', { students: STUDENTS, queue: QUEUE })
    const list = await screen.findByRole('list', { name: 'Needs your attention' })
    const rows = within(list).getAllByRole('listitem')
    expect(rows).toHaveLength(6)
    expect(within(rows[0]).getByText('Nia New')).toBeTruthy()
    expect(within(rows[0]).getByRole('button', { name: 'Approve Nia New' })).toBeTruthy()
    expect(within(rows[1]).getByText('Checkpoint 0')).toBeTruthy()
    expect(within(rows[1]).getByRole('link', { name: 'Grade Checkpoint 0 by Sam Student' }).getAttribute('href'))
      .toBe('#/grade/s1__i_0__1')
    expect(screen.queryByText('Unconfirmed')).toBeNull()
  })

  test('approving takes the sign-up off the list and out of the count', async () => {
    let students = STUDENTS
    await open('#/today', {
      students: STUDENTS,
      routes: {
        '/api/v1/tech/accounts/p1/approve': () => {
          students = students.map(s => (s.id === 'p1' ? { ...s, status: 'approved' } : s))
          return json(200, {})
        },
        '/api/v1/tech/students': () => json(200, students),
        '/api/v1/tech/accounts/badge': () => json(200, { pending: students.filter(s => s.status === 'pending' && s.email_verified).length }),
      },
    })
    await waitFor(() => expect(within(nav()).getByRole('link', { name: 'Students, 1 to approve' })).toBeTruthy())
    await userEvent.click(await screen.findByRole('button', { name: 'Approve Nia New' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Approve Nia New' })).toBeNull())
    await waitFor(() => expect(within(nav()).getByRole('link', { name: 'Students' })).toBeTruthy())
    expect(requests(fetchMock)).toContain('POST /api/v1/tech/accounts/p1/approve')
    const tiles = screen.getByRole('list', { name: 'At a glance' })
    await waitFor(() => expect(within(tiles).getByRole('link', { name: /Pending sign-ups/ }).textContent).toContain('0'))
    expect(screen.getByText('Nia New approved.')).toBeTruthy()
  })

  test('nothing waiting says so', async () => {
    await open('#/today', { students: [studentRow()] })
    expect(await screen.findByText('Nothing needs you right now.')).toBeTruthy()
  })

  test('the hub not answering says to try again', async () => {
    await open('#/today', { fail: true })
    expect(await screen.findByText("Couldn't load this. It will try again shortly, or reload the page.")).toBeTruthy()
  })
})

describe('refreshing', () => {
  test('the counts come back every 30 seconds', async () => {
    vi.useRealTimers()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    await open('#/today', { queue: [queueRow()] })
    await screen.findByRole('heading', { name: 'Today' })
    const counts = () => requests(fetchMock).filter(r => r === 'GET /api/v1/tech/submissions/queue/count').length
    await waitFor(() => expect(counts()).toBe(1))
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000) })
    expect(counts()).toBe(2)
  })
})
