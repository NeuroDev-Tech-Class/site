// Something the dashboard reads from the hub. A reload keeps the last answer on screen until the new one arrives
// (and keeps it if the reload fails), answers to older requests are dropped, and with `every` it refreshes on that
// interval while the tab is visible and straight away when the coach comes back to it.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

export type Loaded<T> = { status: 'loading' } | { status: 'ready', value: T } | { status: 'error', failure: unknown }

const LOADING = { status: 'loading' } as const

export function useLoad<T>(fetcher: () => Promise<T>, deps: unknown[], { every }: { every?: number } = {}):
  Loaded<T> & { reload: () => Promise<void>, set: (value: T) => void } {
  // Answers belong to the deps they were asked for, so new deps read as loading until their own answer arrives
  const key = JSON.stringify(deps)
  const [held, setHeld] = useState<{ key: string, loaded: Loaded<T> }>({ key, loaded: LOADING })
  const latest = useRef(0)
  const current = useRef({ fetcher, key })
  useLayoutEffect(() => {
    current.current = { fetcher, key }
  })

  const reload = useCallback(async () => {
    const mine = ++latest.current
    const { fetcher: fetchNow, key: asked } = current.current
    try {
      const value = await fetchNow()
      if (mine === latest.current) setHeld({ key: asked, loaded: { status: 'ready', value } })
    } catch (failure) {
      if (mine !== latest.current) return
      setHeld(was => (was.key === asked && was.loaded.status === 'ready' ? was : { key: asked, loaded: { status: 'error', failure } }))
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [key, reload])

  useEffect(() => {
    if (!every) return
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void reload()
    }, every)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void reload()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [every, reload])

  const set = useCallback((value: T) => {
    latest.current++
    setHeld({ key: current.current.key, loaded: { status: 'ready', value } })
  }, [])

  return { ...(held.key === key ? held.loaded : LOADING), reload, set }
}
