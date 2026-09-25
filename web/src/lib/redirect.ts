import type { TechAccount } from './api'

const SIGN_IN_PAGES = ['/sign-in', '/register', '/verify', '/forgot-password', '/reset-password', '/waiting']

/** Where ?next= says to go, if it is a page on this site; never back into the sign-in pages. Mirrors the hub's safe_redirect. */
export function safeNext(search: string): string {
  const next = new URLSearchParams(search).get('next')
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/'
  const path = next.split(/[?#]/)[0]
  return SIGN_IN_PAGES.includes(path) ? '/' : next
}

/** The waiting page forwards approved accounts on to `next`, so it is also where Google sign-in returns to */
export const waitingPage = (next: string): string =>
  next === '/' ? '/waiting' : `/waiting?next=${encodeURIComponent(next)}`

export const afterSignIn = (account: TechAccount, next: string): string =>
  account.status === 'approved' ? next : waitingPage(next)
