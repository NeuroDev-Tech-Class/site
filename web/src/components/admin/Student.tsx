import { useState } from 'react'
import {
  approveAccount,
  getAccount,
  getStudentFiles,
  getStudentProgress,
  getStudentWork,
  removeAllFiles,
  removeFile,
  updateAccount,
  type AdminAccount,
} from '../../lib/adminApi'
import { routeHash } from '../../lib/adminRoute'
import { ApiError } from '../../lib/api'
import { sizeWords } from '../../lib/checkpoint'
import { countWords, formatDate, fullName, timeAgo } from '../../lib/format'
import { useLoad } from '../../lib/useLoad'
import { gradeHref } from './Queue'
import { CELL, ConfirmButton, DataTable, ErrorLine, LoadError, Loading, problemWords, showRoute, StatusLine, useAdmin, ViewHeading } from './shared'

const STATUS_WORDS: Record<AdminAccount['status'], string> = {
  pending: 'Waiting for approval', approved: 'Approved', declined: 'Declined', deactivated: 'Deactivated',
}

function Courses({ id }: { id: string }) {
  const { courses } = useAdmin()
  const progress = useLoad(() => getStudentProgress(id), [id])
  const [other, setOther] = useState(courses[0]?.id ?? '')
  return (
    <section aria-labelledby="courses-heading" className="mt-10">
      <h2 id="courses-heading" className="mt-0">Courses</h2>
      {progress.status === 'loading' && <Loading />}
      {progress.status === 'error' && <LoadError onRetry={() => void progress.reload()} />}
      {progress.status === 'ready' && (progress.value.courses.length
        ? (
            <ul aria-label="Courses" className="mt-4 grid list-none grid-cols-1 gap-4 pl-0 sm:grid-cols-2 xl:grid-cols-3">
              {progress.value.courses.map(course => (
                <li key={course.course_id} className="mt-0">
                  <a href={routeHash({ view: 'student-course', id, course: course.course_id })}
                    className="panel flex h-full flex-col gap-1 no-underline hover:border-(--brand-accent)">
                    <span className="font-heading font-semibold text-(--heading)">{course.title}</span>
                    <span className="font-heading text-2xl font-bold text-(--text)">{course.percent}%</span>
                    <span className="text-sm text-(--muted)">
                      {course.done} of {course.total} done
                      {course.last_activity_at && ` · last active ${timeAgo(course.last_activity_at)}`}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )
        : <p>Hasn't started a course yet.</p>)}
      <form className="mt-4 flex flex-wrap items-end gap-3"
        onSubmit={event => { event.preventDefault(); showRoute({ view: 'student-course', id, course: other }) }}>
        <label className="flex max-w-xs flex-1 basis-56 flex-col gap-1 font-semibold">
          Open another course
          <select className="field" value={other} onChange={event => setOther(event.target.value)}>
            {courses.map(course => <option key={course.id} value={course.id}>{course.heading}</option>)}
          </select>
        </label>
        <button type="submit" className="btn-quiet">Open</button>
      </form>
    </section>
  )
}

function Work({ id }: { id: string }) {
  const work = useLoad(() => getStudentWork(id), [id])
  return (
    <section aria-labelledby="work-heading" className="mt-10">
      <h2 id="work-heading" className="mt-0">Work handed in</h2>
      {work.status === 'loading' && <Loading />}
      {work.status === 'error' && <LoadError onRetry={() => void work.reload()} />}
      {work.status === 'ready' && (work.value.length
        ? (
            <DataTable caption="Work handed in" head={['Work', 'Course', 'Attempt', 'Status', 'Handed in']} minWidth="36rem">
              {work.value.map(piece => (
                <tr key={piece.id} className="border-t border-(--border)">
                  <td className={`${CELL} font-semibold`}><a href={gradeHref(piece.id)}>{piece.item.title}</a></td>
                  <td className={CELL}>{piece.course.title}</td>
                  <td className={CELL}>Attempt {piece.attempt}</td>
                  <td className={CELL}>{piece.status_label}</td>
                  <td className={CELL}>{formatDate(piece.submitted_at, { month: 'long' })}</td>
                </tr>
              ))}
            </DataTable>
          )
        : <p>Nothing handed in yet.</p>)}
    </section>
  )
}

function Uploads({ id, name }: { id: string, name: string }) {
  const files = useLoad(() => getStudentFiles(id), [id])
  const [said, setSaid] = useState('')
  const [problem, setProblem] = useState<string | null>(null)

  async function run(action: () => Promise<string>) {
    setProblem(null)
    try {
      setSaid(await action())
      await files.reload()
    } catch (failure) {
      setProblem(problemWords(failure, "Couldn't remove that. Please try again."))
    }
  }

  const kept = files.status === 'ready' ? files.value.filter(file => file.status !== 'removed') : []
  const keptBytes = kept.reduce((sum, file) => sum + file.bytes, 0)
  return (
    <section aria-labelledby="uploads-heading" className="mt-10">
      <h2 id="uploads-heading" className="mt-0">Uploads</h2>
      <StatusLine>{said}</StatusLine>
      <ErrorLine>{problem}</ErrorLine>
      {files.status === 'loading' && <Loading />}
      {files.status === 'error' && <LoadError onRetry={() => void files.reload()} />}
      {files.status === 'ready' && (files.value.length
        ? (
            <>
              <div className="flex flex-wrap items-center gap-4">
                <p className="mt-0">{countWords(kept.length, 'file')} · {sizeWords(keptBytes)}</p>
                {kept.length > 0 && (
                  <ConfirmButton label="Remove all" name={`Remove all of ${name}'s uploads`} confirm="Yes, remove all"
                    onConfirm={() => void run(async () => {
                      const freed = await removeAllFiles(id)
                      return `Removed ${countWords(freed.count, 'file')} (${sizeWords(freed.bytes)}).`
                    })} />
                )}
              </div>
              <DataTable caption="Uploads" head={['File', 'For', 'Size', 'Uploaded', '']} minWidth="36rem">
                {files.value.map(file => (
                  <tr key={file.id} className="border-t border-(--border)">
                    <td className={`${CELL} font-semibold break-all`}>{file.name}</td>
                    <td className={CELL}>{file.item.title} <span className="text-sm text-(--muted)">· {file.course.title}</span></td>
                    <td className={CELL}>{sizeWords(file.bytes)}</td>
                    <td className={CELL}>{formatDate(file.created_at)}</td>
                    <td className={CELL}>
                      {file.status === 'removed'
                        ? <span className="text-(--muted)">Removed</span>
                        : <ConfirmButton label="Remove" name={`Remove ${file.name}`} confirm="Yes, remove"
                            onConfirm={() => void run(async () => {
                              await removeFile(file.id)
                              return `Removed ${file.name}.`
                            })} />}
                    </td>
                  </tr>
                ))}
              </DataTable>
            </>
          )
        : <p>No uploads.</p>)}
    </section>
  )
}

export default function Student({ id }: { id: string }) {
  const { account: me, refreshCounts } = useAdmin()
  const person = useLoad(() => getAccount(id), [id])
  const [problem, setProblem] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function change(action: () => Promise<AdminAccount>) {
    setBusy(true)
    setProblem(null)
    try {
      person.set(await action())
      refreshCounts()
    } catch (failure) {
      setProblem(problemWords(failure, "Couldn't save that. Please try again."))
    } finally {
      setBusy(false)
    }
  }

  if (person.status === 'loading') return <><ViewHeading eyebrow="Students">Student</ViewHeading><Loading /></>
  if (person.status === 'error') {
    const gone = person.failure instanceof ApiError && person.failure.status === 404
    return (
      <>
        <ViewHeading eyebrow="Students">Student</ViewHeading>
        {gone
          ? <div className="panel mt-6"><p className="mt-0">This student isn't there any more.</p><a href="#/students">Back to Students</a></div>
          : <LoadError onRetry={() => void person.reload()} />}
      </>
    )
  }
  const student = person.value
  const name = fullName(student) || student.email
  const otherType = student.student_type === 'current' ? 'old' : 'current'
  return (
    <>
      <ViewHeading eyebrow={<a href="#/students">Students</a>}>{name}</ViewHeading>
      <p className="mt-2 text-(--muted)">
        {student.email} · {STATUS_WORDS[student.status]} · {student.student_type === 'old' ? 'Old' : 'Current'} · joined{' '}
        {formatDate(student.created_at, { month: 'long' })}
        {student.last_login_at && ` · last signed in ${timeAgo(student.last_login_at)}`}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {(student.status === 'pending' || student.status === 'declined') && (
          <button type="button" className="btn-primary" disabled={busy} onClick={() => void change(() => approveAccount(id))}>Approve</button>
        )}
        <button type="button" className="btn-quiet" disabled={busy}
          onClick={() => void change(() => updateAccount(id, { student_type: otherType }))}>
          Move to {otherType === 'old' ? 'Old' : 'Current'}
        </button>
        {student.status === 'approved' && (
          <ConfirmButton label="Deactivate" name={`Deactivate ${name}`} confirm="Yes, deactivate" disabled={busy}
            onConfirm={() => void change(() => updateAccount(id, { status: 'deactivated' }))} />
        )}
        {student.status === 'deactivated' && (
          <button type="button" className="btn-quiet" disabled={busy} onClick={() => void change(() => updateAccount(id, { status: 'approved' }))}>
            Reactivate
          </button>
        )}
      </div>
      <ErrorLine>{problem}</ErrorLine>
      <Courses id={id} />
      <Work id={id} />
      {me.role === 'superadmin' && <Uploads id={id} name={name} />}
    </>
  )
}
