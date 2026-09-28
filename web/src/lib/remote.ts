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

  function load(key: string): Promise<void> {
    const running = inflight.get(key)
    if (running) return running
    const pending = fetcher(key)
      .then(
        value => { states.set(key, { status: 'ready', value }) },
        () => { if (states.get(key)?.status !== 'ready') states.set(key, { status: 'error' }) },
      )
      .finally(() => {
        inflight.delete(key)
        listeners.forEach(listener => listener())
      })
    inflight.set(key, pending)
    return pending
  }

  /** `enabled` is false for anyone not signed in and approved; they always get 'unavailable' */
  function useRemote(key: string, enabled: boolean): Remote<T> {
    useEffect(() => {
      if (enabled) void load(key)
    }, [enabled, key])
    const state = useSyncExternalStore(subscribe, () => states.get(key) ?? LOADING, () => UNAVAILABLE)
    return enabled ? state : UNAVAILABLE
  }

  return { load, useRemote }
}
