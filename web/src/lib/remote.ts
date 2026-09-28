// Something the hub knows about the signed-in student, shared by every island that asks for the same key. It is
// read again whenever an island using it opens, so coming back to a page never shows old numbers, and requests
// made at the same moment share one call.
import { useEffect, useSyncExternalStore } from 'react'

export type Remote<T> =
  | { status: 'unavailable' }
  | { status: 'loading' }
  | { status: 'ready', value: T }
  | { status: 'error' }

const UNAVAILABLE = { status: 'unavailable' } as const
const LOADING = { status: 'loading' } as const

export function createRemote<T>(fetcher: (key: string) => Promise<T>) {
  const states = new Map<string, Remote<T>>()
  const inflight = new Map<string, Promise<void>>()
  const listeners = new Set<() => void>()

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }

  function load(slotKey: string, key: string): Promise<void> {
    const running = inflight.get(slotKey)
    if (running) return running
    const pending = fetcher(key)
      .then(
        value => { states.set(slotKey, { status: 'ready', value }) },
        () => { if (states.get(slotKey)?.status !== 'ready') states.set(slotKey, { status: 'error' }) },
      )
      .finally(() => {
        inflight.delete(slotKey)
        listeners.forEach(listener => listener())
      })
    inflight.set(slotKey, pending)
    return pending
  }

  // Answers are kept per account, so on a shared computer the next student never sees the last one's
  const slot = (owner: string, key: string) => `${owner} ${key}`

  /** `owner` is the signed-in, approved account's id; null (anyone else) always gets 'unavailable' */
  function useRemote(key: string, owner: string | null): Remote<T> {
    useEffect(() => {
      if (owner) void load(slot(owner, key), key)
    }, [owner, key])
    const state = useSyncExternalStore(
      subscribe,
      () => (owner ? states.get(slot(owner, key)) : undefined) ?? LOADING,
      () => UNAVAILABLE,
    )
    return owner ? state : UNAVAILABLE
  }

  const reload = (owner: string, key: string) => load(slot(owner, key), key)

  return { reload, useRemote }
}
