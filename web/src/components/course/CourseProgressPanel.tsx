import Icon from '../Icon'
import NotApproved from '../NotApproved'
import { continueHref } from '../../lib/contentLinks'
import { useCourseProgress } from '../../lib/courseProgress'
import { useSession } from '../../lib/session'
import ProgressRing from './ProgressRing'
import { ProgressPanelBones, Skeleton } from '../Skeleton'

// The top of a course page: how to start (signed out), why you can't yet (pending), or where you are (approved)
export default function CourseProgressPanel({ courseId, pageIds }: { courseId: string, pageIds: string[] }) {
  const session = useSession()
  const state = useCourseProgress(courseId)

  const loading = <Skeleton label="Loading your progress"><ProgressPanelBones /></Skeleton>
  if (session.status === 'loading') return loading
  if (session.status === 'signed-out') {
    return (
      <a className="btn-primary" href={`/sign-in?next=${encodeURIComponent(`/courses/${courseId}`)}`}>
        Sign in to start this course
      </a>
    )
  }
  if (session.account.status !== 'approved') {
    return <NotApproved status={session.account.status} then="You can start once it's approved." />
  }
  if (state.status === 'error') {
    return <p className="mt-0">Couldn't load your progress. Reload the page to try again.</p>
  }
  if (state.status !== 'ready') return loading

  const { done, total, percent, next_item: next } = state.progress
  return (
    <div className="flex flex-wrap items-center gap-4">
      <ProgressRing percent={percent} />
      <div className="min-w-0">
        <p className="mt-0 font-heading font-semibold">{done} of {total} done</p>
        {next ? (
          <>
            <p className="mt-0 text-sm text-(--muted)">Next: {next.title}</p>
            <a className="btn-primary mt-2" href={continueHref(courseId, next.id, pageIds)}>
              {done === 0 ? 'Start this course' : 'Continue'} <Icon name="arrow" size={18} />
            </a>
          </>
        ) : (
          <p className="mt-0 font-semibold">You finished this course!</p>
        )}
      </div>
    </div>
  )
}
