import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { getPendingBadge, getQueueCount } from '../../lib/adminApi'
import { parseRoute, type AdminRoute } from '../../lib/adminRoute'
import type { TechAccount } from '../../lib/api'
import type { CourseMeta } from '../../lib/content'
import { isStaff } from '../../lib/format'
import type { IconName } from '../../lib/icons'
import { useSession } from '../../lib/session'
import { useLoad } from '../../lib/useLoad'
import Icon from '../Icon'
import Activity from './Activity'
import { ShellBones, Skeleton } from '../Skeleton'
import { AdminContext, HEADING_ID, REFRESH_MS, ROUTE_EVENT, ViewHeading } from './shared'
import Grade from './Grade'
import Queue from './Queue'
import Student from './Student'
import StudentCourse from './StudentCourse'
import Storage from './Storage'
import Students from './Students'
import Tests, { TestPreview } from './Tests'
import Today from './Today'

type Section = 'today' | 'queue' | 'students' | 'tests' | 'activity' | 'storage'

interface NavItem {
  section: Section
  href: string
  label: string
  icon: IconName
  superadmin?: boolean
}

const NAV: NavItem[] = [
  { section: 'today', href: '#/today', label: 'Today', icon: 'today' },
  { section: 'queue', href: '#/queue', label: 'Grading Queue', icon: 'inbox' },
  { section: 'students', href: '#/students', label: 'Students', icon: 'users' },
  { section: 'tests', href: '#/tests', label: 'Tests', icon: 'test' },
  { section: 'activity', href: '#/activity', label: 'Activity', icon: 'activity' },
  { section: 'storage', href: '#/storage', label: 'Storage', icon: 'database', superadmin: true },
]

const SECTION_OF: Record<AdminRoute['view'], Section> = {
  today: 'today', queue: 'queue', grade: 'queue', students: 'students', student: 'students',
  'student-course': 'students', activity: 'activity', storage: 'storage', tests: 'tests', test: 'tests',
}

// Astro's page router moves the address with pushState and a popstate of its own, never a hashchange
const ADDRESS_EVENTS = ['hashchange', 'popstate', ROUTE_EVENT]

function subscribeHash(listener: () => void) {
  ADDRESS_EVENTS.forEach(name => window.addEventListener(name, listener))
  return () => ADDRESS_EVENTS.forEach(name => window.removeEventListener(name, listener))
}

function useHash(): string {
  return useSyncExternalStore(subscribeHash, () => window.location.hash, () => '')
}

function View({ route }: { route: AdminRoute }) {
  switch (route.view) {
    case 'queue':
      return <Queue route={route} />
    case 'grade':
      return <Grade key={route.id} id={route.id} />
    case 'students':
      return <Students route={route} />
    case 'student':
      return <Student key={route.id} id={route.id} />
    case 'activity':
      return <Activity route={route} />
    case 'storage':
      return <Storage />
    case 'tests':
      return <Tests />
    case 'test':
      return <TestPreview key={route.id} id={route.id} />
    case 'student-course':
      return <StudentCourse key={`${route.id}/${route.course}`} id={route.id} course={route.course} />
    default:
      return <Today />
  }
}

/** Where the coach is, leaving out filters: focus moves only when this changes, never while typing a filter */
function place(route: AdminRoute): string {
  if (route.view === 'grade' || route.view === 'student' || route.view === 'test') return `${route.view}/${route.id}`
  if (route.view === 'student-course') return `${route.view}/${route.id}/${route.course}`
  return route.view
}

function Badge({ count, words }: { count: number, words: string }) {
  if (!count) return null
  return (
    <>
      <span className="sr-only">, {count} {words}</span>
      <span aria-hidden="true" className="ml-auto rounded-full bg-(--primary-bg) px-2 text-sm font-bold text-(--primary-text)">
        {count}
      </span>
    </>
  )
}

function Dashboard({ account, courses }: { account: TechAccount, courses: CourseMeta[] }) {
  const hash = useHash()
  const { route, redirect } = useMemo(() => parseRoute(hash), [hash])
  const counts = useLoad(async () => {
    const [queue, badge] = await Promise.all([getQueueCount(), getPendingBadge()])
    return { queue: queue.count, pending: badge.pending }
  }, [], { every: REFRESH_MS })
  const firstView = useRef(true)

  useEffect(() => {
    if (redirect) history.replaceState(history.state, '', redirect)
  }, [redirect])

  // A new view takes focus at its heading, so a screen reader hears where it is; not on first arrival
  const here = place(route)
  useEffect(() => {
    if (firstView.current) {
      firstView.current = false
      return
    }
    document.getElementById(HEADING_ID)?.focus()
  }, [here])

  const section = SECTION_OF[route.view]
  const waiting = counts.status === 'ready' ? counts.value : { queue: 0, pending: 0 }
  const reloadCounts = counts.reload
  const admin = useMemo(() => ({ account, courses, refreshCounts: () => void reloadCounts() }), [account, courses, reloadCounts])

  return (
    <AdminContext.Provider value={admin}>
      <div className="min-[900px]:grid min-[900px]:grid-cols-[13rem_minmax(0,1fr)] min-[900px]:gap-10">
        <nav aria-label="Dashboard" className="-mx-4 mb-8 overflow-x-auto border-b border-(--border) px-4 min-[900px]:mx-0 min-[900px]:mb-0 min-[900px]:border-b-0 min-[900px]:px-0">
          <ul className="flex list-none gap-1 pl-0 min-[900px]:sticky min-[900px]:top-4 min-[900px]:flex-col">
            {NAV.filter(item => !item.superadmin || account.role === 'superadmin').map(item => (
              <li key={item.section} className="mt-0">
                <a
                  href={item.href}
                  aria-current={item.section === section ? 'page' : undefined}
                  className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 font-semibold whitespace-nowrap text-(--text) no-underline hover:bg-(--panel) aria-[current=page]:bg-(--panel) aria-[current=page]:text-(--heading)"
                >
                  <Icon name={item.icon} size={18} />
                  <span>{item.label}</span>
                  {item.section === 'queue' && <Badge count={waiting.queue} words="waiting" />}
                  {item.section === 'students' && <Badge count={waiting.pending} words="to approve" />}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0">
          <View route={route} />
        </div>
      </div>
    </AdminContext.Provider>
  )
}

export default function AdminApp({ courses }: { courses: CourseMeta[] }) {
  const session = useSession()
  if (session.status === 'signed-in' && session.account.status === 'approved' && isStaff(session.account)) {
    return <Dashboard account={session.account} courses={courses} />
  }
  return (
    <>
      <ViewHeading>Dashboard</ViewHeading>
      {session.status === 'loading' && <Skeleton label="Loading the dashboard" className="mt-6"><ShellBones /></Skeleton>}
      {session.status === 'signed-out' && (
        <div className="panel mt-6">
          <p className="mt-0">Sign in with a coach account to open the dashboard.</p>
          <a className="btn-primary mt-4" href={`/sign-in?next=${encodeURIComponent('/admin')}`}>Sign in</a>
        </div>
      )}
      {session.status === 'signed-in' && (
        <div className="panel mt-6">
          <p className="mt-0">The dashboard is for coaches.</p>
          <a className="mt-4 inline-block" href="/my-courses">Go to My Courses</a>
        </div>
      )}
    </>
  )
}
