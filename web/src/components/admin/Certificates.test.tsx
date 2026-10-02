import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import type { AdminAccount, Certificate, CourseOutline, StudentCourse } from '../../lib/adminApi'
import { account, fakeFetch, json, requests } from '../../test/fake-hub'
import { openAdmin } from '../../test/open-admin'

let fetchMock: Mock
let sent: { method: string, path: string, body: unknown }[]
let opened: unknown[][]

const SAM: AdminAccount = {
  ...account({ id: 's1', first_name: 'Sam', last_name: 'Student' }), email_verified: true,
  created_at: '2026-09-01T15:00:00Z', approved_at: '2026-09-02T15:00:00Z', last_login_at: '2026-09-29T15:00:00Z',
}
const OUTLINE: CourseOutline = {
  id: 'gimp', title: '2D Digital Art - GIMP', heading: '2D Digital Art — GIMP',
  units: [{ id: 'u_1', title: 'Unit 1: Basics', items: [{ id: 'i_1', type: 'lesson', title: 'Reading - Layers', status: 'ok', tags: [] }] }],
}
const progress = (done: number, total = 29): StudentCourse => ({
  course_id: 'gimp', title: '2D Digital Art - GIMP', done, total, percent: Math.floor((done * 100) / total),
  next_item: null, last_activity_at: '2026-09-28T15:00:00Z', items: [],
})
const certificate = (overrides: Partial<Certificate> = {}): Certificate => ({
  id: 'c1', course: { id: 'gimp', title: '2D Digital Art - GIMP' }, student_name: 'Sam Student', course_name: 'GIMP',
  awarded_on: '2026-09-30', created_at: '2026-09-30T15:00:00Z', created_by: 'Ms Lee', access_given_at: null,
  access_given_by: null, revoked_at: null, revoked_by: null, ...overrides,
})

function hub(options: {
  done?: number, started?: boolean, certificates?: Certificate[], refuse?: string, madeElsewhere?: Certificate,
  // The certificate list never answers, to see what shows while it loads
  waiting?: boolean,
} = {}) {
  sent = []
  let list = options.certificates ?? []
  const record = (method: string, path: string, body?: unknown) => sent.push({ method, path, body })
  const replace = (changed: Certificate) => { list = list.map(c => (c.id === changed.id ? changed : c)); return json(200, changed) }
  return openAdmin(fetchMock, window.location.hash, {
    routes: {
      '/api/v1/tech/accounts/s1': () => json(200, SAM),
      '/api/v1/tech/accounts/s1/progress': () =>
        json(200, { account_id: 's1', courses: options.started === false ? [] : [progress(options.done ?? 12)] }),
      '/api/v1/tech/accounts/s1/submissions': () => json(200, []),
      '/api/v1/tech/accounts/s1/files': () => json(200, []),
      '/api/v1/tech/courses/gimp': () => json(200, OUTLINE),
      '/api/v1/tech/accounts/s1/certificates': () => (options.waiting ? new Promise<Response>(() => undefined) : json(200, list)),
      '/api/v1/tech/accounts/s1/courses/gimp/certificate/preview\\?(.*)': ({ match }) => {
        record('GET', `preview?${match[1]}`)
        return new Response('%PDF-1.7', { status: 200, headers: { 'Content-Type': 'application/pdf' } })
      },
      '/api/v1/tech/accounts/s1/courses/gimp/certificate': ({ body }) => {
        record('POST', 'create', body)
        if (options.madeElsewhere) list = [options.madeElsewhere, ...list]
        if (options.refuse) return json(409, { detail: options.refuse })
        const made = certificate(body as Partial<Certificate>)
        list = [made, ...list]
        return json(200, made)
      },
      '/api/v1/tech/certificates/(c\\d)/link': ({ match }) => {
        record('GET', `link ${match[1]}`)
        return json(200, { url: `https://r2.test/${match[1]}.pdf` })
      },
      '/api/v1/tech/certificates/(c\\d)/access': ({ method, match }) => {
        record(method, `access ${match[1]}`)
        const found = list.find(c => c.id === match[1]) as Certificate
        return replace(method === 'POST'
          ? { ...found, access_given_at: '2026-09-30T16:00:00Z', access_given_by: 'Ms Lee' }
          : { ...found, access_given_at: null, access_given_by: null })
      },
      '/api/v1/tech/certificates/(c\\d)/revoke': ({ match }) => {
        record('POST', `revoke ${match[1]}`)
        const found = list.find(c => c.id === match[1]) as Certificate
        return replace({ ...found, revoked_at: '2026-09-30T17:00:00Z', revoked_by: 'Ms Lee', access_given_at: null })
      },
    },
  })
}

