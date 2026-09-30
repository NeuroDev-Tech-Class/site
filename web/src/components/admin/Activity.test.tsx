import { act, cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { fakeFetch, json, requests } from '../../test/fake-hub'
import { activityLine, studentRow, type AdminHub } from '../../test/fake-admin'
import { openAdmin } from '../../test/open-admin'

let fetchMock: Mock

const FIRST = [
  activityLine({ id: 'l3', summary: 'Sam Student handed in Movie Poster', type: 'submission_received', type_label: 'Work submitted',
    created_at: '2026-09-30T14:00:00Z' }),
  activityLine({ id: 'l2', summary: 'Ms Lee approved Nia New', type: 'account_approved', type_label: 'Account approved',
    link: '/admin#/students/p1', course_id: '', course_name: '', created_at: '2026-09-29T15:00:00Z' }),
]
const OLDER = [activityLine({ id: 'l1', summary: 'Ms Lee marked Movie Poster complete for Sam Student', created_at: '2026-09-20T15:00:00Z' })]

function hub(options: AdminHub & { lines?: typeof FIRST } = {}) {
  return openAdmin(fetchMock, window.location.hash, {
    students: [studentRow(), studentRow({ id: 's2', name: 'Ana Bloggs' })],
    ...options,
    routes: {
      '/api/v1/tech/activity(\\?.*)?': ({ match }) => {
        const params = new URLSearchParams((match[1] ?? '').slice(1))
        if (params.get('before') === 'c1') return json(200, { items: OLDER, next: null })
        const lines = options.lines ?? FIRST
        return json(200, { items: lines, next: lines.length ? 'c1' : null })
      },
      ...options.routes,
    },
  })
}

// Compiles the component once, outside any test's time limit; each test still imports it afresh
beforeAll(async () => { await import('./AdminApp') }, 30_000)

beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-30T15:00:00Z'))
  fetchMock = fakeFetch()
  window.location.hash = '#/activity'
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  window.location.hash = ''
})

