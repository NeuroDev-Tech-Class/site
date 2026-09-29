import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ApiError,
  handIn,
  saveDraft,
  type Answers,
  type CheckpointContent,
  type CheckpointField,
  type Draft,
  type Submission,
} from '../../lib/api'
import { answerable, answeredCount, checklistHint, stillNeeded, withoutBlanks } from '../../lib/checkpoint'
import { ErrorSummary, type Problem } from '../auth/form'
import AnswerList from './AnswerList'
import FileField, { Required } from './FileField'

// How long typing has to pause before the draft is saved
export const AUTOSAVE_MS = 600
// The hub's limits (app/tech/answers.py), so the box stops before the hub would refuse
const LIMITS: Partial<Record<CheckpointField['type'], number>> = { shortText: 200, longText: 10_000, url: 2000, code: 50_000 }

type SaveState = 'idle' | 'saving' | 'saved' | 'failed'

function describedBy(field: CheckpointField, error?: string): string | undefined {
  const id = `field-${field.id}`
  return [field.help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
}

function Notes({ field, error, hint }: { field: CheckpointField, error?: string, hint?: string | null }) {
  const id = `field-${field.id}`
  return (
    <>
      {field.help && <p id={`${id}-help`} className="mt-1 text-sm text-(--muted)">{field.help}</p>}
      {hint && <p className="mt-1 text-sm text-(--muted)">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-1 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>}
    </>
  )
}

interface QuestionProps {
  field: CheckpointField
  value: string | string[] | undefined
  error?: string
  onChange: (value: string | string[]) => void
}

function TextQuestion({ field, value, error, onChange }: QuestionProps) {
  const id = `field-${field.id}`
  const common = {
    id,
    name: field.id,
    value: typeof value === 'string' ? value : '',
    maxLength: LIMITS[field.type],
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy(field, error),
    className: `field mt-2 ${field.type === 'code' ? 'font-mono text-sm' : ''}`,
  }
  return (
    <div className="mt-8">
      <label htmlFor={id} className="block font-semibold">{field.label}<Required field={field} /></label>
      <Notes field={field} error={error} />
      {field.type === 'shortText' && <input {...common} type="text" onChange={e => onChange(e.target.value)} />}
      {field.type === 'url' && (
        <input {...common} type="url" inputMode="url" placeholder="https://" onChange={e => onChange(e.target.value)} />
      )}
      {field.type === 'longText' && <textarea {...common} rows={5} onChange={e => onChange(e.target.value)} />}
      {field.type === 'code' && (
        <textarea {...common} rows={10} spellCheck={false} autoCapitalize="off" onChange={e => onChange(e.target.value)} />
      )}
    </div>
  )
}

function ChecklistQuestion({ field, value, error, onChange }: QuestionProps) {
  const ticked = Array.isArray(value) ? value : []
  const items = field.items ?? []
  return (
    <fieldset id={`field-${field.id}`} className="mt-8" aria-describedby={describedBy(field, error)}>
      <legend className="font-semibold">{field.label}<Required field={field} /></legend>
      <Notes field={field} error={error} hint={checklistHint(field)} />
      <ul className="mt-2 flex list-none flex-col gap-1 pl-0">
        {items.map(item => (
          <li key={item} className="mt-0">
            <label className="flex min-h-[44px] cursor-pointer items-start gap-3 py-2">
              <input
                type="checkbox"
                className="mt-1 size-5 shrink-0 cursor-pointer accent-(--check)"
                checked={ticked.includes(item)}
                onChange={() => onChange(items.filter(i => (i === item ? !ticked.includes(i) : ticked.includes(i))))}
              />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  )
}

function SignOffNote({ field }: { field: CheckpointField }) {
  return (
    <div className="mt-8 rounded-lg border-l-4 border-(--link) bg-(--page) px-4 py-3">
      <p className="mt-0 font-semibold">{field.label}</p>
      <p className="mt-1">Your coach will confirm this in person.</p>
    </div>
  )
}

interface Props {
  itemId: string
  content: CheckpointContent
  draft: Draft
  onHandedIn: (work: Submission) => void
}

export default function CheckpointForm({ itemId, content, draft, onHandedIn }: Props) {
  const [answers, setAnswers] = useState<Answers>(draft.answers)
  const [files, setFiles] = useState(() => new Map(draft.files.map(file => [file.id, file])))
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [problems, setProblems] = useState<Problem[]>([])
  const [reviewing, setReviewing] = useState(false)
  const [busy, setBusy] = useState(false)
  const latest = useRef(answers)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const save = useCallback(async () => {
    clearTimeout(timer.current)
    setSaveState('saving')
    try {
      await saveDraft(itemId, withoutBlanks(latest.current))
      setSaveState('saved')
      setErrors({})
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 422) {
        setErrors(failure.fields)
        setSaveState('idle')
      } else {
        setSaveState('failed')
      }
    }
  }, [itemId])

  function change(fieldId: string, value: string | string[]) {
    latest.current = { ...latest.current, [fieldId]: value }
    setAnswers(latest.current)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => void save(), AUTOSAVE_MS)
  }

  async function handInWork() {
    clearTimeout(timer.current)
    setBusy(true)
    try {
      onHandedIn(await handIn(itemId, withoutBlanks(latest.current)))
    } catch (failure) {
      const fieldErrors = failure instanceof ApiError ? failure.fields : {}
      const labels = new Map(content.fields.map(field => [field.id, field.label]))
      const listed = Object.entries(fieldErrors).map(([fieldId, message]) => ({
        field: `field-${fieldId}`, message: `${labels.get(fieldId) ?? fieldId}: ${message}`,
      }))
      setErrors(fieldErrors)
      setProblems(listed.length ? listed : [{
        message: failure instanceof ApiError ? failure.message : "Couldn't hand it in. Check your connection and try again.",
      }])
      setReviewing(false)
    } finally {
      setBusy(false)
    }
  }

  const questions = answerable(content.fields)
  const gaps = stillNeeded(content, answers)

  if (reviewing) {
    return (
      <section aria-labelledby="review-heading" className="panel">
        <h2 id="review-heading" className="mt-0">Check your answers</h2>
        <AnswerList fields={content.fields} answers={answers} files={files} />
        {gaps.length > 0 && (
          <div className="mt-4">
            <p className="font-semibold">Still needed before you can hand it in:</p>
            <ul aria-label="Still needed" className="mt-2 list-disc pl-6">
              {gaps.map(gap => <li key={gap}>{gap}</li>)}
            </ul>
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" disabled={busy || gaps.length > 0} aria-busy={busy}
            onClick={() => void handInWork()}>
            Hand it in
          </button>
          <button type="button" className="btn-quiet" onClick={() => setReviewing(false)}>Keep editing</button>
        </div>
      </section>
    )
  }

  return (
    <form noValidate onSubmit={event => { event.preventDefault(); setReviewing(true) }}>
      <ErrorSummary problems={problems} />
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="mt-0 font-semibold">{answeredCount(content.fields, answers)} of {questions.length} answered</p>
        <p role="status" className="mt-0 text-(--muted)">
          {saveState === 'saving' && 'Saving…'}
          {saveState === 'saved' && 'Saved'}
          {saveState === 'failed' && (
            <>
              Couldn't save. Your answers are still here.{' '}
              <button type="button" className="font-semibold text-(--link) underline" onClick={() => void save()}>Try again</button>
            </>
          )}
        </p>
      </div>
      {content.fields.map(field => {
        const shared = { field, value: answers[field.id], error: errors[field.id], onChange: (v: string | string[]) => change(field.id, v) }
        if (field.type === 'mentorSignOff') return <SignOffNote key={field.id} field={field} />
        if (field.type === 'checklist') return <ChecklistQuestion key={field.id} {...shared} />
        if (field.type === 'file' || field.type === 'image') {
          return (
            <FileField
              key={field.id}
              itemId={itemId}
              field={field}
              chosen={Array.isArray(answers[field.id]) ? answers[field.id] as string[] : []}
              files={files}
              error={errors[field.id]}
              onUploaded={file => setFiles(known => new Map(known).set(file.id, file))}
              onChange={ids => change(field.id, ids)}
            />
          )
        }
        return <TextQuestion key={field.id} {...shared} />
      })}
      <button type="submit" className="btn-primary mt-10">Review and hand in</button>
    </form>
  )
}
