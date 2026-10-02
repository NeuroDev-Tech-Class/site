import { useState } from 'react'
import {
  certificatePreviewPath,
  createCertificate,
  getCertificates,
  revokeCertificate,
  setCertificateAccess,
  type Certificate,
  type CertificateText,
} from '../../lib/adminApi'
import { routeHash } from '../../lib/adminRoute'
import { fetchFile, openCertificate } from '../../lib/api'
import { calendarDate, formatDate, todayIso } from '../../lib/format'
import { useLoad } from '../../lib/useLoad'
import { FormBones, ListBones, Skeleton } from '../Skeleton'
import { ConfirmButton, ErrorLine, LoadError, problemWords, StatusLine } from './shared'

const printed = (c: CertificateText) => `${c.student_name} · ${c.course_name} · ${calendarDate(c.awarded_on)}`

async function openPdf(path: string) {
  const { blob } = await fetchFile(path)
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener')
  // Long enough for the new tab to load it
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function Live({ cert, firstName, busy, act }: {
  cert: Certificate
  firstName: string
  busy: boolean
  act: (action: () => Promise<unknown>, said: string) => void
}) {
  const given = cert.access_given_at !== null
  return (
    <div className="flex flex-col gap-3">
      <p className="mt-0 font-semibold">{printed(cert)}</p>
      <p className="mt-0 text-sm text-(--muted)">Created {formatDate(cert.created_at)}{cert.created_by ? ` by ${cert.created_by}` : ''}</p>
      <p className="mt-0">{given ? `${firstName} can view it in My Courses.` : `${firstName} can't see it yet.`}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" disabled={busy} onClick={() => act(() => openCertificate(cert.id), '')}>Print</button>
        <button type="button" className="btn-quiet" disabled={busy}
          onClick={() => act(() => setCertificateAccess(cert.id, !given), given ? 'Access taken away.' : 'Access given.')}>
          {given ? 'Take access away' : 'Give access'}
        </button>
        <ConfirmButton label="Revoke" name={`Revoke the ${cert.course_name} certificate`} confirm="Revoke it" disabled={busy}
          onConfirm={() => act(() => revokeCertificate(cert.id), 'Certificate revoked.')} />
      </div>
    </div>
  )
}

function CreateForm({ studentId, courseId, defaults, busy, act }: {
  studentId: string
  courseId: string
  defaults: CertificateText
  busy: boolean
  act: (action: () => Promise<unknown>, said: string) => void
}) {
  const [text, setText] = useState(defaults)
  const [problem, setProblem] = useState<string | null>(null)
  const field = (key: keyof CertificateText) => ({
    value: text[key], onChange: (event: React.ChangeEvent<HTMLInputElement>) => setText({ ...text, [key]: event.target.value }),
  })
  const tidy = (): CertificateText | null => {
    const clean = { student_name: text.student_name.trim(), course_name: text.course_name.trim(), awarded_on: text.awarded_on }
    if (!clean.student_name || !clean.course_name || !clean.awarded_on) {
      setProblem('Fill in the name, the course name and the date.')
      return null
    }
    setProblem(null)
    return clean
  }
  return (
    <form className="flex flex-col gap-3" onSubmit={event => event.preventDefault()}>
      <p className="mt-0 text-sm text-(--muted)">Check what will be printed; change anything that should read differently.</p>
      <label className="flex flex-col gap-1 font-semibold">Name<input className="field" {...field('student_name')} /></label>
      <label className="flex flex-col gap-1 font-semibold">Course name<input className="field" {...field('course_name')} /></label>
      <label className="flex max-w-xs flex-col gap-1 font-semibold">Date<input type="date" className="field" {...field('awarded_on')} /></label>
      <ErrorLine>{problem}</ErrorLine>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-quiet" disabled={busy}
          onClick={() => { const ok = tidy(); if (ok) act(() => openPdf(certificatePreviewPath(studentId, courseId, ok)), '') }}>
          Preview
        </button>
        <button type="button" className="btn-primary" disabled={busy}
          onClick={() => { const ok = tidy(); if (ok) act(() => createCertificate(studentId, courseId, ok), 'Certificate created.') }}>
          Create certificate
        </button>
      </div>
    </form>
  )
}

/** On a student's course: whether they have finished it, and the certificate to create, print, share or revoke */
export function CertificatePanel({ studentId, firstName, fullName, courseId, courseTitle, done, total }: {
  studentId: string
  firstName: string
  fullName: string
  courseId: string
  courseTitle: string
  done: number
  total: number
}) {
  const certificates = useLoad(() => getCertificates(studentId), [studentId])
  const [busy, setBusy] = useState(false)
  const [said, setSaid] = useState('')
  const [problem, setProblem] = useState<string | null>(null)

  async function act(action: () => Promise<unknown>, words: string) {
    setBusy(true)
    setProblem(null)
    setSaid('')
    try {
      await action()
      setSaid(words)
      if (words) await certificates.reload()
    } catch (failure) {
      setProblem(problemWords(failure, "Couldn't do that. Please try again."))
      // A refusal can mean another coach changed it a moment ago
      await certificates.reload()
    } finally {
      setBusy(false)
    }
  }

  const forCourse = certificates.status === 'ready' ? certificates.value.filter(c => c.course.id === courseId) : []
  const live = forCourse.find(c => c.revoked_at === null)
  const revoked = forCourse.filter(c => c.revoked_at !== null)
  return (
    <section aria-label="Certificate" className="panel mt-8 flex flex-col gap-3">
      <h2 className="mt-0 text-xl">Certificate</h2>
      <p className="mt-0 font-semibold">
        {total === 0
          ? 'Not started yet. You can still create one.'
          : done >= total
            ? 'Ready for a certificate: every item is done.'
            : `${done} of ${total} done: not finished yet. You can still create one.`}
      </p>
      {certificates.status === 'loading' && <Skeleton label="Loading the certificate"><FormBones /></Skeleton>}
      {certificates.status === 'error' && <LoadError onRetry={() => void certificates.reload()} />}
      {certificates.status === 'ready' && (live
        ? <Live cert={live} firstName={firstName} busy={busy} act={(a, w) => void act(a, w)} />
        : <CreateForm studentId={studentId} courseId={courseId} busy={busy} act={(a, w) => void act(a, w)}
            defaults={{ student_name: fullName, course_name: courseTitle, awarded_on: todayIso() }} />)}
      <StatusLine>{said}</StatusLine>
      <ErrorLine>{problem}</ErrorLine>
      {revoked.map(c => (
        <p key={c.id} className="mt-0 text-sm text-(--muted)">
          Revoked {formatDate(c.revoked_at)}{c.revoked_by ? ` by ${c.revoked_by}` : ''}: {c.course_name} · {calendarDate(c.awarded_on)}
        </p>
      ))}
    </section>
  )
}

/** On a student's page: every certificate they have had */
export function StudentCertificates({ id, firstName }: { id: string, firstName: string }) {
  const certificates = useLoad(() => getCertificates(id), [id])
  return (
    <section aria-labelledby="certificates-heading" className="mt-10">
      <h2 id="certificates-heading" className="mt-0">Certificates</h2>
      {certificates.status === 'loading' && <Skeleton label="Loading certificates"><ListBones count={2} /></Skeleton>}
      {certificates.status === 'error' && <LoadError onRetry={() => void certificates.reload()} />}
      {certificates.status === 'ready' && (certificates.value.length
        ? (
            <ul aria-label="Certificates" className="mt-4 flex list-none flex-col gap-3 pl-0">
              {certificates.value.map(c => (
                <li key={c.id} className="panel mt-0 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <a href={routeHash({ view: 'student-course', id, course: c.course.id })} className="font-semibold">{c.course_name}</a>
                  <span className="text-sm text-(--muted)">{calendarDate(c.awarded_on)}</span>
                  <span className="text-sm">
                    {c.revoked_at ? `Revoked ${formatDate(c.revoked_at)}` : c.access_given_at ? `${firstName} can view it` : 'Not shared yet'}
                  </span>
                </li>
              ))}
            </ul>
          )
        : <p>No certificates yet. Open a course to create one.</p>)}
    </section>
  )
}
