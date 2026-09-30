import { vi, type Mock } from 'vitest'
import type { CourseItemsProgress, ItemStatus, Submission, TechAccount } from '../lib/api'

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

const pathOf = (url: unknown) => String(url).replace(/^https?:\/\/[^/]+/, '')

export type Route = (request: { method: string, body: unknown, match: RegExpMatchArray }) => Response | Promise<Response>

/**
 * A hub that answers the sign-in refresh as `account` (null: signed out), then the first route whose pattern (a
 * regular expression for the whole path) matches; anything else is a 404.
 */
export function fakeHub(fetchMock: Mock, account: Partial<TechAccount> | null, routes: Record<string, Route>): void {
  const table = Object.entries(routes).map(([pattern, route]) => [new RegExp(`^${pattern}$`), route] as const)
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    const path = pathOf(url)
    if (path.endsWith('/auth/refresh')) return account === null ? json(401, {}) : signedIn(account)
    const request = { method: init?.method ?? 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined }
    for (const [pattern, route] of table) {
      const match = path.match(pattern)
      if (match) return route({ ...request, match })
    }
    return json(404, { detail: 'Not found' })
  })
}

/** Every request made, as "METHOD /path" */
export const requests = (fetchMock: Mock): string[] =>
  fetchMock.mock.calls.map(([url, init]) => `${(init as RequestInit | undefined)?.method ?? 'GET'} ${pathOf(url)}`)

/**
 * One course's progress routes, keeping progress between calls so a Mark complete really changes the next read.
 * `items` holds the statuses; `counted` is what each item counts as.
 */
export function fakeCourseHub(fetchMock: Mock, options: {
  account?: Partial<TechAccount> | null
  courseId?: string
  counted: { id: string, type?: string }[]
  items?: ItemStatus[]
  failComplete?: boolean
  // Each item's attempts, newest first, as /submissions/mine?item_id= answers them
  work?: Record<string, Submission[]>
}): { calls: () => string[] } {
  const courseId = options.courseId ?? 'gimp'
  const items = new Map((options.items ?? []).map(i => [i.item_id, { ...i }]))
  const done = (id: string) => {
    const s = items.get(id)?.status
    return s === 'done'
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
  fakeHub(fetchMock, options.account === undefined ? {} : options.account, {
    [`/api/v1/tech/courses/${courseId}/progress`]: () => json(200, progress()),
    '/api/v1/tech/items/([^/]+)/complete': ({ method, match }) => {
      if (options.failComplete) return json(500, { detail: 'down' })
      const id = decodeURIComponent(match[1])
      const status = method === 'DELETE' ? null : 'done'
      items.set(id, { item_id: id, status, done_at: status && '2026-10-01T15:00:00Z', opened_at: null })
      return json(200, { ...items.get(id), videos: [] })
    },
    '/api/v1/tech/submissions/mine\\?item_id=([^&]+)': ({ match }) =>
      json(200, options.work?.[decodeURIComponent(match[1])] ?? []),
  })
  return { calls: () => requests(fetchMock) }
}

/** One handed-in piece of work, as the hub's SubmissionOut */
export const submission = (overrides: Partial<Submission> = {}): Submission => ({
  id: 'a1__i_c__1', kind: 'checkpoint', attempt: 1, status: 'submitted', status_label: 'Waiting for grading',
  score_label: 'Not graded', item: { id: 'i_c', title: 'Final Project' }, course: { id: 'gimp', title: 'GIMP' },
  answers: {}, feedback: null, auto_score: null, manual_score: null, total_score: null, total_max: null, passed: null,
  submitted_at: '2026-10-02T15:00:00Z', graded_at: null, files: [], sign_off: null, ...overrides,
})

/** The JSON bodies sent to paths ending in `path` */
export const sentTo = (fetchMock: Mock, path: string): unknown[] =>
  fetchMock.mock.calls
    .filter(([url]) => String(url).endsWith(path))
    .map(([, init]) => JSON.parse(String((init as RequestInit).body)))
