import type { CheckpointField } from '../../lib/api'

// The space sits outside the span, or it drops out of the field's accessible name
export const Required = ({ field }: { field: CheckpointField }) =>
  field.required ? <>{' '}<span className="font-normal text-(--muted)">(required)</span></> : null

/** The ids of the help and error lines under a question, for its aria-describedby */
export function describedBy(field: CheckpointField, error?: string | null): string | undefined {
  const id = `field-${field.id}`
  return [field.help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
}

/** A question's help, an optional hint, and what the hub objected to */
export default function FieldNotes({ field, error, hint }: { field: CheckpointField, error?: string | null, hint?: string | null }) {
  const id = `field-${field.id}`
  return (
    <>
      {field.help && <p id={`${id}-help`} className="mt-1 text-sm text-(--muted)">{field.help}</p>}
      {hint && <p className="mt-1 text-sm text-(--muted)">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-1 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>}
    </>
  )
}
