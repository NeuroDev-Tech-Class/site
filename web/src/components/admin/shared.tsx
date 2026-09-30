import { createContext, useContext, type ReactNode } from 'react'
import type { TechAccount } from '../../lib/api'

export const REFRESH_MS = 30_000
export const LOAD_FAILED = "Couldn't load this. It will try again shortly, or reload the page."

export interface Admin {
  account: TechAccount
  // After a change that moves the sidebar's numbers (an approval, a grade)
  refreshCounts: () => void
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
