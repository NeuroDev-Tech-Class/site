import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import type { AdminAccount, StudentRow } from '../../lib/adminApi'
import { account, fakeFetch, json, requests } from '../../test/fake-hub'
import { OWNER, studentRow, type AdminHub } from '../../test/fake-admin'
import { openAdmin } from '../../test/open-admin'

let fetchMock: Mock
let sent: { method: string, path: string, body: unknown }[]

const ROSTER = [
  studentRow({ id: 's1', name: 'Sam Student', percent: 40, courses_started: 2, waiting: 1, returned: 0,
    last_activity_at: '2026-09-28T15:00:00Z' }),
  studentRow({ id: 's2', name: 'Ana Bloggs', email: 'ana@example.com', percent: 0, courses_started: 0,
    last_activity_at: null }),
  studentRow({ id: 's3', name: 'Olly Old', email: 'olly@example.com', student_type: 'old', status: 'deactivated' }),
  studentRow({ id: 'p1', name: 'Nia New', email: 'nia@example.com', status: 'pending', approved_at: null,
    created_at: '2026-09-29T15:00:00Z' }),
  studentRow({ id: 'p2', name: 'Uma Unconfirmed', email: 'uma@example.com', status: 'pending', approved_at: null,
    email_verified: false }),
]

const staff = (overrides: Partial<AdminAccount>): AdminAccount => ({
  ...account({ role: 'admin', ...overrides }), email_verified: true, created_at: '2026-09-01T15:00:00Z',
  approved_at: '2026-09-01T15:00:00Z', last_login_at: null, ...overrides,
})
const STAFF = [
  staff({ id: 'o1', first_name: 'Topher', last_name: 'S', email: 'topher@example.com', role: 'superadmin', staff_source: 'hub' }),
  staff({ id: 'c1', first_name: 'Ms', last_name: 'Lee', email: 'lee@example.com' }),
]

function hub(options: AdminHub & { refuseAdd?: string } = {}) {
  sent = []
  let roster: StudentRow[] = [...ROSTER]
  let team = [...STAFF]
  const record = (method: string, path: string, body: unknown) => sent.push({ method, path, body })
  return openAdmin(fetchMock, window.location.hash, {
    ...options,
    routes: {
      '/api/v1/tech/students': () => json(200, roster),
      '/api/v1/tech/accounts\\?role=staff': () => json(200, team),
      '/api/v1/tech/accounts/admins': ({ body }) => {
        record('POST', 'admins', body)
        if (options.refuseAdd) return json(409, { detail: options.refuseAdd })
        const added = staff({ id: 'n1', first_name: null, last_name: null, email: (body as { email: string }).email })
        team = [...team, added]
        return json(200, added)
      },
      '/api/v1/tech/accounts/admins/(\\w+)': ({ method, match }) => {
        record(method, `admins/${match[1]}`, undefined)
        team = team.filter(member => member.id !== match[1])
        return json(200, {})
      },
      '/api/v1/tech/accounts/(\\w+)/approve': ({ match }) => {
        record('POST', `${match[1]}/approve`, undefined)
        roster = roster.map(s => (s.id === match[1] ? { ...s, status: 'approved' } : s))
        return json(200, {})
      },
      '/api/v1/tech/accounts/(\\w+)': ({ method, match, body }) => {
        record(method, match[1], body)
        if (method === 'DELETE') roster = roster.filter(s => s.id !== match[1])
        if (method === 'PATCH') roster = roster.map(s => (s.id === match[1] ? { ...s, ...(body as object) } : s))
        return method === 'DELETE' ? new Response(null, { status: 204 }) : json(200, {})
      },
      ...options.routes,
    },
  })
}

const table = () => screen.findByRole('table', { name: /students/ })
const tab = (name: RegExp) => screen.getByRole('link', { name })

// Compiles the component once, outside any test's time limit; each test still imports it afresh
beforeAll(async () => { await import('./AdminApp') }, 30_000)

beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-30T15:00:00Z'))
  fetchMock = fakeFetch()
  window.location.hash = '#/students'
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  window.location.hash = ''
})

