import { navigate } from 'astro:transitions/client'
import { useState } from 'react'
import { resetPassword } from '../../lib/api'
import { ErrorSummary, Field, MIN_PASSWORD, SubmitButton, newPasswordProblems, useAuthForm } from './form'

const newLink = <a className="text-inherit" href="/forgot-password">Ask for a new link</a>

// Also where an invited admin sets their first password; the hub emails both links here
export default function ResetPasswordForm() {
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') ?? '')
  const form = useAuthForm({ password: '', confirm: '' })

  const onSubmit = form.submit(
    values => newPasswordProblems(values.password, values.confirm, 'password', 'confirm'),
    async values => {
      await resetPassword(token, values.password)
      await navigate('/sign-in?reset=1')
    },
    error => error.status === 400 ? [{ message: <>{error.message} {newLink}</> }] : null,
  )

  if (!token) {
    return <p>This link is missing part of its address. Try the link in your email again, or {newLink}.</p>
  }
  return (
    <>
      <ErrorSummary problems={form.problems} />
      <form noValidate onSubmit={onSubmit}>
        <Field id="password" label="New password" type="password" autoComplete="new-password"
          hint={`At least ${MIN_PASSWORD} characters`} value={form.values.password}
          onChange={form.set('password')} problems={form.problems} />
        <Field id="confirm" label="Confirm password" type="password" autoComplete="new-password"
          value={form.values.confirm} onChange={form.set('confirm')} problems={form.problems} />
        <SubmitButton busy={form.busy}>Save password</SubmitButton>
      </form>
    </>
  )
}
