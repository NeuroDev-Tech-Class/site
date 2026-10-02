import { useId, useState } from 'react'
import { getInbox, getUnreadCount, markAllRead, markNoteRead, type InboxNote } from '../lib/adminApi'
import { timeAgo } from '../lib/format'
import { useSession } from '../lib/session'
import { useLoad } from '../lib/useLoad'
import { usePopover } from '../lib/usePopover'
import Icon from './Icon'
import { ListBones, Skeleton } from './Skeleton'

// The hub's notes on work graded or returned, approvals, and (for coaches) new work and sign-ups
const REFRESH_MS = 30_000
const onHeader = 'btn relative border border-(--header-text)/40 text-(--header-text) hover:bg-(--header-text)/10'

function Panel({ id, onChanged, onClose }: { id: string, onChanged: () => void, onClose: () => void }) {
  const inbox = useLoad(() => getInbox(), [])
  const [problem, setProblem] = useState<string | null>(null)

  // A note often leads somewhere on this same page (the dashboard), so the list closes as it opens
  async function read(note: InboxNote) {
    onClose()
    if (note.read) return
    await markNoteRead(note.id).catch(() => undefined)
    onChanged()
  }

  async function readAll() {
    setProblem(null)
    try {
      await markAllRead()
      await inbox.reload()
      onChanged()
    } catch {
      setProblem("Couldn't mark them read. Please try again.")
    }
  }

  const notes = inbox.status === 'ready' ? inbox.value.items : []
  return (
    <div id={id} className="absolute right-0 z-20 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-lg border border-(--border) bg-(--panel) p-2 text-(--text) shadow-lg">
      <div className="flex items-center justify-between gap-2 px-2 py-1">
        <p className="mt-0 font-heading font-semibold">Notifications</p>
        {notes.some(n => !n.read) && (
          <button type="button" className="btn-quiet text-sm" onClick={() => void readAll()}>Mark all read</button>
        )}
      </div>
      {problem && <p role="alert" className="px-2 text-sm font-semibold text-red-700 dark:text-red-300">{problem}</p>}
      {inbox.status === 'loading' && <Skeleton label="Loading notifications"><ListBones count={3} compact /></Skeleton>}
      {inbox.status === 'error' && <p className="px-2">Couldn't load your notifications. Please try again.</p>}
      {inbox.status === 'ready' && (notes.length
        ? (
            <ul aria-label="Notifications" className="flex max-h-[70vh] list-none flex-col overflow-y-auto pl-0">
              {notes.map(note => (
                <li key={note.id} className="mt-0">
                  <a href={note.link} onClick={() => void read(note)}
                    className={`block rounded-lg px-2 py-2 text-(--text) no-underline hover:bg-(--page) ${note.read ? '' : 'border-l-4 border-(--brand-accent)'}`}>
                    {!note.read && <span className="sr-only">Unread: </span>}
                    <span className={`block ${note.read ? '' : 'font-semibold'}`}>{note.title}</span>
                    <span className="block text-sm">{note.body}</span>
                    <span className="block text-xs text-(--muted)">{timeAgo(note.created_at)}</span>
                  </a>
                </li>
              ))}
            </ul>
          )
        : <p className="px-2 py-2">No notifications yet.</p>)}
    </div>
  )
}

function Bell() {
  const { open, setOpen, root, button } = usePopover()
  const panelId = useId()
  const unread = useLoad(getUnreadCount, [], { every: REFRESH_MS })
  const count = unread.status === 'ready' ? unread.value.count : 0

  return (
    <div ref={root} className="relative">
      <button ref={button} type="button" className={onHeader} aria-expanded={open} aria-controls={panelId}
        aria-label={count ? `Notifications, ${count} unread` : 'Notifications'} onClick={() => setOpen(!open)}>
        <Icon name="bell" size={20} />
        {count > 0 && (
          <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 grid min-w-5 place-items-center rounded-full bg-brand-gold px-1 text-xs font-bold text-brand-blue">
            {count}
          </span>
        )}
      </button>
      {open && <Panel id={panelId} onChanged={() => void unread.reload()} onClose={() => setOpen(false)} />}
    </div>
  )
}

/** For approved accounts only: the hub keeps notes for them alone */
export default function NotificationBell() {
  const session = useSession()
  if (session.status !== 'signed-in' || session.account.status !== 'approved') return null
  return <Bell />
}
