import { cleanup, render, screen } from '@testing-library/react'
import type { Mock } from 'vitest'
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import type { AdminAccount } from '../../lib/adminApi'
import { account, fakeFetch, json, type Route } from '../../test/fake-hub'
import { COURSES, openAdmin } from '../../test/open-admin'

let fetchMock: Mock

const waits: Route = () => new Promise<Response>(() => undefined)
const SUPER = { role: 'superadmin' as const, first_name: 'Topher' }
const SAM: AdminAccount = {
  ...account({ id: 's1', first_name: 'Sam', last_name: 'Student' }), email_verified: true,
  created_at: '2026-09-01T15:00:00Z', approved_at: '2026-09-02T15:00:00Z', last_login_at: '2026-09-29T15:00:00Z',
}
const QUEUE = '/api/v1/tech/submissions/queue(\\?.*)?'

// Compiles the component once, outside any test's time limit; each test still imports it afresh
beforeAll(async () => { await import('./AdminApp') }, 30_000)

beforeEach(() => {
  vi.resetModules()
  fetchMock = fakeFetch()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  window.location.hash = ''
})

describe('every dashboard view, while it loads, shows placeholders shaped like it', () => {
  test('the dashboard itself, while the sign-in is checked', async () => {
    window.location.hash = '#/today'
    fetchMock.mockReturnValue(new Promise(() => undefined))
    const { default: AdminApp } = await import('./AdminApp')
    render(<AdminApp courses={COURSES} />)
    expect(screen.getByRole('status', { name: 'Loading the dashboard' }).getAttribute('aria-busy')).toBe('true')
  })

  test.each([
    ['#/today', 'Loading today', undefined, { [QUEUE]: waits, '/api/v1/tech/students': waits }],
    ['#/queue', 'Loading the queue', undefined, { [QUEUE]: waits }],
    ['#/grade/s1__i_8__1', 'Loading this work', undefined, { '/api/v1/tech/submissions/s1__i_8__1': waits }],
    ['#/students', 'Loading students', undefined, { '/api/v1/tech/students': waits }],
    ['#/students?tab=admins', 'Loading the admins', SUPER, { '/api/v1/tech/accounts\\?role=staff': waits }],
    ['#/students/s1', 'Loading the student', undefined, { '/api/v1/tech/accounts/s1': waits }],
    ['#/students/s1/courses/gimp', 'Loading the course', undefined, { '/api/v1/tech/courses/gimp': waits }],
    ['#/tests', 'Loading the tests', undefined, { '/api/v1/tech/tests': waits }],
    ['#/tests/i_5', 'Loading the test', undefined, { '/api/v1/tech/tests/i_5/preview': waits }],
    ['#/activity', 'Loading the activity', undefined, { '/api/v1/tech/activity(\\?.*)?': waits }],
    ['#/storage', 'Loading storage', SUPER, { '/api/v1/tech/files/usage': waits }],
  ] as const)('%s', async (hash, label, who, routes) => {
    await openAdmin(fetchMock, hash, { account: who, routes })
    expect((await screen.findByRole('status', { name: label })).getAttribute('aria-busy')).toBe('true')
  })

  test("a student's page: each part while it loads", async () => {
    await openAdmin(fetchMock, '#/students/s1', {
      account: SUPER,
      routes: {
        '/api/v1/tech/accounts/s1': () => json(200, SAM),
        '/api/v1/tech/accounts/s1/progress': waits,
        '/api/v1/tech/accounts/s1/submissions': waits,
        '/api/v1/tech/accounts/s1/files': waits,
        '/api/v1/tech/accounts/s1/certificates': waits,
      },
    })
    for (const label of ['Loading their courses', 'Loading their work', 'Loading their uploads', 'Loading certificates']) {
      expect(await screen.findByRole('status', { name: label })).toBeTruthy()
    }
  })
})
