import { navigate } from 'astro:transitions/client'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ApiError,
  completeItem,
  getItem,
  getItemProgress,
  openItem,
  uncompleteItem,
  type CheckpointContent,
  type ItemContent,
  type ItemProgress,
  type VideoProgress,
} from '../../lib/api'
import { slidesEmbedUrl, type ItemPageView } from '../../lib/content'
import { useSession } from '../../lib/session'
import { trackableSrc, useVideoTracking } from '../../lib/videoTracking'
import Icon from '../Icon'
import NotApproved from '../NotApproved'
import Checkpoint from './Checkpoint'

// Mirrors the hub's REQUIRED_PERCENT and its refusal wording (app/tech/watch.py, progress.py)
const REQUIRED_PERCENT = 90

type Load =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error' }
  | { status: 'ready', item: ItemContent, progress: ItemProgress }

function watchMessage(videos: VideoProgress[]): string | null {
  const behind = videos.filter(v => v.percent < REQUIRED_PERCENT).map(v => v.percent)
  if (!behind.length) return null
  return videos.length === 1
    ? `Watch the video to finish (${behind[0]}% watched).`
    : `Watch every video to finish (the least watched is at ${Math.min(...behind)}%).`
}

function siteName(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function Content({ page, item }: { page: ItemPageView, item: ItemContent }) {
  if (item.type === 'checkpoint') return <Checkpoint page={page} content={item.content as unknown as CheckpointContent} />
  const content = item.content as Record<string, string | undefined>
  if (item.type === 'lesson') {
    return (
      <>
        {content.subtitle && <p className="mt-0 text-lg text-(--muted)">{content.subtitle}</p>}
        <div className="lesson mt-8" dangerouslySetInnerHTML={{ __html: content.html ?? '' }} />
      </>
    )
  }
  if (item.type === 'video') {
    return (
      <div className="overflow-hidden rounded-lg border border-(--border)">
        <iframe
          title={page.title}
          src={trackableSrc(`https://www.youtube.com/embed/${content.youtube_id}`, window.location.origin) ?? undefined}
          className="block aspect-video w-full border-0"
          allow="encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    )
  }
  if (item.type === 'slides') {
    const url = content.slides_url ?? ''
    const embed = slidesEmbedUrl(url)
    return (
      <>
        {embed && (
          <div className="overflow-hidden rounded-lg border border-(--border)">
            <iframe title={page.title} src={embed} className="block aspect-video w-full border-0" allowFullScreen />
          </div>
        )}
        <p className="text-sm">
          Slides not showing? <a href={url} target="_blank" rel="noopener noreferrer">Open the slides in a new tab</a>
        </p>
      </>
    )
  }
  const url = content.url ?? ''
  const site = siteName(url)
  return (
    <div className="panel flex flex-col gap-3">
      <p className="mt-0">This one lives on another website. It opens in a new tab; come back here when you're done.</p>
      {site && <p className="mt-0 text-sm font-semibold text-(--muted)">{site}</p>}
      <a className="btn-primary self-start" href={url} target="_blank" rel="noopener noreferrer">
        Open {page.title} <Icon name="link" size={18} />
      </a>
    </div>
  )
}

type Step = NonNullable<ItemPageView['next']>

function StepLink({ step, back = false, primary = false }: { step: Step, back?: boolean, primary?: boolean }) {
  return (
    <a
      href={step.href}
      title={step.text}
      className={`${primary ? 'btn-primary' : 'inline-flex min-h-[44px] items-center gap-2 font-semibold'} max-w-full min-w-0`}
    >
      {back && <Icon name="back" size={18} className="shrink-0" />}
      <span className="truncate">{back ? 'Previous' : 'Next'}: {step.text}</span>
      {!back && <Icon name="arrow" size={18} className="shrink-0" />}
    </a>
  )
}

/** Marking the item done: done and on to the next item, or back to the course from the last one */
function Actions({ page, load, onChange }: { page: ItemPageView, load: Load, onChange: (p: ItemProgress) => void }) {
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  if (load.status !== 'ready') return null
  const { progress } = load
  const waiting = watchMessage(progress.videos)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setProblem(null)
    try {
      await action()
    } catch (error) {
      setProblem(error instanceof ApiError ? error.message : "Couldn't save that. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  const notes = (
    <>
      {progress.status !== 'done' && waiting && <p id="watch-needed" className="mt-0 text-center text-sm text-(--muted)">{waiting}</p>}
      {problem && <p role="alert" className="mt-0 text-center text-sm font-semibold">{problem}</p>}
    </>
  )
  if (progress.status === 'done') {
    return (
      <>
        <div className="flex items-center gap-3">
          <span className="done-chip"><Icon name="check" size={16} /> Done</span>
          <button type="button" className="btn-quiet" disabled={busy} onClick={() => void run(async () => onChange(await uncompleteItem(page.id)))}>
            Mark not done
          </button>
        </div>
        {notes}
      </>
    )
  }
  return (
    <>
      <button
        type="button"
        className="btn-primary"
        disabled={busy || waiting !== null}
        aria-describedby={waiting ? 'watch-needed' : undefined}
        onClick={() => void run(async () => {
          await completeItem(page.id)
          await navigate(page.next ? page.next.href : `/courses/${page.course.id}?done=${page.id}`)
        })}
      >
        {page.next ? 'Mark complete and continue' : 'Mark complete and finish'}
        <Icon name="arrow" size={18} />
      </button>
      {notes}
    </>
  )
}

export default function LearnItem({ page }: { page: ItemPageView }) {
  const session = useSession()
  const approved = session.status === 'signed-in' && session.account.status === 'approved'
  const [load, setLoad] = useState<Load>({ status: 'loading' })

  useEffect(() => {
    if (!approved) return
    let current = true
    Promise.all([getItem(page.id), getItemProgress(page.id)]).then(
      ([item, progress]) => {
        if (!current) return
        setLoad({ status: 'ready', item, progress })
        if (!progress.opened_at) void openItem(page.id).catch(() => undefined)
      },
      error => current && setLoad({ status: error instanceof ApiError && error.status === 404 ? 'missing' : 'error' }),
    )
    return () => { current = false }
  }, [approved, page.id])

  const setProgress = (progress: ItemProgress) =>
    setLoad(state => state.status === 'ready' ? { ...state, progress } : state)

  const contentRef = useRef<HTMLDivElement>(null)
  const onPercent = useCallback((videoId: string, percent: number) => setLoad(state => {
    if (state.status !== 'ready') return state
    const videos = state.progress.videos.map(v => v.video_id === videoId ? { ...v, percent: Math.max(v.percent, percent) } : v)
    return { ...state, progress: { ...state.progress, videos } }
  }), [])
  const videoIds = load.status === 'ready' ? load.progress.videos.map(v => v.video_id) : []
  useVideoTracking(contentRef, page.id, videoIds, approved && load.status === 'ready', onPercent)

  // Already done: going on is the main thing to do
  const done = page.type !== 'checkpoint' && load.status === 'ready' && load.progress.status === 'done'

  let body
  if (session.status === 'loading') {
    body = <p className="text-(--muted)" aria-busy="true">Loading…</p>
  } else if (session.status === 'signed-out') {
    body = (
      <div className="panel">
        <p className="mt-0">Sign in to open this {page.label.toLowerCase()}.</p>
        <a className="btn-primary mt-4" href={`/sign-in?next=${encodeURIComponent(`/learn/${page.id}`)}`}>Sign in to open this</a>
      </div>
    )
  } else if (!approved) {
    body = <NotApproved status={session.account.status} then="You can open this once it's approved." />
  } else if (load.status === 'missing') {
    // The way back to the course is in the bar below
    body = <p className="panel mt-0">This item isn't available any more.</p>
  } else if (load.status === 'error') {
    body = <p>Couldn't load this. Reload the page to try again.</p>
  } else if (load.status === 'loading') {
    body = <p className="text-(--muted)" aria-busy="true">Loading…</p>
  } else {
    body = <Content page={page} item={load.item} />
  }

  return (
    <>
      <div ref={contentRef} className="mt-6">{body}</div>
      <nav aria-label="Course steps" className="mt-10 -mx-4 border-t border-(--border) bg-(--panel) px-4 py-4">
        {/* On a phone the main action comes first, then Previous and Next a row each, so their titles fit */}
        <div className="grid grid-cols-1 items-center gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          {page.type !== 'checkpoint' && (
            <div className="mb-1 flex flex-col items-center gap-2 sm:mb-0 sm:col-start-2 sm:row-start-1">
              <Actions page={page} load={load} onChange={setProgress} />
            </div>
          )}
          <div className="min-w-0 sm:col-start-1 sm:row-start-1">
            {page.previous && <StepLink step={page.previous} back />}
          </div>
          <div className="flex min-w-0 justify-end sm:col-start-3 sm:row-start-1">
            {page.next && <StepLink step={page.next} primary={done} />}
          </div>
        </div>
        <p className="mt-3 mb-0 text-center text-sm">
          <a href={`/courses/${page.course.id}`}>Back to {page.course.heading}</a>
        </p>
      </nav>
    </>
  )
}