const panel = () => screen.findByRole('region', { name: 'Certificate' })

beforeAll(async () => { await import('./AdminApp') }, 30_000)

beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-30T15:00:00Z'))
  fetchMock = fakeFetch()
  opened = []
  vi.stubGlobal('open', (...args: unknown[]) => { opened.push(args); return null })
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:preview', revokeObjectURL: () => {} }))
  window.location.hash = '#/students/s1/courses/gimp'
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  window.location.hash = ''
})

describe("a student's course: the certificate", () => {
  test('says whether the course is finished, and fills the form from the account, the course and today', async () => {
    await hub()
    const box = await panel()
    expect(await within(box).findByText('12 of 29 done: not finished yet. You can still create one.')).toBeTruthy()
    expect((await within(box).findByRole('textbox', { name: 'Name' }) as HTMLInputElement).value).toBe('Sam Student')
    expect((within(box).getByRole('textbox', { name: 'Course name' }) as HTMLInputElement).value).toBe('2D Digital Art - GIMP')
    expect((within(box).getByLabelText('Date') as HTMLInputElement).value).toBe('2026-09-30')
  })

  test('while the certificate loads, a placeholder shaped like the form holds its place', async () => {
    await hub({ waiting: true })
    expect(await within(await panel()).findByRole('status', { name: 'Loading the certificate' })).toBeTruthy()
  })

  test('a course not started yet says so', async () => {
    await hub({ started: false })
    expect(await within(await panel()).findByText('Not started yet. You can still create one.')).toBeTruthy()
  })

  test('a finished course says it is ready', async () => {
    await hub({ done: 29 })
    expect(await within(await panel()).findByText('Ready for a certificate: every item is done.')).toBeTruthy()
  })

  test('Preview opens the PDF with what is typed, and keeps nothing', async () => {
    await hub()
    const box = await panel()
    const name = await within(box).findByRole('textbox', { name: 'Name' })
    await userEvent.clear(name)
    await userEvent.type(name, 'Samantha Student')
    await userEvent.click(within(box).getByRole('button', { name: 'Preview' }))
    await waitFor(() => expect(opened).toEqual([['blob:preview', '_blank', 'noopener']]))
    expect(sent).toEqual([{ method: 'GET', body: undefined,
      path: 'preview?student_name=Samantha+Student&course_name=2D+Digital+Art+-+GIMP&awarded_on=2026-09-30' }])
  })

  test('Create makes it with what is typed, then offers Print, Give access and Revoke', async () => {
    await hub()
    const box = await panel()
    const course = await within(box).findByRole('textbox', { name: 'Course name' })
    await userEvent.clear(course)
    await userEvent.type(course, 'GIMP')
    await userEvent.click(within(box).getByRole('button', { name: 'Create certificate' }))
    expect(await within(box).findByText('Created Sep 30, 2026 by Ms Lee')).toBeTruthy()
    expect(sent).toEqual([{ method: 'POST', path: 'create',
      body: { student_name: 'Sam Student', course_name: 'GIMP', awarded_on: '2026-09-30' } }])
    expect(within(box).getByText('Sam Student · GIMP · Sep 30, 2026')).toBeTruthy()
    expect(within(box).getByText("Sam can't see it yet.")).toBeTruthy()
    expect(within(box).queryByRole('textbox', { name: 'Name' })).toBeNull()
  })

  test('an empty name or course name is caught before anything is sent', async () => {
    await hub()
    const box = await panel()
    const name = await within(box).findByRole('textbox', { name: 'Name' })
    await userEvent.clear(name)
    await userEvent.type(name, '   ')
    await userEvent.click(within(box).getByRole('button', { name: 'Create certificate' }))
    expect(await within(box).findByText('Fill in the name, the course name and the date.')).toBeTruthy()
    expect(sent).toEqual([])
  })

  test("the hub's refusal is shown", async () => {
    await hub({ refuse: 'Sam Student already has a certificate for this course.' })
    await userEvent.click(await within(await panel()).findByRole('button', { name: 'Create certificate' }))
    expect(await screen.findByText('Sam Student already has a certificate for this course.')).toBeTruthy()
  })

  test('refused because another coach just made one, it shows theirs', async () => {
    await hub({ refuse: 'Sam Student already has a certificate for this course.',
      madeElsewhere: certificate({ created_by: 'Mr Diaz' }) })
    const box = await panel()
    await userEvent.click(await within(box).findByRole('button', { name: 'Create certificate' }))
    expect(await within(box).findByText('Created Sep 30, 2026 by Mr Diaz')).toBeTruthy()
    expect(within(box).getByText('Sam Student already has a certificate for this course.')).toBeTruthy()
    expect(within(box).queryByRole('button', { name: 'Create certificate' })).toBeNull()
  })

  test('Print opens it; Give access and Take access away say who can see it', async () => {
    await hub({ certificates: [certificate()] })
    const box = await panel()
    await userEvent.click(await within(box).findByRole('button', { name: 'Print' }))
    await waitFor(() => expect(opened).toEqual([['https://r2.test/c1.pdf', '_blank', 'noopener']]))
    await userEvent.click(within(box).getByRole('button', { name: 'Give access' }))
    expect(await within(box).findByText('Sam can view it in My Courses.')).toBeTruthy()
    await userEvent.click(within(box).getByRole('button', { name: 'Take access away' }))
    expect(await within(box).findByText("Sam can't see it yet.")).toBeTruthy()
    expect(sent.map(s => `${s.method} ${s.path}`)).toEqual(['GET link c1', 'POST access c1', 'DELETE access c1'])
  })

  test('Revoke asks first, then the form is back for a new one', async () => {
    await hub({ certificates: [certificate()] })
    const box = await panel()
    await userEvent.click(await within(box).findByRole('button', { name: 'Revoke the GIMP certificate' }))
    expect(sent).toEqual([])
    await userEvent.click(within(box).getByRole('button', { name: 'Revoke it' }))
    expect(await within(box).findByRole('button', { name: 'Create certificate' })).toBeTruthy()
    expect(sent.map(s => s.path)).toEqual(['revoke c1'])
    expect(within(box).getByText('Revoked Sep 30, 2026 by Ms Lee: GIMP · Sep 30, 2026')).toBeTruthy()
  })
})

describe("a student's page: their certificates", () => {
  beforeEach(() => { window.location.hash = '#/students/s1' })

  test('lists each with whether the student can see it, revoked ones too, each opening its course', async () => {
    await hub({ certificates: [
      certificate({ id: 'c2', access_given_at: '2026-09-30T16:00:00Z' }),
      certificate({ revoked_at: '2026-09-29T15:00:00Z', revoked_by: 'Ms Lee' }),
    ] })
    const list = await screen.findByRole('list', { name: 'Certificates' })
    const rows = within(list).getAllByRole('listitem')
    expect(rows[0].textContent).toContain('GIMP')
    expect(rows[0].textContent).toContain('Sam can view it')
    expect(rows[1].textContent).toContain('Revoked')
    expect(within(rows[0]).getByRole('link').getAttribute('href')).toBe('#/students/s1/courses/gimp')
    expect(requests(fetchMock)).toContain('GET /api/v1/tech/accounts/s1/certificates')
  })

  test('none yet says so', async () => {
    await hub()
    expect(await screen.findByText('No certificates yet. Open a course to create one.')).toBeTruthy()
  })
})
