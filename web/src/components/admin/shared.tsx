import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { routeHash, type AdminRoute } from '../../lib/adminRoute'
import type { TechAccount } from '../../lib/api'
import type { CourseMeta } from '../../lib/content'

export const REFRESH_MS = 30_000
export const LOAD_FAILED = "Couldn't load this. It will try again shortly, or reload the page."

export interface Admin {
  account: TechAccount
  // The published courses, for filters
  courses: CourseMeta[]
  // After a change that moves the sidebar's numbers (an approval, a grade)
  refreshCounts: () => void
}

/** Goes to a route; `replace` (a filter changing) swaps the address without adding a Back step */
export function showRoute(route: AdminRoute, { replace = false }: { replace?: boolean } = {}): void {
  const hash = routeHash(route)
  if (!replace) {
    window.location.hash = hash
    return
  }
  history.replaceState(null, '', hash)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
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

export const LoadError = () => <p className="panel mt-6">{LOAD_FAILED}</p>
export const Loading = () => <p className="mt-6 text-(--muted)" aria-busy="true">Loading…</p>

const DAY = 24 * 60 * 60 * 1000

/** How long something has waited, in whole days: "today", "1 day", "5 days" */
export function waitedWords(since: string | null, now: number = Date.now()): string {
  if (!since) return ''
  const days = Math.floor((now - new Date(since).getTime()) / DAY)
  return days < 1 ? 'today' : `${days} day${days === 1 ? '' : 's'}`
}

export const withinDays = (when: string | null, days: number, now: number = Date.now()): boolean =>
  Boolean(when) && now - new Date(when as string).getTime() < days * DAY
