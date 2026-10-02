import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import type { InboxNote } from '../lib/adminApi'
import type { TechAccount } from '../lib/api'
import { fakeFetch, fakeHub, json, requests } from '../test/fake-hub'

let fetchMock: Mock

const note = (overrides: Partial<InboxNote>): InboxNote => ({
  id: 'n1', type: 'submission_graded', title: 'Movie Poster complete', body: 'Ms Lee: Great poster!', link: '/courses/gimp#item-i_8',
  actor_name: 'Ms Lee', read: false, created_at: '2026-09-30T14:00:00Z', ...overrides,
})
const NOTES = [
  note({}),
  note({ id: 'n2', type: 'submission_returned', title: 'Portfolio sent back', body: 'Add a README.', link: '/courses/gimp#item-i_9' }),
  note({ id: 'n3', type: 'account_approved', title: 'Welcome!', body: 'Your account is approved.', link: '/catalog', read: true,
    created_at: '2026-09-20T15:00:00Z' }),
]

function hub(account: Partial<TechAccount> | null = {}, notes: InboxNote[] = NOTES) {
  let inbox = notes
  const unread = () => inbox.filter(n => !n.read).length
  fakeHub(fetchMock, account, {
    '/api/v1/tech/inbox/unread-count': () => json(200, { count: unread() }),
    '/api/v1/tech/inbox': () => json(200, { items: inbox, next: null }),
    '/api/v1/tech/inbox/read-all': () => {
      const count = unread()
      inbox = inbox.map(n => ({ ...n, read: true }))
      return json(200, { count })
    },
    '/api/v1/tech/inbox/(\\w+)/read': ({ match }) => {
      inbox = inbox.map(n => (n.id === match[1] ? { ...n, read: true } : n))
      return new Response(null, { status: 204 })
    },
  })
}

async function renderBell() {
  const { default: NotificationBell } = await import('./NotificationBell')
  render(<NotificationBell />)
}

const bell = () => screen.findByRole('button', { name: /Notifications/ })

// Compiles the component once, outside any test's time limit; each test still imports it afresh
beforeAll(async () => { await import('./NotificationBell') }, 30_000)

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
})

describe('the bell', () => {
  test('opened while the notes load, placeholders hold their place', async () => {
    fakeHub(fetchMock, {}, {
      '/api/v1/tech/inbox/unread-count': () => json(200, { count: 2 }),
      '/api/v1/tech/inbox': () => new Promise<Response>(() => undefined),
    })
    await renderBell()
    await userEvent.click(await bell())
    expect(await screen.findByRole('status', { name: 'Loading notifications' })).toBeTruthy()
  })

  test('shows how many notes are unread', async () => {
    hub()
    await renderBell()
    await waitFor(async () => expect((await bell()).getAttribute('aria-label')).toBe('Notifications, 2 unread'))
    expect((await bell()).textContent).toContain('2')
  })

  test.each([
    ['signed out', null],
    ['waiting for approval', { status: 'pending' as const }],
  ])('is not there when %s', async (_, account) => {
    hub(account)
    await renderBell()
    await waitFor(() => expect(requests(fetchMock)).toContain('POST /api/v1/tech/auth/refresh'))
    expect(screen.queryByRole('button', { name: /Notifications/ })).toBeNull()
    expect(requests(fetchMock).filter(r => r.includes('/inbox'))).toEqual([])
  })

  test('opens to the latest notes, unread ones marked, each a link to where it happened', async () => {
    hub()
    await renderBell()
    await userEvent.click(await bell())
    const list = await screen.findByRole('list', { name: 'Notifications' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    const first = within(items[0]).getByRole('link')
    expect(first.getAttribute('href')).toBe('/courses/gimp#item-i_8')
    expect(first.textContent).toContain('Unread:')
    expect(first.textContent).toContain('Movie Poster complete')
    expect(first.textContent).toContain('Ms Lee: Great poster!')
    expect(first.textContent).toContain('1 hour ago')
    expect(within(items[2]).getByRole('link').textContent).not.toContain('Unread:')
  })

  test('opening a note marks it read', async () => {
    hub()
    await renderBell()
    await userEvent.click(await bell())
    const list = await screen.findByRole('list', { name: 'Notifications' })
    const link = within(list).getAllByRole('link')[0]
    link.addEventListener('click', event => event.preventDefault())
    await userEvent.click(link)
    await waitFor(() => expect(requests(fetchMock)).toContain('POST /api/v1/tech/inbox/n1/read'))
    const [, init] = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/inbox/n1/read'))!
    expect((init as RequestInit).keepalive).toBe(true)
    await waitFor(async () => expect((await bell()).getAttribute('aria-label')).toBe('Notifications, 1 unread'))
  })

  test('opening a note closes the list, as when it leads somewhere on the same page', async () => {
    hub()
    await renderBell()
    await userEvent.click(await bell())
    const link = within(await screen.findByRole('list', { name: 'Notifications' })).getAllByRole('link')[0]
    link.addEventListener('click', event => event.preventDefault())
    await userEvent.click(link)
    await waitFor(() => expect(screen.queryByRole('list', { name: 'Notifications' })).toBeNull())
  })

  test('Mark all read failing says so', async () => {
    hub()
    await renderBell()
    await userEvent.click(await bell())
    await screen.findByRole('list', { name: 'Notifications' })
    const real = fetchMock.getMockImplementation()!
    fetchMock.mockImplementation((url: string, init?: RequestInit) =>
      String(url).endsWith('/inbox/read-all') ? Promise.resolve(json(500, {})) : real(url, init))
    await userEvent.click(screen.getByRole('button', { name: 'Mark all read' }))
    expect((await screen.findByRole('alert')).textContent).toContain("Couldn't mark them read.")
  })

  test('Mark all read clears the count', async () => {
    hub()
    await renderBell()
    await userEvent.click(await bell())
    await userEvent.click(await screen.findByRole('button', { name: 'Mark all read' }))
    await waitFor(async () => expect((await bell()).getAttribute('aria-label')).toBe('Notifications'))
    expect(screen.queryByRole('button', { name: 'Mark all read' })).toBeNull()
  })

  test('Escape closes it and gives focus back to the bell; so does clicking elsewhere', async () => {
    hub()
    await renderBell()
    await userEvent.click(await bell())
    await screen.findByRole('list', { name: 'Notifications' })
    screen.getByRole('button', { name: 'Mark all read' }).focus()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('list', { name: 'Notifications' })).toBeNull()
    expect(document.activeElement).toBe(await bell())
    await userEvent.click(await bell())
    await screen.findByRole('list', { name: 'Notifications' })
    await userEvent.click(document.body)
    expect(screen.queryByRole('list', { name: 'Notifications' })).toBeNull()
  })

  test('nothing yet says so', async () => {
    hub({}, [])
    await renderBell()
    await userEvent.click(await bell())
    expect(await screen.findByText('No notifications yet.')).toBeTruthy()
  })

  test('the count is asked again every 30 seconds', async () => {
    vi.useRealTimers()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    hub()
    await renderBell()
    await bell()
    const asked = () => requests(fetchMock).filter(r => r === 'GET /api/v1/tech/inbox/unread-count').length
    await waitFor(() => expect(asked()).toBe(1))
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000) })
    expect(asked()).toBe(2)
  })
})
