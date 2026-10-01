import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { StudentRow } from '../../lib/adminApi'
import { routeHash, type AdminRoute } from '../../lib/adminRoute'
import { ApiError, type TechAccount } from '../../lib/api'
import type { CourseMeta } from '../../lib/content'
import { countWords } from '../../lib/format'

export const REFRESH_MS = 30_000
export const LOAD_FAILED = "Couldn't load this. It will try again shortly, or reload the page."

export interface Admin {
  account: TechAccount
  // The published courses, for filters
  courses: CourseMeta[]
  // After a change that moves the sidebar's numbers (an approval, a grade)
  refreshCounts: () => void
}

// Told when the dashboard moves itself, so its router follows without Astro's router stepping in
export const ROUTE_EVENT = 'admin:route'

/**
 * Goes to a route; `replace` (a filter changing) swaps the address without adding a Back step. Every entry keeps
 * the state Astro's page router gives history entries (it ignores Back onto one without), counting a new step on.
 */
export function showRoute(route: AdminRoute, { replace = false }: { replace?: boolean } = {}): void {
  const hash = routeHash(route)
  const state = history.state as { index?: number } | null
  if (replace) history.replaceState(state, '', hash)
  else history.pushState({ ...state, index: (state?.index ?? 0) + 1, scrollX: 0, scrollY: 0 }, '', hash)
  window.dispatchEvent(new Event(ROUTE_EVENT))
}

export const AdminContext = createContext<Admin | null>(null)

export function useAdmin(): Admin {
  const admin = useContext(AdminContext)
  if (!admin) throw new Error('useAdmin outside the dashboard')
  return admin
}

export const HEADING_ID = 'admin-heading'

/** Each view's one heading; the dashboard moves focus here when the view changes */
export function ViewHeading({ children, eyebrow }: { children: ReactNode, eyebrow?: ReactNode }) {
  return (
    <>
      {eyebrow && <p className="eyebrow mt-0">{eyebrow}</p>}
      <h1 id={HEADING_ID} tabIndex={-1} className={`${eyebrow ? 'mt-1' : 'mt-0'} focus:outline-none`}>{children}</h1>
    </>
  )
}

// How long typing in a search box has to pause before the search is applied
const SEARCH_PAUSE_MS = 400

/** A search box whose words reach `onApply` once typing pauses; `applied` is what the address holds now */
export function SearchField({ label, applied, onApply, placeholder }: {
  label: string
  applied: string | undefined
  onApply: (words: string | undefined) => void
  placeholder?: string
}) {
  const [words, setWords] = useState(applied ?? '')
  // The address moved on without the box (the sidebar, Back): the box follows it
  const [following, setFollowing] = useState(applied)
  if (applied !== following) {
    setFollowing(applied)
    if ((words.trim() || undefined) !== applied) setWords(applied ?? '')
  }
  useEffect(() => {
    const wanted = words.trim() || undefined
    if (wanted === applied) return
    const timer = setTimeout(() => onApply(wanted), SEARCH_PAUSE_MS)
    return () => clearTimeout(timer)
  }, [words, applied, onApply])
  return (
    <label className="flex max-w-xs flex-1 basis-48 flex-col gap-1 font-semibold">
      {label}
      <input type="search" className="field" value={words} placeholder={placeholder} onChange={event => setWords(event.target.value)} />
    </label>
  )
}

/** A button for something that can't be undone: the first press asks, the second does it */
export function ConfirmButton({ label, name, confirm, onConfirm, disabled }: {
  label: string
  // The accessible name, saying who or what it acts on
  name: string
  confirm: string
  onConfirm: () => void
  disabled?: boolean
}) {
  const [asking, setAsking] = useState(false)
  if (!asking) {
    return <button type="button" className="btn-quiet" aria-label={name} disabled={disabled} onClick={() => setAsking(true)}>{label}</button>
  }
  return (
    <span className="flex flex-wrap gap-2">
      <button type="button" className="btn-primary" disabled={disabled} onClick={() => { setAsking(false); onConfirm() }}>{confirm}</button>
      <button type="button" className="btn-quiet" onClick={() => setAsking(false)}>Keep</button>
    </span>
  )
}

export const CELL = 'px-4 py-3'

/** A sign-up a coach can act on: confirmed their email and waiting (the sidebar badge counts these) */
export const waitingOnCoach = (s: StudentRow): boolean => s.status === 'pending' && s.email_verified

/** The dashboard's tables: named for screen readers, scrolling sideways inside their box on a phone */
export function DataTable({ caption, head, minWidth = '40rem', children }: {
  caption: string
  head: string[]
  minWidth?: string
  children: ReactNode
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-(--border)">
      <table className="w-full border-collapse text-left" style={{ minWidth }}>
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-(--panel) text-sm text-(--muted)">
          <tr>{head.map((title, i) => <th key={`${i}-${title}`} scope="col" className={CELL}>{title}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

/** What went wrong with the last thing the coach did, if anything */
export const ErrorLine = ({ children }: { children: ReactNode }) =>
  children ? <p role="alert" className="mt-2 font-semibold text-red-700 dark:text-red-300">{children}</p> : null

/** What the last thing the coach did came to; keeps its space so the page doesn't jump */
export const StatusLine = ({ children }: { children: ReactNode }) =>
  <p role="status" className="mt-2 min-h-[1.5em] font-semibold">{children}</p>

export const problemWords = (failure: unknown, fallback: string): string =>
  failure instanceof ApiError ? failure.message : fallback

/** A view that refreshes itself says it will; one that doesn't gives the coach a way to try again */
export function LoadError({ onRetry }: { onRetry?: () => void }) {
  if (!onRetry) return <p className="panel mt-6">{LOAD_FAILED}</p>
  return (
    <div className="panel mt-6 flex flex-wrap items-center gap-3">
      <p className="mt-0">Couldn't load this.</p>
      <button type="button" className="btn-quiet" onClick={onRetry}>Try again</button>
    </div>
  )
}
export const Loading = () => <p className="mt-6 text-(--muted)" aria-busy="true">Loading…</p>

const DAY = 24 * 60 * 60 * 1000

/** How long something has waited, in whole days: "today", "1 day", "5 days" */
export function waitedWords(since: string | null, now: number = Date.now()): string {
  if (!since) return ''
  const days = Math.floor((now - new Date(since).getTime()) / DAY)
  return days < 1 ? 'today' : countWords(days, 'day')
}

export const withinDays = (when: string | null, days: number, now: number = Date.now()): boolean =>
  Boolean(when) && now - new Date(when as string).getTime() < days * DAY
