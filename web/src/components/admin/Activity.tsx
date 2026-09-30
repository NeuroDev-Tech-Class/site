import { useState } from 'react'
import { activityCsvPath, getActivity, getStudents, type ActivityFilter, type ActivityLine } from '../../lib/adminApi'
import type { AdminRoute } from '../../lib/adminRoute'
import { ApiError, fetchFile } from '../../lib/api'
import { formatDate, timeAgo } from '../../lib/format'
import { useLoad } from '../../lib/useLoad'
import { LoadError, Loading, REFRESH_MS, showRoute, useAdmin, ViewHeading } from './shared'

type ActivityRoute = Extract<AdminRoute, { view: 'activity' }>

// The hub's activity types (app/tech/notify.py TYPE_LABELS), in the order a coach thinks of them
const TYPES: [string, string][] = [
  ['submission_received', 'Work submitted'],
  ['submission_graded', 'Work graded'],
  ['submission_returned', 'Work returned'],
  ['new_registration', 'New registration'],
  ['account_approved', 'Account approved'],
  ['certificate_awarded', 'Certificate awarded'],
  ['files_removed', 'Files removed'],
]

/** The hub links into the dashboard as /admin#/...; inside it, only the hash needs to change */
const inDashboard = (link: string) => (link.startsWith('/admin#') ? link.slice('/admin'.length) : link)

async function downloadCsv(filter: ActivityFilter) {
  const { blob, name } = await fetchFile(activityCsvPath(filter))
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name ?? 'activity.csv'
  link.click()
  URL.revokeObjectURL(url)
}

/** The first page refreshes on its own; older pages, once asked for, stay below it */
function Lines({ filter, filtered }: { filter: ActivityFilter, filtered: boolean }) {
  const first = useLoad(() => getActivity(filter), [filter.type, filter.student, filter.course], { every: REFRESH_MS })
  const [older, setOlder] = useState<{ items: ActivityLine[], next: string | null } | null>(null)
  const [busy, setBusy] = useState(false)

  if (first.status === 'loading') return <Loading />
  if (first.status === 'error') return <LoadError />
  const seen = new Set<string>()
  const lines = [...first.value.items, ...(older?.items ?? [])].filter(line => !seen.has(line.id) && seen.add(line.id))
  const next = older ? older.next : first.value.next

  async function showOlder() {
    if (!next) return
    setBusy(true)
    try {
      const page = await getActivity(filter, next)
      setOlder(was => ({ items: [...(was?.items ?? []), ...page.items], next: page.next }))
    } finally {
      setBusy(false)
    }
  }

  if (!lines.length) return <p className="mt-6">{filtered ? 'Nothing matches these filters.' : 'Nothing has happened yet.'}</p>
  return (
    <>
      <ul aria-label="Activity" className="mt-6 flex list-none flex-col pl-0">
        {lines.map(line => (
          <li key={line.id} className="mt-0 flex flex-col gap-1 border-t border-(--border) py-3 sm:flex-row sm:items-baseline sm:gap-4">
            <time dateTime={line.created_at} title={formatDate(line.created_at, { month: 'long' })}
              className="w-32 shrink-0 text-sm text-(--muted)">
              {timeAgo(line.created_at)}
            </time>
            <span className="w-40 shrink-0 text-sm font-semibold text-(--item-label)">{line.type_label}</span>
            <a href={inDashboard(line.link)} className="min-w-0">{line.summary}</a>
          </li>
        ))}
      </ul>
      {next && (
        <button type="button" className="btn-quiet mt-4" disabled={busy} onClick={() => void showOlder()}>
          {busy ? 'Loading…' : 'Show older'}
        </button>
      )}
    </>
  )
}

export default function Activity({ route }: { route: ActivityRoute }) {
  const { courses } = useAdmin()
  const students = useLoad(getStudents, [])
  const [problem, setProblem] = useState<string | null>(null)
  const filter: ActivityFilter = { type: route.type, student: route.student, course: route.course }
  const choose = (key: keyof ActivityFilter) => (value: string) =>
    showRoute({ ...route, [key]: value || undefined }, { replace: true })

  async function csv() {
    setProblem(null)
    try {
      await downloadCsv(filter)
    } catch (failure) {
      setProblem(failure instanceof ApiError ? failure.message : "Couldn't download the CSV. Please try again.")
    }
  }

  const select = (label: string, key: keyof ActivityFilter, options: [string, string][], all: string) => (
    <label className="flex max-w-xs flex-1 basis-44 flex-col gap-1 font-semibold">
      {label}
      <select className="field" value={filter[key] ?? ''} onChange={event => choose(key)(event.target.value)}>
        <option value="">{all}</option>
        {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </label>
  )

  return (
    <>
      <ViewHeading>Activity</ViewHeading>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        {select('Type', 'type', TYPES, 'Everything')}
        {select('Student', 'student', students.status === 'ready' ? students.value.map(s => [s.id, s.name]) : [], 'Every student')}
        {select('Course', 'course', courses.map(c => [c.id, c.heading]), 'Every course')}
        <button type="button" className="btn-quiet" onClick={() => void csv()}>Download CSV</button>
      </div>
      {problem && <p role="alert" className="mt-2 font-semibold text-red-700 dark:text-red-300">{problem}</p>}
      <Lines key={`${route.type}|${route.student}|${route.course}`} filter={filter}
        filtered={Boolean(route.type || route.student || route.course)} />
    </>
  )
}
