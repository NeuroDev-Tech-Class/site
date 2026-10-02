import { useState } from 'react'
import { gradeSubmission, type OldMark, type SubmissionDetail } from '../../lib/adminApi'
import { countWords } from '../../lib/format'
import AnswerBox from '../AnswerBox'
import { ErrorLine, problemWords } from './shared'

// The pass mark old Form scores were always held to (the hub's PASS_THRESHOLD)
const PASS_PERCENT = 70

const MARKED: Record<OldMark['status'], { words: string, className: string }> = {
  right: { words: 'Right', className: 'done-chip' },
  wrong: { words: 'Wrong', className: 'text-sm font-semibold text-(--muted)' },
  coach: { words: 'Yours to score', className: 'rounded-full border-[1.5px] border-(--primary-bg) px-3 py-1 text-sm font-semibold' },
  not_on_test: { words: 'Not on the current test', className: 'text-sm font-semibold text-(--muted)' },
}

/** An old Google Form score marked against the test uploaded since: each answer under its question, the marked ones
 * right or wrong with their points, and points for the coach to give the rest */
export default function OldFormGrade({ work, onGraded }: { work: SubmissionDetail, onGraded: (updated: SubmissionDetail, said: string) => void }) {
  const marks = work.old_marks!
  const yours = marks.rows.filter(row => row.status === 'coach')
  const [points, setPoints] = useState<Record<number, string>>({})
  const [feedback, setFeedback] = useState(work.feedback ?? '')
  const [problem, setProblem] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const firstName = work.student.name.split(' ')[0]
  const total = marks.auto_points + yours.reduce((sum, row) => sum + (Number(points[row.number!]) || 0), 0)
  const pct = marks.out_of ? Math.round((total / marks.out_of) * 100) : 0

  async function save() {
    for (const row of yours) {
      const raw = points[row.number!] ?? ''
      if (raw === '' || Number.isNaN(Number(raw))) return setProblem("Give points for every answer that's yours to score.")
      if (Number(raw) > row.max!) return setProblem(`Question ${row.number} is worth ${row.max} points at most.`)
    }
    setBusy(true)
    setProblem(null)
    try {
      onGraded(await gradeSubmission(work.id, { manual_score: total, total_max: marks.out_of, feedback: feedback.trim() }), 'Grade saved.')
    } catch (failure) {
      setProblem(problemWords(failure, "Couldn't save the grade. Please try again."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <ol aria-label="Old Form answers" className="mt-4 flex list-none flex-col gap-4 pl-0">
        {marks.rows.map((row, index) => (
          <li key={index} className="panel mt-0">
            <p className="mt-0 flex flex-wrap items-center gap-3 font-heading font-bold">
              {row.number === null ? 'From the old Form' : `Question ${row.number}`}
              <span className={MARKED[row.status].className}>{MARKED[row.status].words}</span>
            </p>
            <p className="mt-1">{row.question}</p>
            <AnswerBox><p className="mt-1 whitespace-pre-wrap">{row.answer}</p></AnswerBox>
            {row.right_answer && row.status !== 'right' && <p className="mt-2 font-semibold">Right answer: {row.right_answer}</p>}
            {row.points !== null && <p className="mt-1 text-sm text-(--muted)">{row.points} of {countWords(row.max!, 'point')}</p>}
            {row.rubric && <p className="mt-2 text-sm"><span className="font-semibold">Rubric: </span>{row.rubric}</p>}
            {row.status === 'coach' && (
              <p className="mt-3 flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-1 font-semibold">
                  Points for question {row.number}
                  <input type="number" min={0} max={row.max!} step="any" className="field w-28" value={points[row.number!] ?? ''}
                    onChange={e => setPoints(given => ({ ...given, [row.number!]: e.target.value }))} />
                </label>
                <span className="pb-3">out of {row.max}</span>
              </p>
            )}
          </li>
        ))}
      </ol>
      <form className="panel mt-8 flex flex-col gap-4" onSubmit={event => event.preventDefault()} aria-label="Grade">
        <p className="mt-0 font-semibold">
          {`${total} / ${marks.out_of} (${pct}%) · ${pct >= PASS_PERCENT ? 'passes' : `below the ${PASS_PERCENT}% pass mark`}`}
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
