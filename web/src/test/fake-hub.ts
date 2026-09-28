import { vi, type Mock } from 'vitest'
import type { CourseItemsProgress, ItemStatus, TechAccount } from '../lib/api'

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

/**
 * A hub that answers sign-in refresh and one course's progress routes, keeping progress between calls so a
 * Mark complete really changes the next read. `items` holds the statuses; `counted` is what each item counts as.
 */
export function fakeCourseHub(fetchMock: Mock, options: {
  account?: Partial<TechAccount> | null
  courseId?: string
  counted: { id: string, type?: string }[]
  items?: ItemStatus[]
  failComplete?: boolean
}): { calls: () => string[] } {
  const courseId = options.courseId ?? 'gimp'
  const items = new Map((options.items ?? []).map(i => [i.item_id, { ...i }]))
  const done = (id: string) => {
    const s = items.get(id)?.status
    return s === 'done' || (s === 'submitted' && options.counted.find(c => c.id === id)?.type === 'test')
  }
  const progress = (): CourseItemsProgress => {
    const count = options.counted.filter(c => done(c.id)).length
    const next = options.counted.find(c => !['done', 'submitted'].includes(items.get(c.id)?.status ?? ''))
    return {
      course_id: courseId, title: 'GIMP', done: count, total: options.counted.length,
      percent: Math.floor((count * 100) / options.counted.length), next_item: next ? { id: next.id, title: `Title ${next.id}` } : null,
      last_activity_at: null, items: [...items.values()],
    }
  }
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    const path = String(url).replace(/^https?:\/\/[^/]+/, '')
    const method = init?.method ?? 'GET'
    if (path.endsWith('/auth/refresh')) return options.account === null ? json(401, {}) : signedIn(options.account ?? {})
    if (path === `/api/v1/tech/courses/${courseId}/progress`) return json(200, progress())
    const complete = path.match(/^\/api\/v1\/tech\/items\/([^/]+)\/complete$/)
    if (complete) {
      if (options.failComplete) return json(500, { detail: 'down' })
      const id = decodeURIComponent(complete[1])
      const status = method === 'DELETE' ? null : 'done'
      items.set(id, { item_id: id, status, done_at: status && '2026-10-01T15:00:00Z', opened_at: null })
      return json(200, { ...items.get(id), videos: [] })
    }
    return json(404, { detail: 'Not found' })
  })
  return {
    calls: () => fetchMock.mock.calls.map(([url, init]) => `${(init as RequestInit | undefined)?.method ?? 'GET'} ${String(url).replace(/^https?:\/\/[^/]+/, '')}`),
  }
}

/** The JSON bodies sent to paths ending in `path` */
export const sentTo = (fetchMock: Mock, path: string): unknown[] =>
  fetchMock.mock.calls
    .filter(([url]) => String(url).endsWith(path))
    .map(([, init]) => JSON.parse(String((init as RequestInit).body)))