describe('the roster', () => {
  test('Current lists current students with where they stand, each opening their page', async () => {
    await hub()
    const rows = within(await table()).getAllByRole('row').slice(1)
    expect(rows.map(r => within(r).getByRole('link').textContent)).toEqual(['Sam Student', 'Ana Bloggs'])
    expect(within(rows[0]).getByRole('link', { name: 'Sam Student' }).getAttribute('href')).toBe('#/students/s1')
    expect(rows[0].textContent).toContain('40%')
    expect(rows[0].textContent).toContain('2 courses')
    expect(rows[0].textContent).toContain('1 waiting')
    expect(rows[0].textContent).toContain('2 days ago')
    expect(rows[1].textContent).toContain('Not started')
  })

  test('clicking anywhere on a row opens that student', async () => {
    await hub()
    const [, first] = within(await table()).getAllByRole('row')
    history.replaceState({ index: 5, scrollX: 0, scrollY: 0 }, '')
    await userEvent.click(within(first).getByText('40%'))
    await waitFor(() => expect(window.location.hash).toBe('#/students/s1'))
    // A step of its own, carrying the state the page router needs to come Back to it
    expect(history.state).toMatchObject({ index: 6 })
  })

  test('tabs count their students and keep the tab in the address', async () => {
    await hub()
    await table()
    // Pending counts the sign-ups waiting on a coach, as the sidebar badge does
    expect(tab(/Pending/).textContent).toContain('1')
    expect(tab(/Current/).getAttribute('aria-current')).toBe('page')
    history.replaceState({ index: 5, scrollX: 0, scrollY: 0 }, '', window.location.hash)
    await userEvent.click(tab(/Old/))
    await waitFor(() => expect(window.location.hash).toBe('#/students?tab=old'))
    expect(history.state).toEqual({ index: 5, scrollX: 0, scrollY: 0 })
    const rows = within(await table()).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(1)
    expect(rows[0].textContent).toContain('Olly Old')
    expect(rows[0].textContent).toContain('Deactivated')
  })

  test('the search finds students on every tab, and is kept in the address', async () => {
    await hub()
    await userEvent.type(await screen.findByRole('searchbox', { name: 'Search students' }), 'nia')
    await waitFor(() => expect(window.location.hash).toBe('#/students?q=nia'))
    expect(tab(/Pending/).textContent).toContain('1')
    expect(tab(/Current/).textContent).toContain('0')
    expect(screen.getByText('No current students match "nia".')).toBeTruthy()
  })

  test('the search matches emails too, and switching tabs adds no Back step', async () => {
    await hub()
    const before = history.length
    await userEvent.type(await screen.findByRole('searchbox', { name: 'Search students' }), 'ana@')
    await waitFor(() => expect(window.location.hash).toBe('#/students?q=ana%40'))
    expect(within(await table()).getByText('Ana Bloggs')).toBeTruthy()
    await userEvent.click(tab(/Old/))
    await waitFor(() => expect(window.location.hash).toBe('#/students?tab=old&q=ana%40'))
    expect(history.length).toBe(before)
  })

  test('a declined sign-up stays under Pending, marked declined', async () => {
    window.location.hash = '#/students?tab=pending'
    await hub({ routes: { '/api/v1/tech/students': () => json(200, [studentRow({ id: 'd1', name: 'Dee Declined', status: 'declined' })]) } })
    const [row] = within(await table()).getAllByRole('row').slice(1)
    expect(row.textContent).toContain('Dee Declined')
    expect(row.textContent).toContain('Declined')
  })

  test('the Admins tab is for the superadmin only', async () => {
    await hub()
    await table()
    expect(screen.queryByRole('link', { name: /Admins/ })).toBeNull()
  })
})

