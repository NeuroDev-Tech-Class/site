import type { CourseProgress } from '../../lib/api'
import { continueHref, courseAccent, type CourseMeta } from '../../lib/content'
import { useMyProgress } from '../../lib/courseProgress'
import { formatDate } from '../../lib/format'
import { useSession } from '../../lib/session'
import ProgressRing from '../course/ProgressRing'
import Icon from '../Icon'
import NotApproved from '../NotApproved'

interface Props {
  courses: CourseMeta[]
  pageIds: string[]
}

function Card({ course, meta, pageIds }: { course: CourseProgress, meta?: CourseMeta, pageIds: string[] }) {
  const next = course.next_item
  return (
    <li className="mt-0">
      <article className="panel flex h-full flex-col gap-4" style={{ '--accent': courseAccent(meta) } as React.CSSProperties}>
        <div className="flex items-center gap-4">
          <ProgressRing percent={course.percent} />
          <div className="min-w-0">
            <h2 className="mt-0 text-lg">
              <a href={`/courses/${course.course_id}`} className="text-(--heading) no-underline hover:underline">
                {meta?.heading ?? course.title}
              </a>
            </h2>
            <p className="mt-0 text-sm font-semibold">{course.done} of {course.total} done</p>
            {course.last_activity_at && (
              <p className="mt-0 text-sm text-(--muted)">Last worked on {formatDate(course.last_activity_at)}</p>
            )}
          </div>
        </div>
        {next ? (
          <div className="mt-auto flex flex-col gap-2">
            <p className="mt-0 truncate text-sm text-(--muted)" title={next.title}>Next: {next.title}</p>
            <a className="btn-primary self-start" href={continueHref(course.course_id, next.id, pageIds)}>
              Continue <Icon name="arrow" size={18} />
            </a>
          </div>
        ) : (
          <p className="done-chip mt-auto self-start">
            <Icon name="check" size={16} />Finished
          </p>
        )}
      </article>
    </li>
  )
}

export default function MyCourses({ courses, pageIds }: Props) {
  const session = useSession()
  const state = useMyProgress()

  const loading = <p className="text-(--muted)" aria-busy="true">Loading your courses…</p>
  if (session.status === 'loading') return loading
  if (session.status === 'signed-out') {
    return (
      <div className="panel">
        <p className="mt-0">Sign in to see the courses you've started.</p>
        <a className="btn-primary mt-4" href="/sign-in?next=%2Fmy-courses">Sign in</a>
      </div>
    )
  }
  if (session.account.status !== 'approved') {
    return <NotApproved status={session.account.status} then="Your courses show here once it's approved." />
  }
  if (state.status === 'error') return <p>Couldn't load your courses. Reload the page to try again.</p>
  if (state.status !== 'ready') return loading
  if (!state.value.length) {
    return (
      <div className="panel">
        <p className="mt-0">You haven't started a course yet.</p>
        <a className="btn-primary mt-4" href="/catalog">Browse the catalog</a>
      </div>
    )
  }
  const byId = new Map(courses.map(meta => [meta.id, meta]))
  return (
    <ul className="mt-6 grid list-none gap-5 pl-0 md:grid-cols-2">
      {state.value.map(course => (
        <Card key={course.course_id} course={course} meta={byId.get(course.course_id)} pageIds={pageIds} />
      ))}
    </ul>
  )
}
