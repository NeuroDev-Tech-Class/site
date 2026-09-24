import { useEffect, useRef, useState, type SubmitEvent, type InputHTMLAttributes, type ReactNode } from 'react'
import { ApiError } from '../../lib/api'

export interface Problem {
  field?: string
  message: ReactNode
}

export const MIN_PASSWORD = 8

export const required = (value: string, field: string, message: string): Problem[] =>
  value.trim() ? [] : [{ field, message }]

export function emailProblems(value: string, field: string): Problem[] {
  if (!value.trim()) return [{ field, message: 'Enter your email address.' }]
  return /^\S+@\S+\.\S+$/.test(value.trim()) ? [] : [{ field, message: 'Enter an email address like name@example.com.' }]
}

export function newPasswordProblems(password: string, confirm: string, field: string, confirmField: string): Problem[] {
  if (!password) return [{ field, message: 'Choose a password.' }]
  return [
    ...(password.length < MIN_PASSWORD ? [{ field, message: `Use at least ${MIN_PASSWORD} characters.` }] : []),
    ...(password !== confirm ? [{ field: confirmField, message: "The passwords don't match." }] : []),
  ]
}

/** Values, problems and a submit handler: checks first, calls the hub only when nothing is wrong */
export function useAuthForm<T extends Record<string, string>>(initial: T, initialProblems: Problem[] = []) {
  const [values, setValues] = useState(initial)
  const [problems, setProblems] = useState(initialProblems)
  const [busy, setBusy] = useState(false)

  const set = (field: keyof T) => (value: string) => setValues(current => ({ ...current, [field]: value }))

  function submit(check: (values: T) => Problem[], action: (values: T) => Promise<void>, onError?: (error: ApiError) => Problem[] | null) {
    return async (event: SubmitEvent) => {
      event.preventDefault()
      const found = check(values)
      setProblems(found)
      if (found.length) return
      setBusy(true)
      try {
        await action(values)
      } catch (error) {
        const apiError = error instanceof ApiError ? error : new ApiError(0, 'Something went wrong. Please try again.')
        setProblems(onError?.(apiError) ?? [{ message: apiError.message }])
      } finally {
        setBusy(false)
      }
    }
  }

  return { values, set, problems, setProblems, busy, submit }
}

export function ErrorSummary({ problems }: { problems: Problem[] }) {
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (problems.length) box.current?.focus()
  }, [problems])

  if (!problems.length) return null
  return (
    <div
      ref={box}
      role="alert"
      tabIndex={-1}
      className="mb-6 rounded-lg border-2 border-red-700 bg-red-50 p-4 text-red-900 dark:border-red-400 dark:bg-red-950 dark:text-red-100"
    >
      <p className="mt-0 font-semibold">{problems.length === 1 ? 'There is a problem' : 'There are some problems'}</p>
      <ul className="mt-2 list-disc pl-6">
        {problems.map((problem, index) => (
          <li key={index}>
            {problem.field
              ? <a className="text-inherit" href={`#${problem.field}`}>{problem.message}</a>
              : problem.message}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="mb-6 rounded-lg border-2 border-green-700 bg-green-50 p-4 text-green-900 dark:border-green-400 dark:bg-green-950 dark:text-green-100">
      {children}
    </div>
  )
}

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  problems: Problem[]
  hint?: string
}

export function Field({ id, label, value, onChange, problems, hint, ...input }: FieldProps) {
  const error = problems.find(problem => problem.field === id)?.message
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  return (
    <div className="mt-4">
      <label htmlFor={id} className="block font-semibold">{label}</label>
      {hint && <p id={`${id}-hint`} className="mt-1 text-sm text-(--muted)">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-1 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>}
      <input
        id={id}
        name={id}
        value={value}
        onChange={event => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="field mt-2"
        {...input}
      />
    </div>
  )
}

export function SubmitButton({ busy, children }: { busy: boolean, children: ReactNode }) {
  return (
    <button type="submit" className="btn-primary mt-6 w-full" disabled={busy} aria-busy={busy}>
      {children}
    </button>
  )
}