describe('row actions', () => {
  test('Approve lets a pending student in', async () => {
    window.location.hash = '#/students?tab=pending'
    await hub()
    const rows = within(await table()).getAllByRole('row').slice(1)
    expect(rows[1].textContent).toContain("hasn't confirmed their email yet")
    await userEvent.click(within(rows[0]).getByRole('button', { name: 'Approve Nia New' }))
    expect(await screen.findByText('Nia New approved.')).toBeTruthy()
    await waitFor(() => expect(tab(/Pending/).textContent).toContain('0'))
    expect(sent).toContainEqual({ method: 'POST', path: 'p1/approve', body: undefined })
    await userEvent.click(tab(/Current/))
    await waitFor(() => expect(window.location.hash).toBe('#/students'))
    expect(screen.queryByText('Nia New approved.')).toBeNull()
  })

  test('Deny asks first, then deletes the sign-up', async () => {
    window.location.hash = '#/students?tab=pending'
    await hub()
    const [first] = within(await table()).getAllByRole('row').slice(1)
    await userEvent.click(within(first).getByRole('button', { name: 'Deny Nia New' }))
    expect(sent).toEqual([])
    await userEvent.click(within(first).getByRole('button', { name: 'Keep' }))
    expect(within(first).getByRole('button', { name: 'Deny Nia New' })).toBeTruthy()
    await userEvent.click(within(first).getByRole('button', { name: 'Deny Nia New' }))
    await userEvent.click(within(first).getByRole('button', { name: 'Yes, delete this sign-up' }))
    await waitFor(() => expect(sent).toEqual([{ method: 'DELETE', path: 'p1', body: undefined }]))
    expect(await screen.findByText("Nia New's sign-up was deleted.")).toBeTruthy()
  })

  test('Move to Old moves them to the Old tab', async () => {
    await hub()
    const [, first] = within(await table()).getAllByRole('row')
    await userEvent.click(within(first).getByRole('button', { name: 'Move Sam Student to Old' }))
    await waitFor(() => expect(sent).toEqual([{ method: 'PATCH', path: 's1', body: { student_type: 'old' } }]))
    await waitFor(() => expect(tab(/Old/).textContent).toContain('2'))
    expect(await screen.findByText('Sam Student moved to Old.')).toBeTruthy()
    expect(within(await table()).queryByText('Sam Student')).toBeNull()
  })
})

describe('admins', () => {
  test('the superadmin sees every admin, and hub staff are managed in the hub', async () => {
    window.location.hash = '#/students?tab=admins'
    await hub({ account: OWNER })
    const rows = within(await screen.findByRole('table', { name: 'Admins' })).getAllByRole('row').slice(1)
    expect(rows[0].textContent).toContain('Topher S')
    expect(rows[0].textContent).toContain('Superadmin')
    expect(rows[0].textContent).toContain('Managed in the hub')
    expect(within(rows[0]).queryByRole('button')).toBeNull()
    expect(within(rows[1]).getByRole('button', { name: 'Remove Ms Lee as an admin' })).toBeTruthy()
  })

  test('adding an admin by email', async () => {
    window.location.hash = '#/students?tab=admins'
    await hub({ account: OWNER })
    await userEvent.type(await screen.findByRole('textbox', { name: 'Email' }), 'kim@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Add admin' }))
    await waitFor(() => expect(sent).toEqual([{ method: 'POST', path: 'admins', body: { email: 'kim@example.com' } }]))
    expect(await screen.findByText('kim@example.com is now an admin.')).toBeTruthy()
    expect(within(screen.getByRole('table', { name: 'Admins' })).getByText('kim@example.com')).toBeTruthy()
  })

  test("the hub's refusal to add someone is shown", async () => {
    window.location.hash = '#/students?tab=admins'
    await hub({ account: OWNER, refuseAdd: 'They are already an admin.' })
    await userEvent.type(await screen.findByRole('textbox', { name: 'Email' }), 'lee@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Add admin' }))
    expect((await screen.findByRole('alert')).textContent).toContain('They are already an admin.')
  })

  test('removing an admin asks first', async () => {
    window.location.hash = '#/students?tab=admins'
    await hub({ account: OWNER })
    const table = await screen.findByRole('table', { name: 'Admins' })
    await userEvent.click(within(table).getByRole('button', { name: 'Remove Ms Lee as an admin' }))
    await userEvent.click(within(table).getByRole('button', { name: 'Yes, remove' }))
    await waitFor(() => expect(sent).toEqual([{ method: 'DELETE', path: 'admins/c1', body: undefined }]))
    await waitFor(() => expect(within(table).queryByText('Ms Lee')).toBeNull())
  })
})

describe('arriving', () => {
  test("the hub's link for new sign-ups opens the Pending tab", async () => {
    window.location.hash = '#/accounts?status=pending'
    await hub()
    await table()
    expect(tab(/Pending/).getAttribute('aria-current')).toBe('page')
    expect(requests(fetchMock)).toContain('GET /api/v1/tech/students')
  })
})
