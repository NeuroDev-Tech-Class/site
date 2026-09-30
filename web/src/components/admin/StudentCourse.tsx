import { useState } from 'react'
import { getAccount, getCourseOutline, getStudentProgress, getStudentWork, markFor, type CourseOutline } from '../../lib/adminApi'
import { routeHash } from '../../lib/adminRoute'
import type { ItemProgress, Submission } from '../../lib/api'
import { statusWord } from '../../lib/courseProgress'
import { formatDate, fullName } from '../../lib/format'
import { itemLabel } from '../../lib/itemLabel'
import { useLoad } from '../../lib/useLoad'
import { gradeHref } from './Queue'
import { ErrorLine, LoadError, Loading, problemWords, ViewHeading } from './shared'

type OutlineItem = CourseOutline['units'][number]['items'][number]

// What a coach may mark for a student: what a student marks with Mark complete, and a test taken on its old Form
const MARKABLE = ['lesson', 'video', 'slides', 'link']

const isExercise = (item: OutlineItem) => item.type === 'note' && item.tags.includes('exercise')
const isTest = (item: OutlineItem) => item.type === 'test' && item.status === 'ok'
const markable = (item: OutlineItem) => MARKABLE.includes(item.type) || isExercise(item) || isTest(item)
const noteText = (html: string | null | undefined) => (html ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 120)

function Where({ item, progress, latest }: { item: OutlineItem, progress?: ItemProgress, latest?: Submission }) {
  if (item.type === 'test' && item.status === 'needs_content') return <span className="text-(--muted)">Taken on its form for now</span>
  const word = statusWord(item.type, progress?.status ?? null)
  const behind = progress?.status === 'done' ? [] : (progress?.videos ?? []).map(v => v.percent)
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {word
        ? <span className="done-chip">{word}{progress?.status === 'done' && progress.done_at ? ` ${formatDate(progress.done_at)}` : ''}</span>
        : <span className="text-(--muted)">{progress?.opened_at ? 'Opened' : item.type === 'checkpoint' ? 'Not handed in' : 'Not started'}</span>}
      {behind.length > 0 && <span className="text-sm text-(--muted)">{behind.map(p => `${p}%`).join(', ')} watched</span>}
      {latest && <a href={gradeHref(latest.id)} aria-label={`Grade ${item.title}`} className="text-sm font-semibold">Grade</a>}
    </span>
  )
}

export default function StudentCourse({ id, course }: { id: string, course: string }) {
  const person = useLoad(() => getAccount(id), [id])
  const outline = useLoad(() => getCourseOutline(course), [course])
  const progress = useLoad(() => getStudentProgress(id), [id])
  const work = useLoad(() => getStudentWork(id), [id])
  const [busy, setBusy] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)

  async function mark(item: OutlineItem, done: boolean) {
    setBusy(item.id)
    setProblem(null)
    try {
      await markFor(id, item.id, done)
      await progress.reload()
    } catch (failure) {
      setProblem(problemWords(failure, "Couldn't save that. Please try again."))
    } finally {
      setBusy(null)
    }
  }

  const name = person.status === 'ready' ? fullName(person.value) || person.value.email : 'Student'
  const eyebrow = <a href={routeHash({ view: 'student', id })}>{name}</a>
  if (outline.status !== 'ready' || progress.status === 'loading') {
    return (
      <>
        <ViewHeading eyebrow={eyebrow}>{outline.status === 'ready' ? outline.value.title : 'Course'}</ViewHeading>
        {outline.status === 'error' || progress.status === 'error' ? <LoadError onRetry={() => { void outline.reload(); void progress.reload() }} /> : <Loading />}
      </>
    )
  }
  const mine = progress.status === 'ready' ? progress.value.courses.find(c => c.course_id === course) : undefined
  const statuses = new Map((mine?.items ?? []).map(item => [item.item_id, item]))
  // The hub lists work newest first, so the first piece for an item is its latest
  const latest = new Map<string, Submission>()
  for (const piece of work.status === 'ready' ? work.value : []) if (!latest.has(piece.item.id)) latest.set(piece.item.id, piece)

  return (
    <>
      <ViewHeading eyebrow={eyebrow}>{outline.value.title}</ViewHeading>
      <p className="mt-2 font-semibold">{mine ? `${mine.done} of ${mine.total} done · ${mine.percent}%` : 'Not started yet'}</p>
      <ErrorLine>{problem}</ErrorLine>
      {outline.value.units.map(unit => {
        const items = unit.items.filter(item => item.type !== 'note' || isExercise(item))
        if (!items.length) return null
        return (
          <section key={unit.id} className="mt-10" aria-labelledby={`unit-${unit.id}`}>
            <h2 id={`unit-${unit.id}`} className="mt-0 text-xl">{unit.title}</h2>
            <ul aria-label={unit.title} className="mt-3 flex list-none flex-col pl-0">
              {items.map(item => {
                const state = statuses.get(item.id)
                const { label, title } = isExercise(item) ? { label: 'Exercise', title: noteText(item.html) } : itemLabel(item)
                const done = state?.status === 'done'
                return (
                  <li key={item.id} className="mt-0 flex flex-col gap-2 border-t border-(--border) py-3 sm:flex-row sm:items-center sm:gap-4">
                    <span className="w-28 shrink-0 font-heading text-xs font-bold tracking-[0.08em] text-(--item-label) uppercase">{label}</span>
                    <span data-testid="title" className="min-w-0 flex-1">{title}</span>
                    <Where item={item} progress={state} latest={latest.get(item.id)} />
                    {markable(item) && !(isTest(item) && done && latest.has(item.id)) && (
                      <button type="button" className="btn-quiet sm:ml-2" disabled={busy !== null}
                        aria-label={`Mark ${title} ${done ? 'not done' : 'done'}`} onClick={() => void mark(item, !done)}>
                        {busy === item.id ? 'Saving…' : done ? 'Mark not done' : 'Mark done'}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </>
  )
}
