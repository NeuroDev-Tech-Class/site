import { navigate } from 'astro:transitions/client'
import { useState } from 'react'
import { googleSignInUrl, login } from '../../lib/api'
import { afterSignIn, safeNext, waitingPage } from '../../lib/redirect'
import { setAccount } from '../../lib/session'
import { ErrorSummary, Field, Notice, SubmitButton, emailProblems, required, useAuthForm } from './form'

const LINK_ERRORS: Record<string, string> = {
  google: "Google sign-in didn't work. Please try again, or sign in with your email and password.",
  config: "Google sign-in isn't set up yet. Please sign in with your email and password.",
  deactivated: 'This account has been deactivated. Please talk to your coach.',
}

export default function SignInForm() {
  const [params] = useState(() => new URLSearchParams(window.location.search))
  const next = safeNext(window.location.search)
  const linkError = LINK_ERRORS[params.get('error') ?? '']
  const form = useAuthForm({ email: '', password: '' }, linkError ? [{ message: linkError }] : [])

  const onSubmit = form.submit(
    values => [...emailProblems(values.email, 'email'), ...required(values.password, 'password', 'Enter your password.')],
    async values => {
      const account = await login(values.email.trim(), values.password)
      setAccount(account)
      await navigate(afterSignIn(account, next))
    },
    error => error.status === 403 && error.message === 'email_not_verified'
      ? [{
          message: (
            <>
              Please confirm your email before signing in.{' '}
              <a className="text-inherit" href={`/verify?email=${encodeURIComponent(form.values.email.trim())}`}>
                Enter your code
              </a>
            </>
          ),
        }]
      : null,
  )

  return (
    <>
      {params.get('reset') === '1' && !form.problems.length && (
        <Notice>Your password has been changed. Sign in with your new one.</Notice>
      )}
      <ErrorSummary problems={form.problems} />
      <form noValidate onSubmit={onSubmit}>
        <Field id="email" label="Email" type="email" autoComplete="email" value={form.values.email}
          onChange={form.set('email')} problems={form.problems} />
        <Field id="password" label="Password" type="password" autoComplete="current-password"
          value={form.values.password} onChange={form.set('password')} problems={form.problems} />
        <p className="mt-3 text-sm"><a href="/forgot-password">Forgot your password?</a></p>
        <SubmitButton busy={form.busy}>Sign in</SubmitButton>
      </form>
      <p className="mt-6 text-center text-(--muted)">or</p>
      <a className="btn-quiet mt-4 w-full" href={googleSignInUrl(waitingPage(next))}>Sign in with Google</a>
      <p className="mt-8 text-center">
        New here? <a href={next === '/' ? '/register' : `/register?next=${encodeURIComponent(next)}`}>Create an account</a>
      </p>
    </>
  )
}
