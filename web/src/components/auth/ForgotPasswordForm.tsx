import { useState } from 'react'
import { forgotPassword } from '../../lib/api'
import { ErrorSummary, Field, Notice, SubmitButton, emailProblems, useAuthForm } from './form'

export default function ForgotPasswordForm() {
  const form = useAuthForm({ email: '' })
  const [sent, setSent] = useState(false)

  const onSubmit = form.submit(
    values => emailProblems(values.email, 'email'),
    async values => {
      await forgotPassword(values.email.trim())
      setSent(true)
    },
  )

  if (sent) {
    return (
      <>
        <Notice>
          If there's an account for that email, a reset link is on its way. It works for 30 minutes; check your spam
          folder if it doesn't arrive.
        </Notice>
        <p><a href="/sign-in">Back to sign in</a></p>
      </>
    )
  }
  return (
    <>
      <ErrorSummary problems={form.problems} />
      <p>Enter the email you use for Tech Class and we'll send you a link to choose a new password.</p>
      <form noValidate onSubmit={onSubmit}>
        <Field id="email" label="Email" type="email" autoComplete="email" value={form.values.email}
          onChange={form.set('email')} problems={form.problems} />
        <SubmitButton busy={form.busy}>Send reset link</SubmitButton>
      </form>
      <p className="mt-8 text-center"><a href="/sign-in">Back to sign in</a></p>
    </>
  )
}
