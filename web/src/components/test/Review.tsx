import type { ReactNode } from 'react'
import type { TestKeyEntry, TestMark, TestQuestion } from '../../lib/api'
import { plainText, pointsWords } from './Question'

type Key = TestKeyEntry & { rubric?: string }

const listed = (items: string[]) => items.join(', ')

function answerText(question: TestQuestion, value: unknown): string {
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) return 'No answer'
  const choice = (index: number) => plainText(question.choices?.[index] ?? '')
  switch (question.type) {
    case 'mc': return choice(value as number)
    case 'multi': return listed((value as number[]).map(choice))
    case 'tf': return value ? 'True' : 'False'
    case 'match': return listed((question.rows ?? []).map((row, i) => {
      const picked = (value as (number | null)[])[i]
      return `${plainText(row)} → ${picked === null || picked === undefined ? 'nothing' : plainText(question.options?.[picked] ?? '')}`
    }))
    default: return String(value)
  }
}

function rightAnswer(question: TestQuestion, key: Key): string | null {
  if (key.accept) return `Accepted answers: ${listed(key.accept)}`
  if (key.answer === undefined) return null
  return `Right answer: ${answerText(question, key.answer)}`
}

function markWords(mark: TestMark | undefined): string | null {
  if (!mark || !mark.max) return null
  if (mark.points === null) return 'Waiting for your coach'
  if (mark.right) return 'Right'
  return mark.points ? `${mark.points} of ${pointsWords(mark.max)}` : 'Wrong'
}

/** An attempt question by question: the answer given, how it was marked, and the key when it may be shown */
export default function Review({ label, questions, answers, marks, keys, who = 'Your', extra }: {
  label: string
  questions: TestQuestion[]
  answers: Record<string, unknown>
  marks: Record<string, TestMark>
  keys: Record<string, Key> | null
  who?: 'Your' | 'Their'
  // Anything the coach adds under a question (their points box)
  extra?: (question: TestQuestion) => ReactNode
}) {
  return (
    <ol aria-label={label} className="mt-4 flex list-none flex-col gap-4 pl-0">
      {questions.map(question => {
        const n = String(question.number)
        const key = keys?.[n]
        const words = markWords(marks[n])
        const right = key && rightAnswer(question, key)
        return (
          <li key={n} className="panel mt-0">
            <p className="mt-0 flex flex-wrap items-center gap-3 font-heading font-bold">
              Question {question.number}
              {words && <span className={marks[n]?.right ? 'done-chip' : 'text-sm font-semibold text-(--muted)'}>{words}</span>}
            </p>
            <div className="lesson" dangerouslySetInnerHTML={{ __html: question.prompt_html }} />
            <p className="mt-2 whitespace-pre-wrap">
              <span className="font-semibold">{who} answer: </span>{answerText(question, answers[n])}
            </p>
            {right && <p className="mt-1 font-semibold">{right}</p>}
            {key?.explanation_html && <div className="lesson mt-1 text-(--muted)" dangerouslySetInnerHTML={{ __html: key.explanation_html }} />}
            {key?.rubric && <p className="mt-1 text-sm"><span className="font-semibold">Rubric: </span>{key.rubric}</p>}
            {extra?.(question)}
          </li>
        )
      })}
    </ol>
  )
}
