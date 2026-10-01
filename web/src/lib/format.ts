// Ported from assets/js/lib/format.js. Firestore Timestamps are gone: the API sends ISO strings.

type DateInput = string | number | Date | null | undefined

function capitalize(word: string): string {
  return word[0].toUpperCase() + word.slice(1).toLowerCase()
}

function isSingleCase(word: string): boolean {
  return word === word.toLowerCase() || word === word.toUpperCase()
}

/** Fixes "john" and "SMITH" but leaves deliberate mixed case like "McDonald" alone. */
export function formatName(value: string | null | undefined): string {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\s'-]+/g, word => (isSingleCase(word) ? capitalize(word) : word))
}

export function fullName(account: { first_name: string | null; last_name: string | null }): string {
  return [formatName(account.first_name), formatName(account.last_name)].filter(Boolean).join(' ')
}

export function isStaff(account: { role: string } | null): boolean {
  return account?.role === 'admin' || account?.role === 'superadmin'
}

export function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value: DateInput, { month = 'short', fallback = '' }: { month?: 'short' | 'long'; fallback?: string } = {}): string {
  const date = toDate(value)
  if (!date) return fallback
  return date.toLocaleDateString('en-US', { year: 'numeric', month, day: 'numeric' })
}

/** A date with no time ("2026-09-30", a certificate's date) as that same day, never shifted by the time zone */
export function calendarDate(iso: string, month: 'short' | 'long' = 'short'): string {
  const [year, monthNumber, day] = iso.split('-').map(Number)
  return new Date(year, monthNumber - 1, day).toLocaleDateString('en-US', { year: 'numeric', month, day: 'numeric' })
}

/** The browser's own date as YYYY-MM-DD, as a date field holds it */
export function todayIso(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** "1 point", "3 points" */
export const countWords = (count: number, word: string): string => `${count} ${word}${count === 1 ? '' : 's'}`

const plural = (n: number, word: string) => `${countWords(n, word)} ago`

/** Relative wording for feeds. A clock running ahead of the stored time reads as "just now". */
export function timeAgo(value: DateInput, now: Date = new Date()): string {
  const date = toDate(value)
  if (!date) return ''
  const elapsed = now.getTime() - date.getTime()
  if (elapsed < MINUTE) return 'just now'
  if (elapsed < HOUR) return plural(Math.floor(elapsed / MINUTE), 'minute')
  if (elapsed < DAY) return plural(Math.floor(elapsed / HOUR), 'hour')
  if (elapsed < 2 * DAY) return 'yesterday'
  if (elapsed < 7 * DAY) return plural(Math.floor(elapsed / DAY), 'day')
  return formatDate(date)
}
