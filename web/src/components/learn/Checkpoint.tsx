import { useEffect, useRef, useState } from 'react'
import { ApiError, getDraft, getMyWork, type CheckpointContent, type Draft, type Submission } from '../../lib/api'
import { starterFileName } from '../../lib/checkpoint'
import type { ItemPageView } from '../../lib/content'
import { formatDate } from '../../lib/format'
import CoachFeedback from '../CoachFeedback'
import Icon from '../Icon'
import AnswerList from './AnswerList'
import CheckpointForm from './CheckpointForm'

type Load =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'closed', message: string }
  | { status: 'handed-in', work: Submission }
  | { status: 'open', draft: Draft, returned: Submission | null }

// Handed in and either waiting for the coach or finished; returned work opens again as a new attempt
const HANDED_IN: Submission['status'][] = ['submitted', 'graded', 'auto_graded']

function Receipt({ work, content }: { work: Submission, content: CheckpointContent }) {
  const heading = useRef<HTMLHeadingElement>(null)
  const waiting = work.status === 'submitted'
  useEffect(() => heading.current?.focus(), [])
  return (
    <section className="panel" aria-labelledby="receipt-heading">
      <h2 id="receipt-heading" ref={heading} tabIndex={-1} className="mt-0 flex items-center gap-2">
        {!waiting && <Icon name="check" size={22} className="text-(--accent)" />}
        {waiting ? 'Waiting for your coach' : 'Complete'}
      </h2>
      <p className="mt-2">
        Handed in {formatDate(work.submitted_at, { month: 'long' })}.
        {waiting && ' Your coach will look at it and you will see their feedback here.'}
      </p>
      {work.sign_off && (
        <p className="mt-2">{work.sign_off.by_name} confirmed this in person on {formatDate(work.sign_off.at, { month: 'long' })}.</p>
      )}
      {work.feedback && <div className="mt-4"><CoachFeedback text={work.feedback} /></div>}
      <AnswerList fields={content.fields} answers={work.answers} files={work.files} />
    </section>
  )
}

export default function Checkpoint({ page, content }: { page: ItemPageView, content: CheckpointContent }) {
  const [load, setLoad] = useState<Load>({ status: 'loading' })

  useEffect(() => {
    let current = true
    Promise.allSettled([getMyWork(page.id), getDraft(page.id)]).then(([attempts, draft]) => {
      if (!current) return
      const latest = attempts.status === 'fulfilled' ? attempts.value[0] ?? null : null
      if (latest && HANDED_IN.includes(latest.status)) setLoad({ status: 'handed-in', work: latest })
      else if (draft.status === 'fulfilled' && attempts.status === 'fulfilled') {
        setLoad({ status: 'open', draft: draft.value, returned: latest?.status === 'returned' ? latest : null })
      } else if (draft.status === 'rejected' && draft.reason instanceof ApiError && draft.reason.status === 409) {
        setLoad({ status: 'closed', message: draft.reason.message })
      } else setLoad({ status: 'error' })
    })
    return () => { current = false }
  }, [page.id])

  // Everything appears at once, so the returned feedback never pushes the instructions down
  if (load.status === 'loading') return <p className="text-(--muted)" aria-busy="true">Loading…</p>
  let body
  if (load.status === 'error') body = <p>Couldn't load your work. Reload the page to try again.</p>
  else if (load.status === 'closed') body = <div className="panel"><p className="mt-0">{load.message}</p></div>
  else if (load.status === 'handed-in') body = <Receipt work={load.work} content={content} />
  else {
    body = (
      <CheckpointForm
        itemId={page.id}
        content={content}
        draft={load.draft}
        onHandedIn={work => setLoad({ status: 'handed-in', work })}
      />
    )
  }

  return (
    <>
      {load.status === 'open' && load.returned?.feedback && (
        <section aria-labelledby="returned-heading" className="panel mb-8 border-l-4 border-(--callout-note)">
          <h2 id="returned-heading" className="mt-0 text-lg">Your coach sent this back</h2>
          <p className="mt-1">Make the changes below, then hand it in again.</p>
          <div className="mt-3"><CoachFeedback text={load.returned.feedback} /></div>
        </section>
      )}
      <div className="lesson" dangerouslySetInnerHTML={{ __html: content.instructions_html }} />
      {content.has_starter && (
        <p className="mt-6">
          <a className="btn-quiet" href={`/starters/${content.id}.zip`} download={starterFileName(page)}>
            <Icon name="download" size={18} /> Download the starter code
          </a>
        </p>
      )}
      <div className="mt-10">{body}</div>
    </>
  )
}
