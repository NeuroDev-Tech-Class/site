import { useEffect, useState } from 'react'
import type { ProgressStatus } from '../../lib/api'
import { hasPage, type ItemView, type UnitView } from '../../lib/content'
import { countsDone, setItemDone, useCourseProgress } from '../../lib/courseProgress'
import Icon from '../Icon'

type Statuses = Map<string, ProgressStatus | null>

const CHECKPOINT_WORDS: Record<string, string> = { done: 'Complete', submitted: 'Submitted', returned: 'Needs revision' }
// Drawn on the row the student just finished; set by the effect below, outside React's own rendering
const JUST_DONE = 'rounded-lg data-just-done:outline-2 data-just-done:outline-offset-2 data-just-done:outline-(--accent) data-just-done:outline-solid'

function statusWord(type: string, status: ProgressStatus | null): string | null {
  if (type === 'checkpoint') return CHECKPOINT_WORDS[status ?? ''] ?? null
  if (status === 'submitted') return 'Submitted'
  if (status === 'returned') return 'Needs revision'
  return status === 'done' ? 'Done' : null
}

function ExerciseBox({ courseId, item, checked }: { courseId: string, item: ItemView, checked: boolean }) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function toggle() {
    setBusy(true)
    setFailed(false)
    try {
      await setItemDone(courseId, item.id, !checked)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="flex shrink-0 flex-col items-center">
      <label className="grid size-11 cursor-pointer place-items-center rounded-lg hover:bg-(--page)">
        <input
          type="checkbox"
          className="size-5 cursor-pointer accent-(--accent)"
          checked={checked}
          disabled={busy}
          aria-labelledby={`note-${item.id}`}
          aria-describedby={failed ? `note-${item.id}-error` : undefined}
          onChange={() => void toggle()}
        />
      </label>
      {failed && (
        <span id={`note-${item.id}-error`} role="alert" className="sr-only">Couldn't save that. Please try again.</span>
      )}
      {failed && <span aria-hidden="true" className="text-xs font-semibold text-red-600 dark:text-red-300">Not saved</span>}
    </span>
  )
}

function Row({ courseId, item, statuses }: { courseId: string, item: ItemView, statuses: Statuses | null }) {
  const status = statuses?.get(item.id) ?? null

  if (item.type === 'note') {
    return (
      <li id={`item-${item.id}`} data-item className={`mt-0 flex gap-3 border-t border-(--border) py-3 text-(--muted) ${JUST_DONE}`}>
        {item.exercise && statuses
          ? <ExerciseBox courseId={courseId} item={item} checked={status === 'done'} />
          : <Icon name="note" size={18} className="mt-1 shrink-0" />}
        <div id={`note-${item.id}`} className={`min-w-0 ${item.exercise && statuses ? 'self-center' : ''}`} dangerouslySetInnerHTML={{ __html: item.html ?? '' }} />
      </li>
    )
  }
  const word = statusWord(item.type, status)
  return (
    <li
      id={`item-${item.id}`}
      data-item
      className={`mt-0 flex flex-col gap-1 border-t border-(--border) py-3 sm:flex-row sm:items-center sm:gap-4 ${JUST_DONE}`}
      style={{ '--t': `var(--type-${item.type})` } as React.CSSProperties}
    >
      <span className="flex w-36 shrink-0 items-center gap-2 font-heading text-xs font-bold tracking-[0.08em] text-(--t) uppercase">
        <span className="grid size-7 place-items-center rounded-md" style={{ background: 'color-mix(in srgb, var(--t) 16%, transparent)' }}>
          <Icon name={item.type} size={16} />
        </span>
        {item.label}
      </span>
      <span className="min-w-0 flex-1">
        {hasPage(item.type) ? <a href={`/learn/${item.id}`} className="text-(--text)">{item.title}</a> : item.title}
      </span>
      {word && (
        <span className="inline-flex shrink-0 items-center gap-1 self-start rounded-full bg-(--page) px-3 py-1 text-sm font-semibold sm:self-auto">
          {countsDone(item.type, status) && <Icon name="check" size={16} className="text-(--accent)" />}
          {word}
        </span>
      )}
    </li>
  )
}

export default function CourseUnits({ courseId, units }: { courseId: string, units: UnitView[] }) {
  const state = useCourseProgress(courseId)
  const statuses: Statuses | null = state.status === 'ready'
    ? new Map(state.progress.items.map(i => [i.item_id, i.status]))
    : null
  const ready = state.status === 'ready'

  // Back from Mark complete (?done=<item>): bring that item into view once, then tidy the address
  useEffect(() => {
    if (!ready) return
    const url = new URL(window.location.href)
    const id = url.searchParams.get('done')
    if (!id) return
    const row = document.getElementById(`item-${id}`)
    if (row) {
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      row.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
      row.dataset.justDone = 'true'
    }
    url.searchParams.delete('done')
    history.replaceState(history.state, '', url.pathname + url.search + url.hash)
  }, [ready])

  return (
    <>
      {units.map(unit => {
        const counted = unit.items.filter(i => i.counts)
        const done = statuses ? counted.filter(i => countsDone(i.type, statuses.get(i.id) ?? null)).length : 0
        return (
          <section key={unit.id} id={`unit-${unit.id}`} className="panel mt-8 scroll-mt-6">
            <div className="flex flex-wrap items-center gap-3">
              {unit.number && <span className="unit-pill">Unit {unit.number}</span>}
              <h2 className="mt-0 text-xl sm:text-2xl">{unit.title}</h2>
              {statuses && counted.length > 0 && (
                <span className="ml-auto text-sm font-semibold text-(--muted)">{done} of {counted.length} done</span>
              )}
            </div>
            {unit.description && <p className="mt-2 text-(--muted)">{unit.description}</p>}
            <ol className="mt-4 list-none pl-0">
              {unit.items.map(item => (
                <Row key={item.id} courseId={courseId} item={item} statuses={statuses} />
              ))}
            </ol>
          </section>
        )
      })}
    </>
  )
}
