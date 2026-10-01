import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import type { AdminAccount, AdminFile, CourseOutline, StudentCourse } from '../../lib/adminApi'
import type { ItemProgress } from '../../lib/api'
import { account, fakeFetch, json, requests, submission } from '../../test/fake-hub'
import { OWNER, type AdminHub } from '../../test/fake-admin'
import { openAdmin } from '../../test/open-admin'

let fetchMock: Mock
let sent: { method: string, path: string, body: unknown }[]

const SAM: AdminAccount = {
  ...account({ id: 's1' }), email_verified: true, created_at: '2026-09-01T15:00:00Z',
  approved_at: '2026-09-02T15:00:00Z', last_login_at: '2026-09-29T15:00:00Z',
}

const item = (item_id: string, status: ItemProgress['status'], videos: ItemProgress['videos'] = []): ItemProgress => ({
  item_id, status, done_at: status === 'done' ? '2026-09-28T15:00:00Z' : null, opened_at: '2026-09-27T15:00:00Z', videos,
})

const GIMP: StudentCourse = {
  course_id: 'gimp', title: '2D Digital Art - GIMP', done: 12, total: 29, percent: 41,
  next_item: { id: 'i_2', title: 'Tools' }, last_activity_at: '2026-09-28T15:00:00Z',
  items: [item('i_1', 'done'), item('i_2', null, [{ video_id: 'v1', percent: 45 }]), item('i_4', 'submitted')],
}

const OUTLINE: CourseOutline = {
  id: 'gimp', title: '2D Digital Art - GIMP', heading: '2D Digital Art — GIMP', units: [
    { id: 'u_1', title: 'Unit 1: Basics', items: [
      { id: 'i_1', type: 'lesson', title: 'Reading - Layers', status: 'ok', tags: [] },
      { id: 'i_2', type: 'video', title: 'Tools', status: 'ok', tags: [] },
      { id: 'i_3', type: 'note', title: null, status: 'ok', tags: ['exercise'], html: '<b>Exercise 1.1:</b> Open GIMP.' },
      { id: 'i_n', type: 'note', title: null, status: 'ok', tags: [], html: 'Tip: save often.' },
      { id: 'i_4', type: 'checkpoint', title: 'Movie Poster', status: 'ok', tags: [] },
      { id: 'i_5', type: 'test', title: 'Unit 1 Test', status: 'needs_content', tags: [] },
    ] },
  ],
}

const WORK = [
  submission({ id: 's1__i_4__2', attempt: 2, item: { id: 'i_4', title: 'Movie Poster' }, status_label: 'Waiting for grading' }),
  submission({ id: 's1__i_4__1', item: { id: 'i_4', title: 'Movie Poster' }, status: 'returned', status_label: 'Needs revision',
    submitted_at: '2026-09-20T15:00:00Z' }),
]

const FILES: AdminFile[] = [
  { id: 'f1', field_id: 'poster', name: 'poster.png', content_type: 'image/png', bytes: 2 * 1024 * 1024, status: 'ready',
    uploaded_at: '2026-09-28T15:00:00Z', item: { id: 'i_4', title: 'Movie Poster' }, course: { id: 'gimp', title: 'GIMP' },
    created_at: '2026-09-28T15:00:00Z', removed_at: null },
  { id: 'f2', field_id: 'song', name: 'theme.mp3', content_type: 'audio/mpeg', bytes: 1024 * 1024, status: 'ready',
    uploaded_at: '2026-09-27T15:00:00Z', item: { id: 'i_4', title: 'Movie Poster' }, course: { id: 'gimp', title: 'GIMP' },
    created_at: '2026-09-27T15:00:00Z', removed_at: null },
]

