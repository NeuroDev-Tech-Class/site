import { navigate } from 'astro:transitions/client'
import { googleSignInUrl, register } from '../../lib/api'
import { safeNext, waitingPage } from '../../lib/redirect'
import { ErrorSummary, Field, MIN_PASSWORD, SubmitButton, emailProblems, newPasswordProblems, required, useAuthForm } from './form'

export default function RegisterForm() {
  const next = safeNext(window.location.search)
  const form = useAuthForm({ first: '', last: '', email: '', password: '', confirm: '' })

  const onSubmit = form.submit(
    values => [
      ...required(values.first, 'first', 'Enter your first name.'),
      ...required(values.last, 'last', 'Enter your last name.'),
      ...emailProblems(values.email, 'email'),
      ...newPasswordProblems(values.password, values.confirm, 'password', 'confirm'),
    ],
    async values => {
      const email = values.email.trim()
      await register({ first_name: values.first.trim(), last_name: values.last.trim(), email, password: values.password })
      const params = new URLSearchParams({ email, ...(next === '/' ? {} : { next }) })
      await navigate(`/verify?${params}`)
    },
  )

  return (
    <>
      <ErrorSummary problems={form.problems} />
      <form noValidate onSubmit={onSubmit}>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field id="first" label="First name" autoComplete="given-name" value={form.values.first}
            onChange={form.set('first')} problems={form.problems} />
          <Field id="last" label="Last name" autoComplete="family-name" value={form.values.last}
            onChange={form.set('last')} problems={form.problems} />
        </div>
        <Field id="email" label="Email" type="email" autoComplete="email" value={form.values.email}
          onChange={form.set('email')} problems={form.problems} />
        <Field id="password" label="Password" type="password" autoComplete="new-password"
          hint={`At least ${MIN_PASSWORD} characters`} value={form.values.password}
          onChange={form.set('password')} problems={form.problems} />
        <Field id="confirm" label="Confirm password" type="password" autoComplete="new-password"
          value={form.values.confirm} onChange={form.set('confirm')} problems={form.problems} />
        <SubmitButton busy={form.busy}>Create account</SubmitButton>
      </form>
      <p className="mt-6 text-center text-(--muted)">or</p>
      <a className="btn-quiet mt-4 w-full" href={googleSignInUrl(waitingPage(next))}>Sign up with Google</a>
      <p className="mt-8 text-center">
        Already have an account? <a href={next === '/' ? '/sign-in' : `/sign-in?next=${encodeURIComponent(next)}`}>Sign in</a>
      </p>
    </>
  )
}
