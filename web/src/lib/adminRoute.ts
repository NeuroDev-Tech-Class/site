// The dashboard's addresses: one page, /admin, with the view in the hash so the hub's notification links
// (/admin#/grade/{id}, /admin#/students/{id}, /admin#/accounts?status=pending) open the right place.
export type StudentsTab = 'pending' | 'current' | 'old' | 'admins'

export type AdminRoute =
  | { view: 'today' }
  | { view: 'queue', course?: string, q?: string }
  | { view: 'grade', id: string }
  | { view: 'students', tab: StudentsTab, q?: string }
  | { view: 'student', id: string }
  | { view: 'student-course', id: string, course: string }
  | { view: 'activity', type?: string, student?: string, course?: string }
  | { view: 'storage' }
  | { view: 'tests' }
  | { view: 'test', id: string }

const TABS: StudentsTab[] = ['pending', 'current', 'old', 'admins']
const TODAY = { route: { view: 'today' } as AdminRoute, redirect: '#/today' }

/** Only the filters that are set, so a route compares equal however it was reached */
function filters<K extends string>(params: URLSearchParams, keys: K[]): Partial<Record<K, string>> {
  const set: Partial<Record<K, string>> = {}
  for (const key of keys) {
    const value = params.get(key)
    if (value) set[key] = value
  }
  return set
}

export function parseRoute(hash: string): { route: AdminRoute, redirect?: string } {
  const [path, search = ''] = hash.replace(/^#/, '').split('?')
  const params = new URLSearchParams(search)
  let parts: string[]
  try {
    parts = path.split('/').filter(Boolean).map(decodeURIComponent)
  } catch {
    // A mangled link (a stray %) goes to Today rather than breaking the page
    return TODAY
  }
  const [view, id, sub, course] = parts

  if (view === 'today' && parts.length === 1) return { route: { view: 'today' } }
  if (view === 'queue' && parts.length === 1) return { route: { view: 'queue', ...filters(params, ['course', 'q']) } }
  if (view === 'grade' && parts.length === 2) return { route: { view: 'grade', id } }
  if (view === 'storage' && parts.length === 1) return { route: { view: 'storage' } }
  if (view === 'tests' && parts.length === 1) return { route: { view: 'tests' } }
  if (view === 'tests' && parts.length === 2) return { route: { view: 'test', id } }
  if (view === 'activity' && parts.length === 1) {
    return { route: { view: 'activity', ...filters(params, ['type', 'student', 'course']) } }
  }
  if (view === 'students') {
    if (parts.length === 1) {
      const tab = TABS.find(t => t === params.get('tab')) ?? 'current'
      return { route: { view: 'students', tab, ...filters(params, ['q']) } }
    }
    if (parts.length === 2) return { route: { view: 'student', id } }
    if (parts.length === 4 && sub === 'courses') return { route: { view: 'student-course', id, course } }
  }
  if (view === 'accounts' && parts.length === 1) {
    return { route: { view: 'students', tab: 'pending' }, redirect: '#/students?tab=pending' }
  }
  return TODAY
}

const withQuery = (path: string, params: Record<string, string | undefined>) => {
  const kept = Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1]))
  return kept.length ? `${path}?${new URLSearchParams(kept)}` : path
}

export function routeHash(route: AdminRoute): string {
  const e = encodeURIComponent
  switch (route.view) {
    case 'today': return '#/today'
    case 'queue': return withQuery('#/queue', { course: route.course, q: route.q })
    case 'grade': return `#/grade/${e(route.id)}`
    case 'students': return withQuery('#/students', { tab: route.tab === 'current' ? undefined : route.tab, q: route.q })
    case 'student': return `#/students/${e(route.id)}`
    case 'student-course': return `#/students/${e(route.id)}/courses/${e(route.course)}`
    case 'activity': return withQuery('#/activity', { type: route.type, student: route.student, course: route.course })
    case 'storage': return '#/storage'
    case 'tests': return '#/tests'
    case 'test': return `#/tests/${e(route.id)}`
  }
}
