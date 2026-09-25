import { navigate } from 'astro:transitions/client'
import { useEffect, useRef, useState } from 'react'
import { resendCode, verifyEmail } from '../../lib/api'
import { afterSignIn, safeNext } from '../../lib/redirect'
import { setAccount } from '../../lib/session'
import { ErrorSummary, Field, Notice, SubmitButton, emailProblems, useAuthForm } from './form'

// Matches the hub's one-code-a-minute cooldown
const RESEND_WAIT_MS = 60_000

export default function VerifyForm() {
  const [linkEmail] = useState(() => new URLSearchParams(window.location.search).get('email')?.trim() ?? '')
  const next = safeNext(window.location.search)
  const form = useAuthForm({ email: linkEmail, code: '' })
  const [resent, setResent] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const onSubmit = form.submit(
    values => [
      ...(linkEmail ? [] : emailProblems(values.email, 'email')),
      ...(/^\d{6}$/.test(values.code.replace(/\s/g, '')) ? [] : [{ field: 'code', message: 'Enter the 6-digit code from the email.' }]),
    ],
    async values => {
      const account = await verifyEmail(values.email.trim(), values.code.replace(/\s/g, ''))
      setAccount(account)
      await navigate(afterSignIn(account, next))
    },
  )

  async function onResend() {
    const problems = emailProblems(form.values.email, 'email')
    form.setProblems(problems)
    if (problems.length) return
    setWaiting(true)
    try {
      await resendCode(form.values.email.trim())
      setResent(true)
      timer.current = setTimeout(() => setWaiting(false), RESEND_WAIT_MS)
    } catch (error) {
      setWaiting(false)
      form.setProblems([{ message: error instanceof Error ? error.message : 'Something went wrong. Please try again.' }])
    }
  }

  return (
    <>
      {resent && !form.problems.length && (
        <Notice>A new code is on its way. If it doesn't arrive, check your spam folder. You can ask for another in a minute.</Notice>
      )}
      <ErrorSummary problems={form.problems} />
      {linkEmail
        ? <p>We sent a 6-digit code to <strong>{linkEmail}</strong>. It works for 10 minutes.</p>
        : <p>Enter the email you registered with and the 6-digit code we sent to it.</p>}
      <form noValidate onSubmit={onSubmit}>
        {!linkEmail && (
          <Field id="email" label="Email" type="email" autoComplete="email" value={form.values.email}
            onChange={form.set('email')} problems={form.problems} />
        )}
        <Field id="code" label="Code" inputMode="numeric" autoComplete="one-time-code" maxLength={7}
          className="field mt-2 max-w-[12rem] text-center font-mono text-2xl tracking-[0.3em]"
          value={form.values.code} onChange={form.set('code')} problems={form.problems} />
        <SubmitButton busy={form.busy}>Confirm email</SubmitButton>
      </form>
      <button type="button" className="btn-quiet mt-4 w-full" disabled={waiting} onClick={() => void onResend()}>
        Send a new code
      </button>
    </>
  )
}
