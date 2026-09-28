import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import type { Mock } from 'vitest'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { ItemContent } from './api'
import type { ItemPageView } from './content'
import { fakeFetch, fakeHub, json } from '../test/fake-hub'
import { trackableSrc, videoIdOf } from './videoTracking'

vi.mock('astro:transitions/client', () => ({ navigate: vi.fn() }))

const STATE = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 }

class FakePlayer {
  static all: FakePlayer[] = []
  time = 0
  duration = 100
  constructor(public elementId: string, public options: { events: { onStateChange: (e: { data: number }) => void } }) {
    FakePlayer.all.push(this)
  }
  getCurrentTime() { return this.time }
  getDuration() { return this.duration }
  emit(state: number) { this.options.events.onStateChange({ data: state }) }
}

const PAGE = (id: string, type: ItemPageView['type']): ItemPageView => ({
  id, type, label: type, title: 'Watch this', course: { id: 'gimp', heading: 'GIMP', category: 'media' },
  unit: { id: 'u_1', title: 'Basics' }, next: null,
})

let fetchMock: Mock
let beats: { item_id: string, video_id: string, position_s: number, duration_s: number }[]
let failBeats = false

function hub(item: { id: string, type: string, content: ItemContent['content'], videos: string[] }) {
  beats = []
  const percent: Record<string, number> = Object.fromEntries(item.videos.map(v => [v, 0]))
  fakeHub(fetchMock, {}, {
    [`/api/v1/tech/items/${item.id}`]: () => json(200, {
      id: item.id, type: item.type, title: 'Watch this', status: 'ok', tags: [],
      course: { id: 'gimp', title: 'GIMP' }, unit: { id: 'u_1', title: 'Basics' }, content: item.content,
    }),
    [`/api/v1/tech/items/${item.id}/progress`]: () => json(200, {
      item_id: item.id, status: null, done_at: null, opened_at: 'x',
      videos: item.videos.map(v => ({ video_id: v, percent: percent[v] })),
    }),
    '/api/v1/tech/media/heartbeat': ({ body }) => {
      if (failBeats) return json(500, { detail: 'down' })
      const beat = body as (typeof beats)[number]
      beats.push(beat)
      percent[beat.video_id] = Math.floor((beat.position_s / beat.duration_s) * 100)
      return json(200, { video_id: beat.video_id, percent: percent[beat.video_id], counted: true })
    },
  })
}

async function renderItem(page: ItemPageView) {
  const { default: LearnItem } = await import('../components/learn/LearnItem')
  return render(<LearnItem page={page} />)
}

const player = async (index = 0) => waitFor(() => {
  const found = FakePlayer.all[index]
  if (!found) throw new Error('no player yet')
  return found
})
const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))

beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers({ shouldAdvanceTime: true })
  fetchMock = fakeFetch()
  FakePlayer.all = []
  failBeats = false
  vi.stubGlobal('YT', { Player: FakePlayer, PlayerState: STATE })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  document.head.querySelectorAll('script[src*="youtube.com/iframe_api"]').forEach(s => s.remove())
})

describe('the address a tracked player needs', () => {
  test.each([
    ['https://www.youtube.com/embed/abc123', 'abc123'],
    ['https://www.youtube-nocookie.com/embed/abc123?start=5', 'abc123'],
    ['https://youtube.com/embed/abc_12-3', 'abc_12-3'],
    ['https://evil.example/embed/abc123', null],
    ['https://www.youtube.com/watch?v=abc123', null],
  ])('%s is video %s', (src, id) => {
    expect(videoIdOf(src)).toBe(id)
  })

  test('turns on the player API for this page, and nothing else', () => {
    expect(trackableSrc('https://www.youtube-nocookie.com/embed/abc123?start=5', 'https://tech.example'))
      .toBe('https://www.youtube.com/embed/abc123?enablejsapi=1&origin=https%3A%2F%2Ftech.example')
    expect(trackableSrc('https://evil.example/embed/abc123', 'https://tech.example')).toBeNull()
  })
})

