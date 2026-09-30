import { useCallback } from 'react'
import { getQueue } from '../../lib/adminApi'
import type { AdminRoute } from '../../lib/adminRoute'
import { useLoad } from '../../lib/useLoad'
import { CELL, DataTable, LoadError, Loading, REFRESH_MS, SearchField, showRoute, useAdmin, ViewHeading, waitedWords } from './shared'

type QueueRoute = Extract<AdminRoute, { view: 'queue' }>

export const gradeHref = (id: string) => `#/grade/${encodeURIComponent(id)}`

export default function Queue({ route }: { route: QueueRoute }) {
  const { courses } = useAdmin()
  const data = useLoad(() => getQueue({ course: route.course, q: route.q }), [route.course, route.q], { every: REFRESH_MS })
  const search = useCallback((q: string | undefined) => showRoute({ ...route, q }, { replace: true }), [route])

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
        <DataTable caption="Work waiting for grading" head={['Work', 'Student', 'Course', 'Type', 'Attempt', 'Waiting']}>
          {items.map(row => (
            <tr key={row.id} className="border-t border-(--border)">
              <td className="px-4 py-3 font-semibold"><a href={gradeHref(row.id)}>{row.item.title}</a></td>
              <td className={CELL}>{row.student.name}</td>
              <td className={CELL}>{row.course.title}</td>
              <td className={CELL}>{row.kind === 'test' ? 'Test' : 'Checkpoint'}</td>
              <td className={CELL}>Attempt {row.attempt}</td>
              <td className={CELL}>{waitedWords(row.submitted_at)}</td>
            </tr>
          ))}
        </DataTable>
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
        <SearchField label="Student" applied={route.q} onApply={search} placeholder="Name or email" />
      </div>
      {body}
    </>
  )
}
