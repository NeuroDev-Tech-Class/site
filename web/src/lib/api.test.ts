import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

type Api = typeof import('./api')

const account = {
  id: 'a1', email: 'sam@example.com', first_name: 'Sam', last_name: 'Student', role: 'student',
  status: 'approved', student_type: 'current', staff_source: null, has_password: true,
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

let fetchMock: ReturnType<typeof vi.fn>
let api: Api

beforeEach(async () => {
  vi.resetModules()
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  api = await import('./api')
})
afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
  sessionStorage.clear()
})

const calls = (path: string) => fetchMock.mock.calls.filter(([url]) => String(url).endsWith(path))
const authHeader = (call: unknown[]) => (call[1] as RequestInit).headers as Record<string, string>

describe('refreshSession', () => {
  test('shares one refresh between everything that asks at the same time', async () => {
    fetchMock.mockResolvedValue(json(200, { access_token: 't1', account }))
    const results = await Promise.all([api.refreshSession(), api.refreshSession(), api.refreshSession()])
    expect(results).toEqual([account, account, account])
    expect(calls('/api/v1/tech/auth/refresh')).toHaveLength(1)
    expect((fetchMock.mock.calls[0][1] as RequestInit).credentials).toBe('include')
  })

  test('answers null when the visitor is not signed in', async () => {
    fetchMock.mockResolvedValue(json(401, { detail: 'Not signed in.' }))
    expect(await api.refreshSession()).toBeNull()
  })

  test('answers null when the hub cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    expect(await api.refreshSession()).toBeNull()
  })
})

describe('request', () => {
  test('on a 401 refreshes once, then retries with the new token', async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, { detail: 'expired' }))
      .mockResolvedValueOnce(json(200, { access_token: 'fresh', account }))
      .mockResolvedValueOnce(json(200, { ok: true }))
    expect(await api.request('/api/v1/tech/auth/me')).toEqual({ ok: true })
    const me = calls('/api/v1/tech/auth/me')
    expect(me).toHaveLength(2)
    expect(authHeader(me[1]).Authorization).toBe('Bearer fresh')
  })

  test('gives up after one refresh, with the 401 as the error', async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, { detail: 'expired' }))
      .mockResolvedValueOnce(json(401, { detail: 'Not signed in.' }))
    await expect(api.request('/api/v1/tech/auth/me')).rejects.toMatchObject({ status: 401 })
    expect(calls('/api/v1/tech/auth/me')).toHaveLength(1)
  })

  test("shows the hub's message, or a plain one when the hub sends a list of field errors", async () => {
    fetchMock.mockResolvedValueOnce(json(409, { detail: 'An account with this email already exists. Sign in instead.' }))
    await expect(api.request('/x', { method: 'POST' })).rejects.toThrow('An account with this email already exists. Sign in instead.')
    fetchMock.mockResolvedValueOnce(json(422, { detail: [{ loc: ['body', 'email'], msg: 'bad' }] }))
    await expect(api.request('/x', { method: 'POST' })).rejects.toThrow('Something went wrong. Please try again.')
  })
})

describe('signing in', () => {
  test('login sends the email and password and keeps the token for later requests', async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, { access_token: 'signed-in', account }))
      .mockResolvedValueOnce(json(200, {}))
    expect(await api.login('sam@example.com', 'pw-123456')).toEqual(account)
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string))
      .toEqual({ email: 'sam@example.com', password: 'pw-123456' })
    await api.request('/api/v1/tech/anything')
    expect(authHeader(fetchMock.mock.calls[1]).Authorization).toBe('Bearer signed-in')
  })

  test('never writes the token to browser storage or a readable cookie', async () => {
    fetchMock.mockImplementation(async () => json(200, { access_token: 'secret-token', account }))
    await api.login('sam@example.com', 'pw-123456')
    await api.refreshSession()
    await api.request('/api/v1/tech/anything')
    expect(authHeader(fetchMock.mock.calls[2]).Authorization).toBe('Bearer secret-token')
    const everything = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }) + document.cookie
    expect(everything).not.toContain('secret-token')
  })

  test('logout forgets the token even when the hub cannot be reached', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { access_token: 'signed-in', account }))
    await api.login('sam@example.com', 'pw-123456')
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(json(200, {}))
    await api.logout()
    await api.request('/api/v1/tech/anything')
    expect(authHeader(fetchMock.mock.calls[2]).Authorization).toBeUndefined()
  })

  test('the Google link carries where to come back to', () => {
    expect(api.googleSignInUrl('/courses/python-1'))
      .toBe(`${api.API_URL}/api/v1/tech/auth/google/start?redirect=%2Fcourses%2Fpython-1`)
  })
})

describe('content and progress calls', () => {
  const T = '/api/v1/tech'
  test.each([
    ['my progress', (a: Api) => a.getMyProgress(), 'GET', `${T}/progress`, undefined],
    ['a course', (a: Api) => a.getCourseProgress('gimp'), 'GET', `${T}/courses/gimp/progress`, undefined],
    ['an item', (a: Api) => a.getItem('i_1'), 'GET', `${T}/items/i_1`, undefined],
    ['an item progress', (a: Api) => a.getItemProgress('i_1'), 'GET', `${T}/items/i_1/progress`, undefined],
    ['open', (a: Api) => a.openItem('i_1'), 'POST', `${T}/items/i_1/open`, undefined],
    ['complete', (a: Api) => a.completeItem('i_1'), 'POST', `${T}/items/i_1/complete`, undefined],
    ['not done', (a: Api) => a.uncompleteItem('i_1'), 'DELETE', `${T}/items/i_1/complete`, undefined],
    ['heartbeat', (a: Api) => a.sendHeartbeat({ item_id: 'i_1', video_id: 'abc123', position_s: 10, duration_s: 100 }),
      'POST', `${T}/media/heartbeat`, { item_id: 'i_1', video_id: 'abc123', position_s: 10, duration_s: 100 }],
  ])('%s', async (_, call, method, path, body) => {
    fetchMock.mockResolvedValue(json(200, { ok: true }))
    expect(await call(api)).toEqual({ ok: true })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${api.API_URL}${path}`)
    expect(init.method ?? 'GET').toBe(method)
    expect(init.body === undefined ? undefined : JSON.parse(String(init.body))).toEqual(body)
  })

  test('ids are escaped so they can never change the path', async () => {
    fetchMock.mockResolvedValue(json(200, {}))
    await api.getItem('../accounts')
    expect(String(fetchMock.mock.calls[0][0])).toBe(`${api.API_URL}/api/v1/tech/items/..%2Faccounts`)
  })
})
