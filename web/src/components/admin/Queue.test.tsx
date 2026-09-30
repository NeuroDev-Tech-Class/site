import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { fakeFetch, json, requests } from '../../test/fake-hub'
import { queueRow, type AdminHub } from '../../test/fake-admin'
import { openAdmin } from '../../test/open-admin'

let fetchMock: Mock
const open = (hash: string, hub: AdminHub = {}) => openAdmin(fetchMock, hash, hub)

const QUEUE = [
  queueRow({ id: 's1__i_8__2', attempt: 2, submitted_at: '2026-09-25T15:00:00Z' }),
  queueRow({ id: 's2__i_5__1', kind: 'test', student: { id: 's2', name: 'Ana Bloggs', email: 'ana@example.com' },
    course: { id: 'python-1', title: 'Python I' }, item: { id: 'i_5', title: 'Unit 1 Test' }, submitted_at: '2026-09-30T12:00:00Z' }),
]

// Compiles the component once, outside any test's time limit; each test still imports it afresh
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

describe('the Grading Queue', () => {
  test('lists waiting work oldest first, each opening its grade view', async () => {
    await open('#/queue', { queue: QUEUE })
    const table = await screen.findByRole('table', { name: 'Work waiting for grading' })
    const [, first, second] = within(table).getAllByRole('row')
    expect(within(first).getByRole('link', { name: 'Movie Poster' }).getAttribute('href')).toBe('#/grade/s1__i_8__2')
    expect(first.textContent).toContain('Sam Student')
    expect(first.textContent).toContain('GIMP')
    expect(first.textContent).toContain('Checkpoint')
    expect(first.textContent).toContain('Attempt 2')
    expect(first.textContent).toContain('5 days')
    expect(second.textContent).toContain('Test')
    expect(second.textContent).toContain('today')
  })

  test('Grade next opens the oldest waiting piece', async () => {
    await open('#/queue', { queue: QUEUE })
    expect((await screen.findByRole('link', { name: 'Grade next' })).getAttribute('href')).toBe('#/grade/s1__i_8__2')
  })

  test('the course filter asks the hub for that course and keeps it in the address', async () => {
    await open('#/queue', { queue: QUEUE })
    await userEvent.selectOptions(await screen.findByRole('combobox', { name: 'Course' }), 'python-1')
    await waitFor(() => expect(window.location.hash).toBe('#/queue?course=python-1'))
    await waitFor(() => expect(requests(fetchMock)).toContain('GET /api/v1/tech/submissions/queue?course=python-1'))
  })

  test('the student search waits for typing to pause, then filters', async () => {
    await open('#/queue', { queue: QUEUE })
    await userEvent.type(await screen.findByRole('searchbox', { name: 'Student' }), 'Ana')
    await waitFor(() => expect(window.location.hash).toBe('#/queue?q=Ana'))
    const asked = requests(fetchMock).filter(r => r.startsWith('GET /api/v1/tech/submissions/queue?'))
    expect(asked).toEqual(['GET /api/v1/tech/submissions/queue?q=Ana'])
  })

  test('filtering neither adds a Back step nor moves the cursor out of the search box', async () => {
    await open('#/queue', { queue: QUEUE })
    const before = history.length
    await userEvent.selectOptions(await screen.findByRole('combobox', { name: 'Course' }), 'gimp')
    await waitFor(() => expect(window.location.hash).toBe('#/queue?course=gimp'))
    const box = screen.getByRole('searchbox', { name: 'Student' })
    await userEvent.type(box, 'Sam')
    await waitFor(() => expect(window.location.hash).toBe('#/queue?course=gimp&q=Sam'))
    expect(history.length).toBe(before)
    expect(document.activeElement).toBe(box)
  })

  test('filters in the address are used when the queue opens', async () => {
    await open('#/queue?course=gimp&q=sam', { queue: QUEUE })
    expect(((await screen.findByRole('combobox', { name: 'Course' })) as HTMLSelectElement).value).toBe('gimp')
    expect((screen.getByRole('searchbox', { name: 'Student' }) as HTMLInputElement).value).toBe('sam')
    await waitFor(() => expect(requests(fetchMock)).toContain('GET /api/v1/tech/submissions/queue?course=gimp&q=sam'))
  })

  test('says when there is more waiting than it shows', async () => {
    await open('#/queue', { routes: {
      '/api/v1/tech/submissions/queue(\\?.*)?': () => json(200, { total: 250, items: QUEUE }),
    } })
    expect(await screen.findByText('Showing the oldest 2 of 250.')).toBeTruthy()
  })

  test('nothing waiting, and nothing matching, say so differently', async () => {
    await open('#/queue')
    expect(await screen.findByText('Nothing is waiting. Nice work.')).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Grade next' })).toBeNull()
    cleanup()
    vi.resetModules()
    await open('#/queue?q=zed')
    expect(await screen.findByText('Nothing waiting matches these filters.')).toBeTruthy()
  })

  test('Grading Queue in the sidebar clears the search, and it stays cleared', async () => {
    await open('#/queue', { queue: QUEUE })
    const box = await screen.findByRole('searchbox', { name: 'Student' })
    await userEvent.type(box, 'ana')
    await waitFor(() => expect(window.location.hash).toBe('#/queue?q=ana'))
    await userEvent.click(within(screen.getByRole('navigation', { name: 'Dashboard' })).getByRole('link', { name: /Grading Queue/ }))
    await waitFor(() => expect(window.location.hash).toBe('#/queue'))
    await waitFor(() => expect((screen.getByRole('searchbox', { name: 'Student' }) as HTMLInputElement).value).toBe(''))
    await new Promise(resolve => setTimeout(resolve, 600))
    expect(window.location.hash).toBe('#/queue')
  })

  test('opening it from the sidebar moves focus to its heading', async () => {
    await open('#/today', { queue: QUEUE })
    await screen.findByRole('heading', { name: 'Today' })
    await userEvent.click(within(screen.getByRole('navigation', { name: 'Dashboard' })).getByRole('link', { name: /Grading Queue/ }))
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Grading Queue' })))
  })
})
