import { navigate } from 'astro:transitions/client'
import { useEffect, useState } from 'react'
import {
  ApiError,
  completeItem,
  getItem,
  getItemProgress,
  openItem,
  uncompleteItem,
  type ItemContent,
  type ItemProgress,
  type VideoProgress,
} from '../../lib/api'
import { slidesEmbedUrl, type ItemPageView } from '../../lib/content'
import { useSession } from '../../lib/session'
import Icon from '../Icon'

// Mirrors the hub's REQUIRED_PERCENT and its refusal wording (app/tech/watch.py, progress.py)
const REQUIRED_PERCENT = 90

type Load =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error' }
  | { status: 'ready', item: ItemContent, progress: ItemProgress }

export function watchMessage(videos: VideoProgress[]): string | null {
  const behind = videos.filter(v => v.percent < REQUIRED_PERCENT).map(v => v.percent)
  if (!behind.length) return null
  return videos.length === 1
    ? `Watch the video to finish (${behind[0]}% watched).`
    : `Watch every video to finish (the least watched is at ${Math.min(...behind)}%).`
}

function Content({ page, item }: { page: ItemPageView, item: ItemContent }) {
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
          src={`https://www.youtube-nocookie.com/embed/${content.youtube_id}`}
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
  return (
    <div className="panel flex flex-col gap-3">
      <p className="mt-0">This one lives on another website. It opens in a new tab; come back here when you're done.</p>
      <p className="mt-0 text-sm font-semibold text-(--muted)">{new URL(url).hostname.replace(/^www\./, '')}</p>
      <a className="btn-primary self-start" href={url} target="_blank" rel="noopener noreferrer">
        Open {page.title} <Icon name="link" size={18} />
      </a>
    </div>
  )
}

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

  if (progress.status === 'done') {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 font-heading font-semibold">
          <Icon name="check" size={20} className="text-(--accent)" /><span>Done</span>
        </span>
        <button type="button" className="btn-quiet" disabled={busy} onClick={() => void run(async () => onChange(await uncompleteItem(page.id)))}>
          Mark not done
        </button>
        {problem && <p role="alert" className="mt-0 text-sm font-semibold">{problem}</p>}
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        className="btn-primary"
        disabled={busy || waiting !== null}
        aria-describedby={waiting ? 'watch-needed' : undefined}
        onClick={() => void run(async () => {
          await completeItem(page.id)
          await navigate(`/courses/${page.course.id}?done=${page.id}`)
        })}
      >
        Mark complete
      </button>
      {waiting && <p id="watch-needed" className="mt-0 text-sm text-(--muted)">{waiting}</p>}
      {problem && <p role="alert" className="mt-0 text-sm font-semibold">{problem}</p>}
    </div>
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

  let body
  if (session.status !== 'signed-in') {
    body = (
      <div className="panel">
        <p className="mt-0">Sign in to open this {page.label.toLowerCase()}.</p>
        <a className="btn-primary mt-4" href={`/sign-in?next=${encodeURIComponent(`/learn/${page.id}`)}`}>Sign in to open this</a>
      </div>
    )
  } else if (session.account.status === 'pending') {
    body = <p>Your account is waiting for your tech coach to approve it. You can open this once it's approved.</p>
  } else if (!approved) {
    body = <p>Your account wasn't approved. Please talk to your tech coach.</p>
  } else if (load.status === 'missing') {
    body = (
      <div className="panel">
        <p className="mt-0">This item isn't available any more.</p>
        <a className="mt-4 inline-block" href={`/courses/${page.course.id}`}>Back to {page.course.heading}</a>
      </div>
    )
  } else if (load.status === 'error') {
    body = <p>Couldn't load this. Reload the page to try again.</p>
  } else if (load.status === 'loading') {
    body = <p className="text-(--muted)" aria-busy="true">Loading…</p>
  } else {
    body = <Content page={page} item={load.item} />
  }

  return (
    <>
      <div className="mt-6">{body}</div>
      <div className="sticky bottom-0 z-10 mt-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-(--border) bg-(--panel) px-4 py-3">
        <Actions page={page} load={load} onChange={setProgress} />
        {page.next && (
          <a className="ml-auto inline-flex min-h-[44px] max-w-full min-w-0 items-center gap-2 font-semibold" href={page.next.href} title={page.next.text}>
            <span className="truncate">Next: {page.next.text}</span>
            <Icon name="arrow" size={18} className="shrink-0" />
          </a>
        )}
      </div>
    </>
  )
}
