import { useState } from 'react'
import { getQueue, getSubmission, gradeSubmission, type GradeBody, type SubmissionDetail } from '../../lib/adminApi'
import { ApiError } from '../../lib/api'
import { formatDate } from '../../lib/format'
import { useLoad } from '../../lib/useLoad'
import Review from '../test/Review'
import Answers from './Answers'
import OldFormGrade from './OldFormGrade'
import { gradeHref } from './Queue'
import { QuestionBones, Skeleton } from '../Skeleton'
import { ErrorLine, LoadError, problemWords, StatusLine, useAdmin, ViewHeading } from './shared'

const NEEDS_CHANGE = 'Say what to change before sending it back.'
const NEEDS_TICK = 'Tick that you saw this in person before marking it complete.'

// Attempt 0 is a score brought over from the old site's Google Form
const attemptName = (n: number) => (n === 0 ? 'Old site (Google Form)' : `Attempt ${n}`)

type Next = { href: string, left: number } | null

function Outcome({ work }: { work: SubmissionDetail }) {
  if (!work.graded_at || work.status === 'submitted') return <span className="done-chip">{work.status_label}</span>
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="done-chip">{work.status_label}</span>
      <span className="text-sm text-(--muted)">graded by {work.graded_by ?? 'a coach'} on {formatDate(work.graded_at, { month: 'long' })}</span>
    </span>
  )
}

function GradeForm({ work, onGraded }: { work: SubmissionDetail, onGraded: (updated: SubmissionDetail, said: string) => void }) {
  const [feedback, setFeedback] = useState(work.feedback ?? '')
  const [seen, setSeen] = useState(false)
  const [points, setPoints] = useState(work.manual_score?.toString() ?? '')
  const [outOf, setOutOf] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const needsTick = work.checkpoint?.requires_sign_off ?? false
  const firstName = work.student.name.split(' ')[0]

  async function send(body: GradeBody, said: string) {
    setBusy(true)
    setProblem(null)
    try {
      onGraded(await gradeSubmission(work.id, body), said)
    } catch (failure) {
      setProblem(problemWords(failure, "Couldn't save the grade. Please try again."))
    } finally {
      setBusy(false)
    }
  }

  function checkpoint(outcome: 'complete' | 'return') {
    if (outcome === 'return' && !feedback.trim()) return setProblem(NEEDS_CHANGE)
    if (outcome === 'complete' && needsTick && !seen) return setProblem(NEEDS_TICK)
    void send({ outcome, feedback: feedback.trim(), signed_off: seen },
      outcome === 'complete' ? 'Marked complete.' : `Sent back to ${work.student.name}.`)
  }

  function test() {
    const score = Number(points)
    if (points === '' || Number.isNaN(score)) return setProblem('Give a score.')
    const body: GradeBody = { manual_score: score, feedback: feedback.trim() }
    if (work.total_max === null) body.total_max = outOf === '' ? null : Number(outOf)
    void send(body, 'Grade saved.')
  }

  return (
    <form className="panel mt-8 flex flex-col gap-4" onSubmit={event => event.preventDefault()} aria-label="Grade">
      {work.kind === 'test' && (
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 font-semibold">
            Points
            <input type="number" min={0} step="any" className="field w-32" value={points} onChange={e => setPoints(e.target.value)} />
          </label>
          {work.total_max === null
            ? (
                <label className="flex flex-col gap-1 font-semibold">
                  Out of
                  <input type="number" min={1} step="any" className="field w-32" value={outOf} onChange={e => setOutOf(e.target.value)} />
                </label>
              )
            : <p className="mt-0 pb-3">out of {work.total_max}</p>}
        </div>
      )}
      <label className="flex flex-col gap-1 font-semibold">
        Feedback for {firstName}
        <textarea className="field" rows={5} value={feedback} onChange={e => setFeedback(e.target.value)} />
      </label>
      {needsTick && (
        <label className="flex min-h-[44px] cursor-pointer items-center gap-3 font-semibold">
          <input type="checkbox" className="size-5 accent-(--check)" checked={seen} onChange={e => setSeen(e.target.checked)} />
          I saw this in person
        </label>
      )}
      <ErrorLine>{problem}</ErrorLine>
      <div className="flex flex-wrap gap-3">
        {work.kind === 'test'
          ? <button type="button" className="btn-primary" disabled={busy} onClick={test}>Save grade</button>
          : (
              <>
                <button type="button" className="btn-primary" disabled={busy} onClick={() => checkpoint('complete')}>Mark complete</button>
                <button type="button" className="btn-quiet" disabled={busy} onClick={() => checkpoint('return')}>Return for changes</button>
              </>
            )}
      </div>
    </form>
  )
}

