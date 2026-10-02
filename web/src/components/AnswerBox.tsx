import type { ReactNode } from 'react'

/** A student's answer, boxed and labelled so it stands apart from the question above it */
export default function AnswerBox({ who = 'Their', children }: { who?: 'Your' | 'Their', children: ReactNode }) {
  const label = `${who} answer`
  return (
    <div role="group" aria-label={label} className="answer-box">
      <p className="eyebrow mt-0">{label}</p>
      {children}
    </div>
  )
}
