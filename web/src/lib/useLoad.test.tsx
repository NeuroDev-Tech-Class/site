import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { useLoad } from './useLoad'

let visibility: DocumentVisibilityState = 'visible'

beforeEach(() => {
  visibility = 'visible'
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility)
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

function setVisible(state: DocumentVisibilityState) {
  visibility = state
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('useLoad', () => {
  test('loads, then says what came back', async () => {
    const { result } = renderHook(() => useLoad(() => Promise.resolve(3), []))
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current).toMatchObject({ status: 'ready', value: 3 }))
  })

  test("a failure says so with the hub's message", async () => {
    const { result } = renderHook(() => useLoad(() => Promise.reject(new Error('boom')), []))
    await waitFor(() => expect(result.current.status).toBe('error'))
  })

  test('reloading keeps showing the last answer until the new one arrives, and keeps it if the reload fails', async () => {
    let answer: Promise<number> = Promise.resolve(1)
    const { result } = renderHook(() => useLoad(() => answer, []))
    await waitFor(() => expect(result.current).toMatchObject({ status: 'ready', value: 1 }))
    let finish!: (n: number) => void
    answer = new Promise(resolve => { finish = resolve })
    act(() => { void result.current.reload() })
    expect(result.current).toMatchObject({ status: 'ready', value: 1 })
    await act(async () => finish(2))
    expect(result.current).toMatchObject({ status: 'ready', value: 2 })
    answer = Promise.reject(new Error('offline'))
    await act(() => result.current.reload())
    expect(result.current).toMatchObject({ status: 'ready', value: 2 })
  })

  test('an answer that arrives after a newer request is ignored', async () => {
    const pending: ((n: number) => void)[] = []
    const { result, rerender } = renderHook(({ key }) => useLoad(() => new Promise<number>(r => { pending.push(r) }), [key]),
      { initialProps: { key: 'a' } })
    rerender({ key: 'b' })
    await act(async () => pending[1](2))
    await act(async () => pending[0](1))
    expect(result.current).toMatchObject({ status: 'ready', value: 2 })
  })

  test('set replaces the value straight away, as after a change the coach made', async () => {
    const { result } = renderHook(() => useLoad(() => Promise.resolve(1), []))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    act(() => result.current.set(5))
    expect(result.current).toMatchObject({ status: 'ready', value: 5 })
  })

  test('refreshes on its interval only while the tab is visible, and as soon as the tab comes back', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn(() => Promise.resolve(1))
    renderHook(() => useLoad(fetcher, [], { every: 30_000 }))
    await act(async () => { await vi.advanceTimersByTimeAsync(0) })
    expect(fetcher).toHaveBeenCalledTimes(1)
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000) })
    expect(fetcher).toHaveBeenCalledTimes(2)
    act(() => setVisible('hidden'))
    await act(async () => { await vi.advanceTimersByTimeAsync(90_000) })
    expect(fetcher).toHaveBeenCalledTimes(2)
    await act(async () => { setVisible('visible'); await vi.advanceTimersByTimeAsync(0) })
    expect(fetcher).toHaveBeenCalledTimes(3)
  })

  test('stops refreshing once nothing shows it', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn(() => Promise.resolve(1))
    const { unmount } = renderHook(() => useLoad(fetcher, [], { every: 30_000 }))
    await act(async () => { await vi.advanceTimersByTimeAsync(0) })
    unmount()
    await act(async () => { await vi.advanceTimersByTimeAsync(120_000) })
    setVisible('visible')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
