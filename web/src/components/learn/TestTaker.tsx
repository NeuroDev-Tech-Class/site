import { useEffect, useRef, useState } from 'react'
import {
  ApiError,
  getTestState,
  saveTestAnswers,
  startTest,
  submitTest,
  type TestAttempt,
  type TestQuestion,
  type TestState,
} from '../../lib/api'
import type { ItemPageView } from '../../lib/content'
import { countWords } from '../../lib/format'
import Question from '../test/Question'
import Review from '../test/Review'

// How long answering has to pause before the answers are saved
const SAVE_PAUSE_MS = 600
const SAVE_FAILED = "Couldn't save. Your answers are still here; keep going and it will try again."

type Answers = Record<string, unknown>

function answered(question: TestQuestion, value: unknown): boolean {
  if (question.type === 'match') return Array.isArray(value) && value.length === (question.rows ?? []).length && value.every(v => v !== null && v !== undefined)
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'string') return value.trim() !== ''
  return value !== undefined && value !== null
}

/** What goes to the hub: blanks left out, a half-matched question kept */
const kept = (answers: Answers): Answers =>
  Object.fromEntries(Object.entries(answers).filter(([, v]) => v !== '' && v !== undefined && !(Array.isArray(v) && !v.length)))

function questionList(numbers: number[]): string {
  if (numbers.length === 1) return `question ${numbers[0]}`
  return `questions ${numbers.slice(0, -1).join(', ')} and ${numbers[numbers.length - 1]}`
}

function Taking({ page, state, onDone }: { page: ItemPageView, state: TestState, onDone: (s: TestState) => void }) {
  const test = state.test!
  const [answers, setAnswers] = useState<Answers>(state.draft?.answers ?? {})
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  function change(question: TestQuestion, value: unknown) {
    const next = { ...answers, [String(question.number)]: value }
    setAnswers(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setSaving('saving')
      saveTestAnswers(page.id, kept(next)).then(() => setSaving('saved'), () => setSaving('failed'))
    }, SAVE_PAUSE_MS)
  }

  async function handIn() {
    clearTimeout(timer.current)
    setBusy(true)
    setProblem(null)
    try {
      onDone(await submitTest(page.id, kept(answers)))
    } catch (failure) {
      setProblem(failure instanceof ApiError ? failure.message : "Couldn't hand it in. Please try again.")
      setBusy(false)
    }
  }

  const missing = test.questions.filter(q => !answered(q, answers[String(q.number)])).map(q => q.number)
  return (
    <>
      {test.instructions_html && <div className="lesson" dangerouslySetInnerHTML={{ __html: test.instructions_html }} />}
      <div className="sticky top-0 z-10 -mx-4 mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-(--border) bg-(--bg) px-4 py-2">
        <p className="mt-0 font-semibold">{test.questions.length - missing.length} of {test.questions.length} answered</p>
        <p role="status" className="mt-0 text-sm text-(--muted)">
          {saving === 'saving' ? 'Saving…' : saving === 'saved' ? 'Saved' : saving === 'failed' ? SAVE_FAILED : ''}
        </p>
      </div>
      {test.questions.map(question => (
        <Question key={question.number} question={question} value={answers[String(question.number)]}
          onChange={value => change(question, value)} disabled={busy} />
      ))}
      <div className="mt-8 flex flex-col items-start gap-3">
        {!confirming
          ? <button type="button" className="btn-primary" onClick={() => setConfirming(true)}>Hand in</button>
          : (
              <div className="panel flex flex-col gap-3">
                <p className="mt-0 font-semibold">
                  {missing.length
                    ? `You haven't answered ${questionList(missing)}. Hand it in anyway? You can't change your answers afterwards.`
                    : "Hand in your answers? You can't change them afterwards."}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button type="button" className="btn-primary" disabled={busy} onClick={() => void handIn()}>Hand it in</button>
                  <button type="button" className="btn-quiet" disabled={busy} onClick={() => setConfirming(false)}>Keep working</button>
                </div>
              </div>
            )}
        {problem && <p role="alert" className="mt-0 font-semibold">{problem}</p>}
      </div>
    </>
  )
}

