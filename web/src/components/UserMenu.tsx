import { useEffect, useId, useRef, useState } from 'react'
import type { TechAccount } from '../lib/api'
import { fullName, isStaff } from '../lib/format'
import { safeNext } from '../lib/redirect'
import { signOut, useSession } from '../lib/session'

const STATUS_WORDS: Partial<Record<TechAccount['status'], string>> = {
  pending: 'Waiting for approval',
  declined: 'Not approved',
  deactivated: 'Account turned off',
}

const onHeader = 'btn border border-(--header-text)/40 text-(--header-text) hover:bg-(--header-text)/10'

function signInHref(): string {
  const here = safeNext(`?next=${encodeURIComponent(window.location.pathname + window.location.search)}`)
  return here === '/' ? '/sign-in' : `/sign-in?next=${encodeURIComponent(here)}`
}

function AccountMenu({ account }: { account: TechAccount }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const name = fullName(account) || account.email
  const statusWords = STATUS_WORDS[account.status]

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      button.current?.focus()
    }
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        className={onHeader}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-brand-cyan font-heading text-sm font-bold text-brand-blue">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="max-w-[12rem] truncate">{name}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
          <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
        </svg>
      </button>
      {open && (
        <div id={panelId} className="panel absolute right-0 z-20 mt-2 w-72 p-4 text-left text-(--text) shadow-lg">
          <p className="font-semibold">{name}</p>
          <p className="truncate text-sm text-(--muted)">{account.email}</p>
          {statusWords && <p className="mt-2 text-sm font-semibold">{statusWords}</p>}
          <ul className="mt-3 flex flex-col gap-1 border-t border-(--border) pt-3">
            {account.status === 'approved' && (
              <li><a className="btn w-full justify-start hover:bg-(--page)" href="/my-courses">My courses</a></li>
            )}
            {account.status === 'approved' && isStaff(account) && (
              <li><a className="btn w-full justify-start hover:bg-(--page)" href="/admin">Dashboard</a></li>
            )}
            <li>
              <button type="button" className="btn w-full justify-start hover:bg-(--page)" onClick={() => void signOut()}>
                Sign out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default function UserMenu() {
  const session = useSession()

  if (session.status === 'loading') return <div className="h-11" aria-hidden="true" />
  if (session.status === 'signed-in') return <AccountMenu account={session.account} />
  return (
    <div className="flex gap-2">
      <a className={onHeader} href={signInHref()}>Sign in</a>
      <a className={onHeader} href="/register">Register</a>
    </div>
  )
}
