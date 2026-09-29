import type { Submission } from '../../lib/api'
import { continueHref } from '../../lib/content'
import { formatDate } from '../../lib/format'
import { useRecentWork } from '../../lib/myWork'
import CoachFeedback from '../CoachFeedback'
import Icon from '../Icon'

const QUIET_CHIP = 'rounded-full border border-(--border) px-3 py-1 text-sm font-semibold'

function outcome(work: Submission): string {
  return work.kind === 'test' && work.status === 'graded' ? `${work.status_label} · ${work.score_label}` : work.status_label
}

function WorkRow({ work, pageIds }: { work: Submission, pageIds: string[] }) {
  const finished = work.status === 'graded' && work.passed !== false
  return (
    <li className="panel mt-0 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <a href={continueHref(work.course.id, work.item.id, pageIds)} className="font-semibold text-(--heading)">
          {work.item.title}
        </a>
        {work.attempt > 1 && <span className="text-sm text-(--muted)">Attempt {work.attempt}</span>}
        <span className={`sm:ml-auto ${finished ? 'done-chip' : QUIET_CHIP}`}>
          {finished && <Icon name="check" size={16} />}
          {outcome(work)}
        </span>
      </div>
      <p className="mt-0 text-sm text-(--muted)">
        {work.course.title} · Handed in {formatDate(work.submitted_at, { month: 'long' })}
      </p>
      {work.feedback && <CoachFeedback text={work.feedback} />}
    </li>
  )
}

/** The student's latest handed-in work; nothing at all until they have handed something in */
export default function RecentWork({ pageIds }: { pageIds: string[] }) {
  const state = useRecentWork()
  if (state.status === 'error') return <p className="mt-10">Couldn't load your recent work. Reload the page to try again.</p>
  if (state.status !== 'ready' || !state.value.length) return null
  return (
    <section className="mt-10" aria-labelledby="recent-work">
      <h2 id="recent-work" className="text-2xl">Recent work</h2>
      <ul className="mt-4 flex list-none flex-col gap-3 pl-0">
        {state.value.map(work => <WorkRow key={work.id} work={work} pageIds={pageIds} />)}
      </ul>
    </section>
  )
}
