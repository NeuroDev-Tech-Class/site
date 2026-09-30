import { useEffect, useState } from 'react'
import { getQueue } from '../../lib/adminApi'
import type { AdminRoute } from '../../lib/adminRoute'
import { useLoad } from '../../lib/useLoad'
import { LoadError, Loading, REFRESH_MS, showRoute, useAdmin, ViewHeading, waitedWords } from './shared'

// How long typing in the search box has to pause before the queue is asked again
const SEARCH_PAUSE_MS = 400

type QueueRoute = Extract<AdminRoute, { view: 'queue' }>

export const gradeHref = (id: string) => `#/grade/${encodeURIComponent(id)}`

export default function Queue({ route }: { route: QueueRoute }) {
  const { courses } = useAdmin()
  const [search, setSearch] = useState(route.q ?? '')
  const data = useLoad(() => getQueue({ course: route.course, q: route.q }), [route.course, route.q], { every: REFRESH_MS })

  useEffect(() => {
    const wanted = search.trim() || undefined
    if (wanted === route.q) return
    const timer = setTimeout(() => showRoute({ ...route, q: wanted }, { replace: true }), SEARCH_PAUSE_MS)
    return () => clearTimeout(timer)
  }, [search, route])

  const filtered = Boolean(route.course || route.q)
  let body
  if (data.status === 'loading') body = <Loading />
  else if (data.status === 'error') body = <LoadError />
  else if (!data.value.items.length) {
    body = <p className="mt-6">{filtered ? 'Nothing waiting matches these filters.' : 'Nothing is waiting. Nice work.'}</p>
  } else {
    const { items, total } = data.value
    body = (
      <>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <a className="btn-primary" href={gradeHref(items[0].id)}>Grade next</a>
          {total > items.length && <p className="mt-0 text-(--muted)">Showing the oldest {items.length} of {total}.</p>}
        </div>
        <div className="mt-4 overflow-x-auto rounded-lg border border-(--border)">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <caption className="sr-only">Work waiting for grading</caption>
            <thead className="bg-(--panel) text-sm text-(--muted)">
              <tr>
                <th scope="col" className="px-4 py-3">Work</th>
                <th scope="col" className="px-4 py-3">Student</th>
                <th scope="col" className="px-4 py-3">Course</th>
                <th scope="col" className="px-4 py-3">Type</th>
                <th scope="col" className="px-4 py-3">Attempt</th>
                <th scope="col" className="px-4 py-3">Waiting</th>
              </tr>
            </thead>
            <tbody>
              {items.map(row => (
                <tr key={row.id} className="border-t border-(--border)">
                  <td className="px-4 py-3 font-semibold"><a href={gradeHref(row.id)}>{row.item.title}</a></td>
                  <td className="px-4 py-3">{row.student.name}</td>
                  <td className="px-4 py-3">{row.course.title}</td>
                  <td className="px-4 py-3">{row.kind === 'test' ? 'Test' : 'Checkpoint'}</td>
                  <td className="px-4 py-3">Attempt {row.attempt}</td>
                  <td className="px-4 py-3">{waitedWords(row.submitted_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  return (
    <>
      <ViewHeading>Grading Queue</ViewHeading>
      <div className="mt-4 flex flex-wrap gap-4">
        <label className="flex max-w-xs flex-1 basis-48 flex-col gap-1 font-semibold">
          Course
          <select className="field" value={route.course ?? ''}
            onChange={event => showRoute({ ...route, course: event.target.value || undefined }, { replace: true })}>
            <option value="">All courses</option>
            {courses.map(course => <option key={course.id} value={course.id}>{course.heading}</option>)}
          </select>
        </label>
        <label className="flex max-w-xs flex-1 basis-48 flex-col gap-1 font-semibold">
          Student
          <input type="search" className="field" value={search} placeholder="Name or email"
            onChange={event => setSearch(event.target.value)} />
        </label>
      </div>
      {body}
    </>
  )
}