/** A test taken on the site: each question with its mark and key, and points for each written answer */
function TestGradeForm({ work, onGraded }: { work: SubmissionDetail, onGraded: (updated: SubmissionDetail, said: string) => void }) {
  const test = work.test!
  const [points, setPoints] = useState<Record<string, string>>(() => Object.fromEntries(
    test.to_grade.map(n => [String(n), test.marks[String(n)]?.points?.toString() ?? '']),
  ))
  const [feedback, setFeedback] = useState(work.feedback ?? '')
  const [problem, setProblem] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const firstName = work.student.name.split(' ')[0]
  const total = (work.auto_score ?? 0) + test.to_grade.reduce((sum, n) => sum + (Number(points[String(n)]) || 0), 0)
  const max = work.total_max ?? 0
  const pct = max ? Math.round((total / max) * 100) : 0

  async function save() {
    const given: Record<string, number> = {}
    for (const n of test.to_grade.map(String)) {
      const raw = points[n]
      if (raw === '' || Number.isNaN(Number(raw))) return setProblem('Give points for every written answer.')
      const top = test.marks[n].max
      if (Number(raw) > top) return setProblem(`Question ${n} is worth ${top} points at most.`)
      given[n] = Number(raw)
    }
    setBusy(true)
    setProblem(null)
    try {
      onGraded(await gradeSubmission(work.id, { points: given, feedback: feedback.trim() }), 'Grade saved.')
    } catch (failure) {
      setProblem(problemWords(failure, "Couldn't save the grade. Please try again."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Review label="Questions and answers" who="Their" questions={test.questions} answers={work.answers as Record<string, unknown>}
        marks={test.marks} keys={test.key} extra={question => test.to_grade.includes(question.number) && (
          <p className="mt-3 flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 font-semibold">
              Points for question {question.number}
              <input type="number" min={0} max={test.marks[String(question.number)]?.max} step="any" className="field w-28"
                value={points[String(question.number)] ?? ''}
                onChange={e => setPoints(p => ({ ...p, [String(question.number)]: e.target.value }))} />
            </label>
            <span className="pb-3">out of {test.marks[String(question.number)]?.max}</span>
          </p>
        )} />
      <form className="panel mt-8 flex flex-col gap-4" onSubmit={event => event.preventDefault()} aria-label="Grade">
        <p className="mt-0 font-semibold">
          {`${total} / ${max} (${pct}%) · ${pct >= test.pass_percent ? 'passes' : `below the ${test.pass_percent}% pass mark`}`}
        </p>
        <label className="flex flex-col gap-1 font-semibold">
          Feedback for {firstName}
          <textarea className="field" rows={5} value={feedback} onChange={e => setFeedback(e.target.value)} />
        </label>
        <ErrorLine>{problem}</ErrorLine>
        <div><button type="button" className="btn-primary" disabled={busy} onClick={() => void save()}>Save grade</button></div>
      </form>
    </>
  )
}

function Beside({ work }: { work: SubmissionDetail }) {
  const hint = work.checkpoint?.grading_hint
  return (
    <aside className="flex flex-col gap-6">
      {hint && (
        <section aria-labelledby="hint-heading" className="panel border-l-4 border-(--callout-note)">
          <h2 id="hint-heading" className="mt-0 text-lg">For you only</h2>
          {hint.answers && <ul className="mt-2 list-disc pl-6">{hint.answers.map(line => <li key={line}>{line}</li>)}</ul>}
          {hint.runner && <p className="mt-2">Checked by its own tests ({hint.runner}).</p>}
        </section>
      )}
      {work.checkpoint && (
        <details className="panel">
          <summary className="cursor-pointer font-semibold">Instructions the student saw</summary>
          <div className="lesson mt-4" dangerouslySetInnerHTML={{ __html: work.checkpoint.instructions_html }} />
        </details>
      )}
      {work.attempts.length > 1 && (
        <section aria-labelledby="attempts-heading">
          <h2 id="attempts-heading" className="mt-0 text-lg">Attempts</h2>
          <ol className="mt-2 flex list-none flex-col gap-3 pl-0">
            {work.attempts.map(attempt => (
              <li key={attempt.id} className="mt-0">
                <a href={gradeHref(attempt.id)} aria-current={attempt.id === work.id ? 'page' : undefined} className="font-semibold">
                  {attemptName(attempt.attempt)}
                </a>
                <span className="text-sm text-(--muted)"> · {attempt.status} · {formatDate(attempt.submitted_at, { month: 'long' })}</span>
                {attempt.feedback && <p className="mt-1 text-sm whitespace-pre-line">{attempt.feedback}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </aside>
  )
}

export default function Grade({ id }: { id: string }) {
  const { refreshCounts } = useAdmin()
  const work = useLoad(() => getSubmission(id), [id])
  const [said, setSaid] = useState('')
  const [next, setNext] = useState<Next | undefined>(undefined)

  async function graded(updated: SubmissionDetail, words: string) {
    work.set(updated)
    setSaid(words)
    refreshCounts()
    try {
      const waiting = (await getQueue()).items.filter(row => row.id !== id)
      setNext(waiting.length ? { href: gradeHref(waiting[0].id), left: waiting.length } : null)
    } catch {
      setNext(null)
    }
  }

  if (work.status === 'loading') return <><ViewHeading>Grading</ViewHeading><Skeleton label="Loading this work"><QuestionBones /></Skeleton></>
  if (work.status === 'error') {
    const gone = work.failure instanceof ApiError && work.failure.status === 404
    return (
      <>
        <ViewHeading>Grading</ViewHeading>
        {gone
          ? <div className="panel mt-6"><p className="mt-0">This work isn't there any more.</p><a href="#/queue">Back to the queue</a></div>
          : <LoadError onRetry={() => void work.reload()} />}
      </>
    )
  }
  const detail = work.value
  return (
    <>
      <ViewHeading eyebrow={`Grading · ${detail.course.title}`}>{detail.item.title}</ViewHeading>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <a href={`#/students/${encodeURIComponent(detail.student.id)}`} className="font-semibold">{detail.student.name}</a>
        <span className="text-(--muted)">{attemptName(detail.attempt)} · handed in {formatDate(detail.submitted_at, { month: 'long' })}</span>
        <Outcome work={detail} />
      </p>
      <StatusLine>{said}</StatusLine>
      {next !== undefined && (
        <p className="mt-0">
          {next
            ? <a className="btn-primary" href={next.href}>Grade next ({next.left} left)</a>
            : <a className="btn-quiet" href="#/queue">Back to the queue</a>}
        </p>
      )}
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <h2 className="mt-0 text-lg">Their answers</h2>
          {detail.test
            ? <TestGradeForm key={detail.status} work={detail} onGraded={(updated, words) => void graded(updated, words)} />
            : detail.old_marks
              ? <OldFormGrade key={detail.status} work={detail} onGraded={(updated, words) => void graded(updated, words)} />
              : (
                <>
                  {detail.legacy && detail.kind === 'test' && (
                    <p className="text-(--muted)">
                      Upload this course's test on the Tests page and its multiple choice and true/false answers are marked for you.
                    </p>
                  )}
                  <Answers form={detail.checkpoint} answers={detail.answers} files={detail.files} />
                  <GradeForm key={detail.status} work={detail} onGraded={(updated, words) => void graded(updated, words)} />
                </>
              )}
        </div>
        <Beside work={detail} />
      </div>
    </>
  )
}
