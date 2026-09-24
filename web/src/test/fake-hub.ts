import { vi, type Mock } from 'vitest'
import type { TechAccount } from '../lib/api'

export const account = (overrides: Partial<TechAccount> = {}): TechAccount => ({
  id: 'a1', email: 'sam@example.com', first_name: 'Sam', last_name: 'Student', role: 'student',
  status: 'approved', student_type: 'current', staff_source: null, has_password: true, ...overrides,
})

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

export const signedIn = (overrides: Partial<TechAccount> = {}) =>
  json(200, { access_token: 't', account: account(overrides) })

export function fakeFetch(): Mock {
  const fn = vi.fn()
  vi.stubGlobal('fetch', fn)
  return fn
}

/** The JSON bodies sent to paths ending in `path` */
export const sentTo = (fetchMock: Mock, path: string): unknown[] =>
  fetchMock.mock.calls
    .filter(([url]) => String(url).endsWith(path))
    .map(([, init]) => JSON.parse(String((init as RequestInit).body)))