function Result({ attempt, latest }: { attempt: TestAttempt, latest: boolean }) {
  const summary = attempt.provisional
    ? `Your coach is marking your written answers. So far: ${attempt.total_score ?? 0} of ${attempt.total_max ?? 0} points.`
    : `${attempt.status_label} · ${attempt.score_label}`
  const body = (
    <>
      <p className={latest ? 'mt-2 text-lg font-semibold' : 'mt-2 font-semibold'}>{summary}</p>
      {attempt.feedback && (
        <div className="panel mt-3">
          <p className="mt-0 font-semibold">Your coach's feedback:</p>
          <p className="mt-1 whitespace-pre-wrap">{attempt.feedback}</p>
        </div>
      )}
      <Review label={`Attempt ${attempt.attempt}, question by question`} questions={attempt.questions}
        answers={attempt.answers} marks={attempt.marks} keys={attempt.key} />
    </>
  )
  if (latest) return <section aria-labelledby="latest-attempt"><h2 id="latest-attempt" className="mt-0">Attempt {attempt.attempt}</h2>{body}</section>
  return (
    <details className="mt-8">
      <summary className="cursor-pointer font-heading font-bold">Attempt {attempt.attempt}</summary>
      {body}
    </details>
  )
}

function Overview({ state, onStart, busy }: { state: TestState, onStart: () => void, busy: boolean }) {
  const test = state.test!
  const [latest, ...older] = state.attempts
  const next = state.attempts_used + 1
  // The higher score is the one that counts
  const best = older.length ? state.attempts.find(a => a.attempt === state.best_attempt) : undefined
  return (
    <>
      {!latest && (
        <>
          <p className="mt-0 font-semibold">
            {countWords(test.questions.length, 'question')} · {countWords(test.total_points, 'point')} · pass mark {test.pass_percent}%
            {state.can_start && ` · attempt ${next} of ${state.attempts_allowed}`}
          </p>
          {test.instructions_html && <div className="lesson" dangerouslySetInnerHTML={{ __html: test.instructions_html }} />}
        </>
      )}
      {state.reason && <p className="panel mt-4 font-semibold">{state.reason}</p>}
      {best && <p className="mt-4 text-lg font-semibold">Your best: attempt {best.attempt} · {best.score_label}</p>}
      {state.can_start && (
        <button type="button" className="btn-primary mt-4" disabled={busy} onClick={onStart}>
          {latest ? `Try again (attempt ${next} of ${state.attempts_allowed})` : 'Start the test'}
        </button>
      )}
      {latest && <div className="mt-8"><Result attempt={latest} latest /></div>}
      {older.map(attempt => <Result key={attempt.attempt} attempt={attempt} latest={false} />)}
    </>
  )
}

/** A test on its item page: start, answer (saved as you go), hand in, then the result */
export default function TestTaker({ page }: { page: ItemPageView }) {
  const [state, setState] = useState<TestState | null>(null)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  useEffect(() => {
    let current = true
    getTestState(page.id).then(s => current && setState(s), () => current && setFailed(true))
    return () => { current = false }
  }, [page.id])

  async function start() {
    setBusy(true)
    setProblem(null)
    try {
      setState(await startTest(page.id))
    } catch (failure) {
      setProblem(failure instanceof ApiError ? failure.message : "Couldn't start the test. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  if (failed) return <p>Couldn't load this. Reload the page to try again.</p>
  if (!state) return <p className="text-(--muted)" aria-busy="true">Loading…</p>
  if (!state.ready || !state.test) return <p className="panel mt-0">{state.reason ?? "This test isn't ready yet."}</p>
  return (
    <>
      {state.draft
        ? <Taking key={state.draft.attempt} page={page} state={state} onDone={setState} />
        : <Overview state={state} onStart={() => void start()} busy={busy} />}
      {problem && <p role="alert" className="mt-3 font-semibold">{problem}</p>}
    </>
  )
}