describe('the activity record', () => {
  test('lists what happened, newest first, each opening where it happened in the dashboard', async () => {
    await hub()
    const list = await screen.findByRole('list', { name: 'Activity' })
    const rows = within(list).getAllByRole('listitem')
    expect(within(rows[0]).getByRole('link', { name: 'Sam Student handed in Movie Poster' }).getAttribute('href'))
      .toBe('#/grade/s1__i_8__1')
    expect(rows[0].textContent).toContain('Work submitted')
    expect(rows[0].textContent).toContain('1 hour ago')
    expect(within(rows[1]).getByRole('link').getAttribute('href')).toBe('#/students/p1')
  })

  test('Show older adds the next page below, and goes once there is nothing older', async () => {
    await hub()
    await userEvent.click(await screen.findByRole('button', { name: 'Show older' }))
    await waitFor(() => expect(within(screen.getByRole('list', { name: 'Activity' })).getAllByRole('listitem')).toHaveLength(3))
    expect(requests(fetchMock)).toContain('GET /api/v1/tech/activity?before=c1')
    expect(screen.queryByRole('button', { name: 'Show older' })).toBeNull()
  })

  test('while older lines are shown, new activity waits, so no line in between is lost', async () => {
    vi.useRealTimers()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    let newer = false
    await hub({ routes: {
      '/api/v1/tech/activity(\\?.*)?': ({ match }) => {
        if (new URLSearchParams((match[1] ?? '').slice(1)).get('before') === 'c1') return json(200, { items: OLDER, next: null })
        // Two new lines push the first page on: it now ends before the lines it used to hold
        const lines = newer ? [activityLine({ id: 'l9', summary: 'Newest' }), activityLine({ id: 'l8', summary: 'Newer' })] : FIRST
        return json(200, { items: lines, next: 'c1' })
      },
    } })
    await userEvent.click(await screen.findByRole('button', { name: 'Show older' }))
    await waitFor(() => expect(within(screen.getByRole('list', { name: 'Activity' })).getAllByRole('listitem')).toHaveLength(3))
    newer = true
    await act(async () => { await vi.advanceTimersByTimeAsync(31_000) })
    const shown = within(screen.getByRole('list', { name: 'Activity' })).getAllByRole('listitem').map(li => li.textContent)
    expect(shown.join('|')).toContain('Sam Student handed in Movie Poster')
    expect(shown.join('|')).toContain('Ms Lee approved Nia New')
  })

  test('Show older failing says so and can be tried again', async () => {
    await hub({ routes: {
      '/api/v1/tech/activity(\\?.*)?': ({ match }) => (new URLSearchParams((match[1] ?? '').slice(1)).get('before')
        ? json(500, {}) : json(200, { items: FIRST, next: 'c1' })),
    } })
    await userEvent.click(await screen.findByRole('button', { name: 'Show older' }))
    expect((await screen.findByRole('alert')).textContent).toContain("Couldn't load older activity.")
    expect(screen.getByRole('button', { name: 'Show older' })).toBeTruthy()
  })

  test('older pages keep adding up, and a line already shown is not shown twice', async () => {
    const zero = activityLine({ id: 'l0', summary: 'Nia New signed up', created_at: '2026-09-10T15:00:00Z' })
    await hub({ routes: {
      '/api/v1/tech/activity(\\?.*)?': ({ match }) => {
        const before = new URLSearchParams((match[1] ?? '').slice(1)).get('before')
        // New activity pushed the second line onto the next page, so it arrives again
        if (before === 'c1') return json(200, { items: [FIRST[1], ...OLDER], next: 'c2' })
        if (before === 'c2') return json(200, { items: [zero], next: null })
        return json(200, { items: FIRST, next: 'c1' })
      },
    } })
    await userEvent.click(await screen.findByRole('button', { name: 'Show older' }))
    await waitFor(() => expect(within(screen.getByRole('list', { name: 'Activity' })).getAllByRole('listitem')).toHaveLength(3))
    await userEvent.click(screen.getByRole('button', { name: 'Show older' }))
    await waitFor(() => expect(within(screen.getByRole('list', { name: 'Activity' })).getAllByRole('listitem')).toHaveLength(4))
    expect(screen.getByText('Nia New signed up')).toBeTruthy()
  })

  test('filters by type, student and course, kept in the address', async () => {
    const before = history.length
    await hub()
    await userEvent.selectOptions(await screen.findByRole('combobox', { name: 'Type' }), 'submission_graded')
    await waitFor(() => expect(window.location.hash).toBe('#/activity?type=submission_graded'))
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Student' }), 's2')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Course' }), 'gimp')
    await waitFor(() => expect(requests(fetchMock)).toContain('GET /api/v1/tech/activity?type=submission_graded&student=s2&course=gimp'))
    expect(window.location.hash).toBe('#/activity?type=submission_graded&student=s2&course=gimp')
    expect(history.length).toBe(before)
  })

  test('filters in the address are used when it opens', async () => {
    window.location.hash = '#/activity?course=gimp'
    await hub()
    expect(((await screen.findByRole('combobox', { name: 'Course' })) as HTMLSelectElement).value).toBe('gimp')
    await waitFor(() => expect(requests(fetchMock)).toContain('GET /api/v1/tech/activity?course=gimp'))
  })

  test('nothing yet, and nothing matching, say so differently', async () => {
    await hub({ lines: [] })
    expect(await screen.findByText('Nothing has happened yet.')).toBeTruthy()
    cleanup()
    vi.resetModules()
    window.location.hash = '#/activity?type=files_removed'
    await hub({ lines: [] })
    expect(await screen.findByText('Nothing matches these filters.')).toBeTruthy()
  })

  test('Download CSV saves the filtered record under the name the hub gives it', async () => {
    window.location.hash = '#/activity?type=submission_graded'
    const clicked: { href: string, download: string }[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push({ href: this.href, download: this.download })
    })
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:csv', revokeObjectURL: () => undefined }))
    await hub({ routes: {
      '/api/v1/tech/activity.csv\\?type=submission_graded': () => new Response('when,summary\n', {
        status: 200, headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="activity-2026-09-30.csv"' },
      }),
    } })
    await userEvent.click(await screen.findByRole('button', { name: 'Download CSV' }))
    await waitFor(() => expect(clicked).toEqual([{ href: 'blob:csv', download: 'activity-2026-09-30.csv' }]))
  })

  test('the hub not answering says so', async () => {
    await hub({ routes: { '/api/v1/tech/activity(\\?.*)?': () => json(500, {}) } })
    expect(await screen.findByText("Couldn't load this. It will try again shortly, or reload the page.")).toBeTruthy()
  })
})
