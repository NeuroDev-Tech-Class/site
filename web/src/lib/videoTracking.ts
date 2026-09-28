// Reports how much of each required YouTube video a student watches (hub: POST /tech/media/heartbeat). The hub
// decides what counts; this only says where the player is, every BEAT_MS while playing and once on pause or end.
import { useEffect, type RefObject } from 'react'
import { sendHeartbeat } from './api'

const BEAT_MS = 10_000
const API_SRC = 'https://www.youtube.com/iframe_api'
const EMBED = /^https:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{6,20})(?:[?#]|$)/

interface Player {
  getCurrentTime(): number
  getDuration(): number
}

interface YouTubeApi {
  Player: new (id: string, options: { events: { onStateChange: (event: { data: number }) => void } }) => Player
  PlayerState: { ENDED: number, PLAYING: number, PAUSED: number }
}

type YouTubeWindow = Window & { YT?: YouTubeApi, onYouTubeIframeAPIReady?: () => void }

let loading: Promise<YouTubeApi> | null = null

export function videoIdOf(src: string): string | null {
  return src.match(EMBED)?.[1] ?? null
}

/** The documented embed address the player API can drive: youtube.com, enablejsapi=1 and this page's origin */
export function trackableSrc(src: string, origin: string): string | null {
  const id = videoIdOf(src)
  return id ? `https://www.youtube.com/embed/${id}?enablejsapi=1&origin=${encodeURIComponent(origin)}` : null
}

function loadYouTubeApi(): Promise<YouTubeApi> {
  const win = window as YouTubeWindow
  if (win.YT?.Player) return Promise.resolve(win.YT)
  loading ??= new Promise(resolve => {
    const previous = win.onYouTubeIframeAPIReady
    win.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolve(win.YT as YouTubeApi)
    }
    if (!document.querySelector(`script[src="${API_SRC}"]`)) {
      const script = document.createElement('script')
      script.src = API_SRC
      script.async = true
      document.head.appendChild(script)
    }
  })
  return loading
}

/**
 * Tracks every YouTube frame inside `root` whose video is in `videoIds`, reporting it against `itemId`.
 * `onPercent` hears the hub's watched percent after each report; pass a stable function (useCallback).
 */
export function useVideoTracking(
  root: RefObject<HTMLElement | null>,
  itemId: string,
  videoIds: string[],
  enabled: boolean,
  onPercent: (videoId: string, percent: number) => void,
): void {
  const key = videoIds.join(' ')

  useEffect(() => {
    const container = root.current
    if (!enabled || !container) return
    const wanted = key.split(' ')
    const frames = [...container.querySelectorAll('iframe')].filter(frame => wanted.includes(videoIdOf(frame.src) ?? ''))
    if (!frames.length) return

    let stopped = false
    const timers: ReturnType<typeof setInterval>[] = []
    frames.forEach((frame, index) => {
      frame.id ||= `video-${itemId}-${index}`
      const src = trackableSrc(frame.src, window.location.origin)
      if (src && frame.src !== src) frame.src = src
    })

    void loadYouTubeApi().then(YT => {
      if (stopped) return
      for (const frame of frames) {
        const videoId = videoIdOf(frame.src) as string
        let timer: ReturnType<typeof setInterval> | undefined
        const player: Player = new YT.Player(frame.id, {
          events: {
            onStateChange: ({ data }) => {
              const beat = () => {
                const duration = player.getDuration()
                if (stopped || !(duration > 0)) return
                sendHeartbeat({ item_id: itemId, video_id: videoId, position_s: player.getCurrentTime(), duration_s: duration })
                  .then(result => { if (!stopped) onPercent(result.video_id, result.percent) }, () => undefined)
              }
              clearInterval(timer)
              if (data === YT.PlayerState.PLAYING) {
                beat()
                timer = setInterval(beat, BEAT_MS)
                timers.push(timer)
              } else if (data === YT.PlayerState.PAUSED || data === YT.PlayerState.ENDED) {
                beat()
              }
            },
          },
        })
      }
    })

    return () => {
      stopped = true
      timers.forEach(clearInterval)
    }
  }, [root, enabled, itemId, key, onPercent])
}
