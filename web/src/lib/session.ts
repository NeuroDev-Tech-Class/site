// The signed-in account, shared by every island on the page. The router keeps this module alive between
// pages, so the hub is asked once per full page load rather than on every click.
import { useEffect, useSyncExternalStore } from 'react'
import { logout, refreshSession, type TechAccount } from './api'

export type Session =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in', account: TechAccount }

const LOADING: Session = { status: 'loading' }

let session: Session = LOADING
let started: Promise<void> | null = null
const listeners = new Set<() => void>()

export const getSession = (): Session => session

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setAccount(account: TechAccount | null): void {
  session = account ? { status: 'signed-in', account } : { status: 'signed-out' }
  listeners.forEach(listener => listener())
}

export function startSession(): Promise<void> {
  started ??= refreshSession().then(setAccount)
  return started
}

export async function signOut(): Promise<void> {
  await logout()
  setAccount(null)
}

export function useSession(): Session {
  useEffect(() => {
    void startSession()
  }, [])
  return useSyncExternalStore(subscribe, getSession, () => LOADING)
}
