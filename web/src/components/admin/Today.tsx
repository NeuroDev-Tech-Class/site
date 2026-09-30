import { useState } from 'react'
import { approveAccount, getQueue, getStudents, type StudentRow } from '../../lib/adminApi'
import { formatDate } from '../../lib/format'
import { useLoad } from '../../lib/useLoad'
import { LoadError, Loading, problemWords, REFRESH_MS, StatusLine, useAdmin, ViewHeading, waitedWords, waitingOnCoach, withinDays } from './shared'

const ATTENTION_WORK = 5

function Tile({ href, label, value }: { href: string, label: string, value: number }) {
  return (
    <li className="mt-0">
      <a href={href} className="panel flex h-full flex-col gap-1 no-underline hover:border-(--brand-accent)">
        <span className="font-heading text-3xl font-bold text-(--heading)">{value}</span>
        <span className="text-(--text)">{label}</span>
      </a>
    </li>
  )
}

export default function Today() {
  const { refreshCounts } = useAdmin()
  const data = useLoad(async () => {
    const [students, queue] = await Promise.all([getStudents(), getQueue()])
    return { students, queue }
  }, [], { every: REFRESH_MS })
  const [busy, setBusy] = useState<string | null>(null)
  const [said, setSaid] = useState('')

  async function approve(student: StudentRow) {
    setBusy(student.id)
    setSaid('')
    try {
      await approveAccount(student.id)
      setSaid(`${student.name} approved.`)
      refreshCounts()
      await data.reload()
    } catch (failure) {
      setSaid(problemWords(failure, `Couldn't approve ${student.name}. Please try again.`))
    } finally {
      setBusy(null)
    }
  }

  let body
  if (data.status === 'loading') body = <Loading />
  else if (data.status === 'error') body = <LoadError />
  else {
    const { students, queue } = data.value
    const pending = students.filter(waitingOnCoach)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
    const work = queue.items.slice(0, ATTENTION_WORK)
    body = (
      <>
        <ul aria-label="At a glance" className="mt-6 grid list-none grid-cols-1 gap-4 pl-0 sm:grid-cols-3">
          <Tile href="#/queue" label="Awaiting grading" value={queue.total} />
          <Tile href="#/students?tab=pending" label="Pending sign-ups" value={pending.length} />
          <Tile href="#/students" label="Active this week"
            value={students.filter(s => s.status === 'approved' && withinDays(s.last_activity_at, 7)).length} />
        </ul>
        <h2 className="mt-10">Needs your attention</h2>
        {pending.length + work.length === 0
          ? <p>Nothing needs you right now.</p>
          : (
              <ul aria-label="Needs your attention" className="mt-4 flex list-none flex-col gap-3 pl-0">
                {pending.map(student => (
                  <li key={student.id} className="panel mt-0 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="min-w-0 flex-1">
                      <p className="mt-0 font-semibold">{student.name}</p>
                      <p className="mt-0 text-sm text-(--muted)">
                        {student.email} · signed up {formatDate(student.created_at, { month: 'long' })}
                      </p>
                    </div>
                    <button type="button" className="btn-primary" disabled={busy !== null} aria-label={`Approve ${student.name}`}
                      onClick={() => void approve(student)}>
                      {busy === student.id ? 'Approving…' : 'Approve'}
                    </button>
                  </li>
                ))}
                {work.map(row => (
                  <li key={row.id} className="panel mt-0 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="min-w-0 flex-1">
                      <p className="mt-0 font-semibold">{row.item.title}</p>
                      <p className="mt-0 text-sm text-(--muted)">
                        {row.student.name} · {row.course.title} · waiting {waitedWords(row.submitted_at)}
                      </p>
                    </div>
                    <a className="btn-quiet" href={`#/grade/${encodeURIComponent(row.id)}`}
                      aria-label={`Grade ${row.item.title} by ${row.student.name}`}>
                      Grade
                    </a>
                  </li>
                ))}
              </ul>
            )}
      </>
    )
  }

  return (
    <>
      <ViewHeading>Today</ViewHeading>
      <StatusLine>{said}</StatusLine>
      {body}
    </>
  )
}
