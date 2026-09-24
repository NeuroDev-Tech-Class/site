import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { TechAccount } from './api'

type Session = typeof import('./session')

const account: TechAccount = {
  id: 'a1', email: 'sam@example.com', first_name: 'Sam', last_name: 'Student', role: 'student',
  status: 'approved', student_type: 'current', staff_source: null, has_password: true,
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

let fetchMock: ReturnType<typeof vi.fn>
let session: Session

beforeEach(async () => {
  vi.resetModules()
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  session = await import('./session')
})
afterEach(() => vi.unstubAllGlobals())

describe('the session', () => {
  test('starts out loading, then signed in when the refresh cookie is good', async () => {
    fetchMock.mockResolvedValue(json(200, { access_token: 't', account }))
    expect(session.getSession()).toEqual({ status: 'loading' })
    await session.startSession()
    expect(session.getSession()).toEqual({ status: 'signed-in', account })
  })

  test('is signed out when there is no session at the hub', async () => {
    fetchMock.mockResolvedValue(json(401, { detail: 'Not signed in.' }))
    await session.startSession()
    expect(session.getSession()).toEqual({ status: 'signed-out' })
  })

  test('checks with the hub once per page load, however many parts of the page ask', async () => {
    fetchMock.mockResolvedValue(json(200, { access_token: 't', account }))
    await Promise.all([session.startSession(), session.startSession()])
    await session.startSession()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('tells subscribers when it changes', async () => {
    fetchMock.mockResolvedValue(json(401, {}))
    const seen: string[] = []
    const unsubscribe = session.subscribe(() => seen.push(session.getSession().status))
    await session.startSession()
    session.setAccount(account)
    unsubscribe()
    session.setAccount(null)
    expect(seen).toEqual(['signed-out', 'signed-in'])
  })

  test('signing out ends the session at the hub and here', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { access_token: 't', account })).mockResolvedValueOnce(new Response(null, { status: 204 }))
    await session.startSession()
    await session.signOut()
    expect(String(fetchMock.mock.calls[1][0])).toMatch(/\/api\/v1\/tech\/auth\/logout$/)
    expect(session.getSession()).toEqual({ status: 'signed-out' })
  })
})
