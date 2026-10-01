import { useId } from 'react'
import type { TestQuestion } from '../../lib/api'
import { countWords } from '../../lib/format'

export const plainText = (html: string): string => new DOMParser().parseFromString(html, 'text/html').body.textContent ?? ''

const Html = ({ html }: { html: string }) => <span dangerouslySetInnerHTML={{ __html: html }} />

function Choices({ question, value, onChange, disabled, name }: Field & { name: string }) {
  const many = question.type === 'multi'
  const chosen = many ? (Array.isArray(value) ? value as number[] : []) : value
  const choices = question.type === 'tf' ? ['True', 'False'] : question.choices ?? []
  const valueOf = (index: number) => (question.type === 'tf' ? index === 0 : index)
  function pick(index: number, checked: boolean) {
    if (!many) return onChange?.(valueOf(index))
    const list = chosen as number[]
    onChange?.(checked ? [...list, index].sort((a, b) => a - b) : list.filter(i => i !== index))
  }
  return (
    <ul className="mt-3 flex list-none flex-col gap-1 pl-0">
      {choices.map((choice, index) => (
        <li key={index} className="mt-0">
          <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
            <input
              type={many ? 'checkbox' : 'radio'} name={name} className="size-5 shrink-0 accent-(--check)" disabled={disabled}
              checked={many ? (chosen as number[]).includes(index) : chosen === valueOf(index)}
              onChange={event => pick(index, event.target.checked)}
            />
            {question.type === 'tf' ? choice : <Html html={choice} />}
          </label>
        </li>
      ))}
    </ul>
  )
}

function Match({ question, value, onChange, disabled, name }: Field & { name: string }) {
  const rows = question.rows ?? []
  const picked = Array.isArray(value) ? value as (number | null)[] : rows.map(() => null)
  function pick(row: number, option: string) {
    const next = rows.map((_, i) => picked[i] ?? null)
    next[row] = option === '' ? null : Number(option)
    onChange?.(next)
  }
  return (
    <div className="mt-3 flex flex-col gap-3">
      {rows.map((row, index) => (
        <div key={index} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
          <label htmlFor={`${name}-${index}`} className="font-semibold sm:w-1/3"><Html html={row} /></label>
          <select id={`${name}-${index}`} className="field sm:flex-1" disabled={disabled}
            value={picked[index] ?? ''} onChange={event => pick(index, event.target.value)}>
            <option value="">Choose…</option>
            {(question.options ?? []).map((option, i) => <option key={i} value={i}>{plainText(option)}</option>)}
          </select>
        </div>
      ))}
    </div>
  )
}

function Written({ question, value, onChange, disabled, name }: Field & { name: string }) {
  const code = question.type === 'code'
  return (
    <label className="mt-3 flex flex-col gap-1 font-semibold">
      {code ? `Your code${question.language ? ` (${question.language})` : ''}` : 'Your answer'}
      <textarea
        id={name} className={`field ${code ? 'font-mono text-sm' : ''}`} disabled={disabled}
        rows={question.type === 'short' ? 2 : code ? 10 : 6} spellCheck={!code}
        value={typeof value === 'string' ? value : ''} onChange={event => onChange?.(event.target.value)}
      />
    </label>
  )
}

interface Field {
  question: TestQuestion
  value?: unknown
  onChange?: (value: unknown) => void
  disabled?: boolean
}

/** One question as a student answers it: numbered with its points, the prompt, then the right kind of answer */
export default function Question(props: Field) {
  const { question } = props
  const name = `q${question.number}-${useId()}`
  return (
    <fieldset className="panel mt-6 min-w-0">
      <legend className="flex gap-3 font-heading font-bold">
        <span>Question {question.number}</span>
        <span className="font-normal text-(--muted)"><span className="sr-only">, </span>{countWords(question.points, 'point')}</span>
      </legend>
      <div className="lesson" dangerouslySetInnerHTML={{ __html: question.prompt_html }} />
      {question.type === 'mc' || question.type === 'multi' || question.type === 'tf'
        ? <Choices {...props} name={name} />
        : question.type === 'match' ? <Match {...props} name={name} /> : <Written {...props} name={name} />}
    </fieldset>
  )
}