describe('a video item', () => {
  beforeEach(() => hub({ id: 'i_v', type: 'video', content: { youtube_id: 'abc123' }, videos: ['abc123'] }))

  test('plays through the player API and reports every 10 seconds while playing', async () => {
    await renderItem(PAGE('i_v', 'video'))
    const p = await player()
    const frame = document.getElementById(p.elementId) as HTMLIFrameElement
    expect(frame.src).toBe(`https://www.youtube.com/embed/abc123?enablejsapi=1&origin=${encodeURIComponent(location.origin)}`)

    p.emit(STATE.PLAYING)
    await waitFor(() => expect(beats).toHaveLength(1))
    p.time = 10
    await advance(10_000)
    p.time = 20
    await advance(10_000)
    expect(beats.map(b => [b.item_id, b.video_id, b.position_s, b.duration_s])).toEqual([
      ['i_v', 'abc123', 0, 100], ['i_v', 'abc123', 10, 100], ['i_v', 'abc123', 20, 100],
    ])
  })

  test('pausing reports once more and then stops', async () => {
    await renderItem(PAGE('i_v', 'video'))
    const p = await player()
    p.emit(STATE.PLAYING)
    await waitFor(() => expect(beats).toHaveLength(1))
    p.time = 7
    p.emit(STATE.PAUSED)
    await waitFor(() => expect(beats).toHaveLength(2))
    await advance(30_000)
    expect(beats.map(b => b.position_s)).toEqual([0, 7])
  })

  test('the percent climbs as they watch, and Mark complete turns on at 90%', async () => {
    await renderItem(PAGE('i_v', 'video'))
    expect(await screen.findByText('Watch the video to finish (0% watched).')).toBeTruthy()
    const p = await player()
    p.emit(STATE.PLAYING)
    p.time = 50
    await advance(10_000)
    expect(await screen.findByText('Watch the video to finish (50% watched).')).toBeTruthy()
    p.time = 92
    p.emit(STATE.ENDED)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Mark complete' }).hasAttribute('disabled')).toBe(false))
    expect(screen.queryByText(/Watch the video/)).toBeNull()
  })

  test('a failed report is shrugged off and the next one still goes', async () => {
    await renderItem(PAGE('i_v', 'video'))
    const p = await player()
    failBeats = true
    p.emit(STATE.PLAYING)
    await advance(10_000)
    failBeats = false
    p.time = 20
    await advance(10_000)
    await waitFor(() => expect(beats.map(b => b.position_s)).toEqual([20]))
  })

  test('before the player knows the length, nothing is reported', async () => {
    await renderItem(PAGE('i_v', 'video'))
    const p = await player()
    p.duration = 0
    p.emit(STATE.PLAYING)
    await advance(10_000)
    expect(beats).toEqual([])
  })

  test('leaving the page stops the reports', async () => {
    const view = await renderItem(PAGE('i_v', 'video'))
    const p = await player()
    p.emit(STATE.PLAYING)
    await waitFor(() => expect(beats).toHaveLength(1))
    view.unmount()
    await advance(30_000)
    expect(beats).toHaveLength(1)
  })
})

describe('videos inside a reading', () => {
  test('each required one is tracked against the reading; others in the text are left alone', async () => {
    hub({
      id: 'i_r', type: 'lesson', videos: ['vid456'], content: {
        title: 'Cables', subtitle: null, youtube_ids: ['vid456'],
        html: '<p>Watch:</p><div class="video-embed"><iframe src="https://www.youtube.com/embed/vid456" title="Ports"></iframe></div>'
          + '<iframe src="https://www.youtube.com/embed/extra99" title="Extra"></iframe>',
      },
    })
    await renderItem(PAGE('i_r', 'lesson'))
    const p = await player()
    expect(FakePlayer.all).toHaveLength(1)
    expect((screen.getByTitle('Ports') as HTMLIFrameElement).src).toContain('enablejsapi=1')
    expect((screen.getByTitle('Extra') as HTMLIFrameElement).src).toBe('https://www.youtube.com/embed/extra99')
    p.emit(STATE.PLAYING)
    await waitFor(() => expect(beats[0]).toMatchObject({ item_id: 'i_r', video_id: 'vid456' }))
  })
})

test('the YouTube script is added once, however many players the page has', async () => {
  vi.stubGlobal('YT', undefined)
  hub({ id: 'i_v', type: 'video', content: { youtube_id: 'abc123' }, videos: ['abc123'] })
  await renderItem(PAGE('i_v', 'video'))
  await waitFor(() => expect(document.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]')).toHaveLength(1))
  vi.stubGlobal('YT', { Player: FakePlayer, PlayerState: STATE })
  ;(window as unknown as { onYouTubeIframeAPIReady: () => void }).onYouTubeIframeAPIReady()
  await player()
  expect(document.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]')).toHaveLength(1)
})
