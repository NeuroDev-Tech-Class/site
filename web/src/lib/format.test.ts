import { describe, expect, test } from 'vitest'
import { formatDate, formatName, fullName, isStaff, timeAgo, toDate } from './format'

const noonUtc = new Date('2026-09-08T12:00:00Z')

describe('names', () => {
  test('formatName fixes single-case words and keeps deliberate mixed case', () => {
    expect(formatName('john')).toBe('John')
    expect(formatName('SMITH')).toBe('Smith')
    expect(formatName('McDonald')).toBe('McDonald')
    expect(formatName('  mary   ann ')).toBe('Mary Ann')
    expect(formatName('anne-marie')).toBe('Anne-Marie')
    expect(formatName(null)).toBe('')
  })

  test('fullName joins the formatted first and last names, and copes with either missing', () => {
    expect(fullName({ first_name: 'john', last_name: 'SMITH' })).toBe('John Smith')
    expect(fullName({ first_name: 'sam', last_name: null })).toBe('Sam')
    expect(fullName({ first_name: null, last_name: null })).toBe('')
  })

  test('isStaff is true for tech admins and the superadmin only', () => {
    expect(isStaff({ role: 'admin' })).toBe(true)
    expect(isStaff({ role: 'superadmin' })).toBe(true)
    expect(isStaff({ role: 'student' })).toBe(false)
    expect(isStaff(null)).toBe(false)
  })
})

describe('dates', () => {
  test('toDate accepts ISO strings, numbers and Dates, and rejects junk', () => {
    expect(toDate('2026-09-08T12:00:00Z')?.getTime()).toBe(noonUtc.getTime())
    expect(toDate(noonUtc.getTime())?.getTime()).toBe(noonUtc.getTime())
    expect(toDate(noonUtc)).toBe(noonUtc)
    expect(toDate(null)).toBeNull()
    expect(toDate(undefined)).toBeNull()
    expect(toDate('not a date')).toBeNull()
  })

  test('formatDate renders short and long months in en-US, or the fallback', () => {
    expect(formatDate(noonUtc)).toBe('Sep 8, 2026')
    expect(formatDate('2026-09-08T12:00:00Z', { month: 'long' })).toBe('September 8, 2026')
    expect(formatDate(null)).toBe('')
    expect(formatDate('garbage', { fallback: 'N/A' })).toBe('N/A')
  })

  test('timeAgo counts minutes, hours and days, then falls back to a date', () => {
    const now = new Date('2026-09-11T18:00:00Z')
    const ago = (ms: number) => timeAgo(new Date(now.getTime() - ms), now)
    expect(ago(45 * 1000)).toBe('just now')
    expect(ago(60 * 1000)).toBe('1 minute ago')
    expect(ago(5 * 60 * 1000)).toBe('5 minutes ago')
    expect(ago(60 * 60 * 1000)).toBe('1 hour ago')
    expect(ago(26 * 60 * 60 * 1000)).toBe('yesterday')
    expect(ago(3 * 24 * 60 * 60 * 1000)).toBe('3 days ago')
    expect(ago(8 * 24 * 60 * 60 * 1000)).toBe('Sep 3, 2026')
    expect(timeAgo(new Date(now.getTime() + 60000), now)).toBe('just now')
    expect(timeAgo('garbage', now)).toBe('')
  })
})
