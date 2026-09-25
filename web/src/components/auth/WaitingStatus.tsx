import { navigate } from 'astro:transitions/client'
import { useEffect } from 'react'
import { safeNext } from '../../lib/redirect'
import { signOut, useSession } from '../../lib/session'

export default function WaitingStatus() {
  const session = useSession()
  const approved = session.status === 'signed-in' && session.account.status === 'approved'

  useEffect(() => {
    if (approved) void navigate(safeNext(window.location.search), { history: 'replace' })
  }, [approved])

  async function leave() {
    await signOut()
    await navigate('/')
  }

  if (session.status === 'loading' || approved) return <p>Checking your account…</p>
  if (session.status === 'signed-out') {
    return <p>You're not signed in. <a href="/sign-in">Sign in</a> to see your account.</p>
  }
  return (
    <>
      {session.account.status === 'pending'
        ? (
          <>
            <p>Thanks for signing up! Your account is waiting for your tech coach to approve it.</p>
            <p>You'll get an email as soon as it's approved, and then you can start any course.</p>
          </>
        )
        : <p>Your account wasn't approved. If you think that's a mistake, please talk to your tech coach.</p>}
      <button type="button" className="btn-quiet mt-6" onClick={() => void leave()}>Sign out</button>
    </>
  )
}