function hub(options: AdminHub & { student?: Partial<AdminAccount>, courses?: StudentCourse[], work?: typeof WORK } = {}) {
  sent = []
  let student = { ...SAM, ...options.student }
  let progress = options.courses ?? [GIMP]
  let files = FILES
  const record = (method: string, path: string, body?: unknown) => sent.push({ method, path, body })
  return openAdmin(fetchMock, window.location.hash, {
    ...options,
    routes: {
      '/api/v1/tech/accounts/s1': ({ method, body }) => {
        if (method === 'PATCH') {
          record('PATCH', 's1', body)
          student = { ...student, ...(body as object) }
        }
        return json(200, student)
      },
      '/api/v1/tech/accounts/s1/approve': () => {
        record('POST', 's1/approve')
        student = { ...student, status: 'approved' }
        return json(200, student)
      },
      '/api/v1/tech/accounts/s1/progress': () => json(200, { account_id: 's1', courses: progress }),
      '/api/v1/tech/accounts/s1/submissions': () => json(200, options.work ?? WORK),
      '/api/v1/tech/accounts/s1/files': () => json(200, files),
      '/api/v1/tech/accounts/s1/files/remove-all': () => {
        record('POST', 'remove-all')
        files = files.map(f => ({ ...f, status: 'removed' as const, removed_at: '2026-09-30T15:00:00Z' }))
        return json(200, { count: 2, bytes: 3 * 1024 * 1024 })
      },
      '/api/v1/tech/files/(f\\d)': ({ match }) => {
        record('DELETE', `files/${match[1]}`)
        files = files.map(f => (f.id === match[1] ? { ...f, status: 'removed' as const } : f))
        return new Response(null, { status: 204 })
      },
      '/api/v1/tech/courses/(gimp|python-1)': ({ match }) =>
        json(200, match[1] === 'gimp' ? OUTLINE : { ...OUTLINE, id: 'python-1', title: 'Python I', heading: 'Python I' }),
      '/api/v1/tech/accounts/s1/items/(\\w+)/complete': ({ method, match }) => {
        record(method, `items/${match[1]}`)
        const done = method === 'POST'
        progress = progress.map(c => (c.course_id !== 'gimp' ? c : {
          ...c, done: c.done + (done ? 1 : -1), percent: Math.floor(((c.done + (done ? 1 : -1)) * 100) / c.total),
          items: [...c.items.filter(i => i.item_id !== match[1]), item(match[1], done ? 'done' : null)],
        }))
        return json(200, item(match[1], done ? 'done' : null))
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
  window.location.hash = '#/students/s1'
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  window.location.hash = ''
})

describe("a student's page", () => {
  test('says who they are, where they are in each course, and what they handed in', async () => {
    await hub()
    expect(await screen.findByRole('heading', { level: 1, name: 'Sam Student' })).toBeTruthy()
    expect(screen.getByText(/sam@example.com/)).toBeTruthy()
    expect(screen.getByText(/Approved · Current/)).toBeTruthy()
    const courses = await screen.findByRole('list', { name: 'Courses' })
    const gimp = within(courses).getByRole('link', { name: /2D Digital Art - GIMP/ })
    expect(gimp.getAttribute('href')).toBe('#/students/s1/courses/gimp')
    expect(gimp.textContent).toContain('41%')
    expect(gimp.textContent).toContain('12 of 29')
    const work = within(await screen.findByRole('table', { name: 'Work handed in' })).getAllByRole('row').slice(1)
    expect(within(work[0]).getByRole('link', { name: 'Movie Poster' }).getAttribute('href')).toBe('#/grade/s1__i_4__2')
    expect(work[0].textContent).toContain('Attempt 2')
    expect(work[1].textContent).toContain('Needs revision')
  })

  test('any course can be opened for them, started or not', async () => {
    await hub()
    await userEvent.selectOptions(await screen.findByRole('combobox', { name: 'Open another course' }), 'python-1')
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await waitFor(() => expect(window.location.hash).toBe('#/students/s1/courses/python-1'))
  })

  test('nothing handed in and nothing started say so', async () => {
    await hub({ courses: [], work: [] })
    expect(await screen.findByText("Hasn't started a course yet.")).toBeTruthy()
    expect(await screen.findByText('Nothing handed in yet.')).toBeTruthy()
  })

  test('Move to Old, then Deactivate (asked first) and Reactivate', async () => {
    await hub()
    await userEvent.click(await screen.findByRole('button', { name: 'Move to Old' }))
    await waitFor(() => expect(screen.getByText(/Approved · Old/)).toBeTruthy())
    await userEvent.click(screen.getByRole('button', { name: 'Deactivate Sam Student' }))
    await userEvent.click(screen.getByRole('button', { name: 'Yes, deactivate' }))
    await waitFor(() => expect(screen.getByText(/Deactivated · Old/)).toBeTruthy())
    await userEvent.click(screen.getByRole('button', { name: 'Reactivate' }))
    await waitFor(() => expect(screen.getByText(/Approved · Old/)).toBeTruthy())
    expect(sent).toEqual([
      { method: 'PATCH', path: 's1', body: { student_type: 'old' } },
      { method: 'PATCH', path: 's1', body: { status: 'deactivated' } },
      { method: 'PATCH', path: 's1', body: { status: 'approved' } },
    ])
  })

  test('someone waiting for approval can be approved from here', async () => {
    await hub({ student: { status: 'pending', approved_at: null } })
    await userEvent.click(await screen.findByRole('button', { name: 'Approve' }))
    await waitFor(() => expect(screen.getByText(/Approved · Current/)).toBeTruthy())
  })

  test('a student who is not there any more says so', async () => {
    await hub({ routes: { '/api/v1/tech/accounts/s1': () => json(404, { detail: 'Account not found.' }) } })
    expect(await screen.findByText("This student isn't there any more.")).toBeTruthy()
  })
})

describe('their uploads (superadmin)', () => {
  test('are listed with where each belongs, and each can be removed after asking', async () => {
    await hub({ account: OWNER })
    const uploads = await screen.findByRole('table', { name: 'Uploads' })
    const rows = within(uploads).getAllByRole('row').slice(1)
    expect(rows[0].textContent).toContain('poster.png')
    expect(rows[0].textContent).toContain('Movie Poster')
    expect(rows[0].textContent).toContain('2 MB')
    await userEvent.click(within(rows[0]).getByRole('button', { name: 'Remove poster.png' }))
    await userEvent.click(within(rows[0]).getByRole('button', { name: 'Yes, remove' }))
    await waitFor(() => expect(sent).toEqual([{ method: 'DELETE', path: 'files/f1', body: undefined }]))
    await waitFor(() => expect(within(uploads).getAllByRole('row')[1].textContent).toContain('Removed'))
  })

  test('Remove all says how much it freed', async () => {
    await hub({ account: OWNER })
    await screen.findByRole('table', { name: 'Uploads' })
    expect(screen.getByText('2 files · 3 MB')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Remove all of Sam Student\'s uploads' }))
    await userEvent.click(screen.getByRole('button', { name: 'Yes, remove all' }))
    expect(await screen.findByText('Removed 2 files (3 MB).')).toBeTruthy()
  })

  test('are not shown to other coaches', async () => {
    await hub()
    await screen.findByRole('table', { name: 'Work handed in' })
    expect(screen.queryByRole('table', { name: 'Uploads' })).toBeNull()
    expect(requests(fetchMock)).not.toContain('GET /api/v1/tech/accounts/s1/files')
  })
})

describe('one course for a student', () => {
  beforeEach(() => { window.location.hash = '#/students/s1/courses/gimp' })

  test('lists every item unit by unit with where the student is on it', async () => {
    await hub()
    expect(await screen.findByRole('heading', { level: 1, name: '2D Digital Art - GIMP' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Sam Student' }).getAttribute('href')).toBe('#/students/s1')
    expect(screen.getByText('12 of 29 done · 41%')).toBeTruthy()
    const unit = await screen.findByRole('list', { name: 'Unit 1: Basics' })
    const rows = within(unit).getAllByRole('listitem')
    expect(rows.map(r => within(r).getByTestId('title').textContent)).toEqual([
      'Layers', 'Tools', 'Exercise 1.1: Open GIMP.', 'Movie Poster', 'Unit 1 Test',
    ])
    expect(rows[0].textContent).toContain('Done Sep 28')
    expect(rows[1].textContent).toContain('45% watched')
    expect(within(rows[2]).getByRole('button', { name: 'Mark Exercise 1.1: Open GIMP. done' })).toBeTruthy()
    expect(within(rows[3]).getByRole('link', { name: 'Grade Movie Poster' }).getAttribute('href')).toBe('#/grade/s1__i_4__2')
    expect(rows[3].textContent).toContain('Submitted')
    expect(rows[4].textContent).toContain('Not started')
    expect(rows[4].textContent).not.toContain('form')
    expect(within(rows[3]).queryByRole('button')).toBeNull()
    expect(within(rows[4]).queryByRole('button')).toBeNull()
  })

  test('the coach marks an item done for them, and back to not done', async () => {
    await hub()
    const unit = await screen.findByRole('list', { name: 'Unit 1: Basics' })
    await userEvent.click(within(unit).getByRole('button', { name: 'Mark Tools done' }))
    await waitFor(() => expect(screen.getByText('13 of 29 done · 44%').textContent).toBeTruthy())
    expect(within(unit).getAllByRole('listitem')[1].textContent).toContain('Done')
    await userEvent.click(within(unit).getByRole('button', { name: 'Mark Tools not done' }))
    await waitFor(() => expect(screen.getByText('12 of 29 done · 41%')).toBeTruthy())
    expect(sent).toEqual([{ method: 'POST', path: 'items/i_2', body: undefined }, { method: 'DELETE', path: 'items/i_2', body: undefined }])
  })

  test('a test they took on its old Form can be marked done for them, and one they finished by taking it stays done', async () => {
    const outline: CourseOutline = { ...OUTLINE, units: [{ id: 'u_2', title: 'Unit 2: Tests', items: [
      { id: 'i_6', type: 'test', title: 'Unit 2 Test', status: 'ok', tags: [] },
      { id: 'i_7', type: 'test', title: 'Unit 3 Test', status: 'ok', tags: [] },
    ] }] }
    await hub({
      courses: [{ ...GIMP, items: [item('i_7', 'done')] }],
      work: [submission({ id: 's1__i_7__1', item: { id: 'i_7', title: 'Unit 3 Test' }, kind: 'test', status: 'graded' })],
      routes: { '/api/v1/tech/courses/(gimp|python-1)': () => json(200, outline) },
    })
    const unit = await screen.findByRole('list', { name: 'Unit 2: Tests' })
    await userEvent.click(within(unit).getByRole('button', { name: 'Mark Unit 2 Test done' }))
    await waitFor(() => expect(within(unit).getAllByRole('listitem')[0].textContent).toContain('Done'))
    expect(sent).toEqual([{ method: 'POST', path: 'items/i_6', body: undefined }])
    expect(within(within(unit).getAllByRole('listitem')[1]).queryByRole('button')).toBeNull()
  })

  test('a course they have not started shows everything not started', async () => {
    window.location.hash = '#/students/s1/courses/python-1'
    await hub({ courses: [] })
    const unit = await screen.findByRole('list', { name: 'Unit 1: Basics' })
    expect(within(unit).getAllByRole('listitem')[0].textContent).toContain('Not started')
    expect(screen.getByText('Not started yet')).toBeTruthy()
  })
})
