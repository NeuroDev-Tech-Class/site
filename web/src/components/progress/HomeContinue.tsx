import { continueHref, courseAccent, type CourseMeta } from '../../lib/content'
import { useMyProgress } from '../../lib/courseProgress'
import ProgressRing from '../course/ProgressRing'
import Icon from '../Icon'

// Home's "Pick up where you left off": the most recent course with something still to do, or nothing at all
export default function HomeContinue({ courses, pageIds }: { courses: CourseMeta[], pageIds: string[] }) {
  const state = useMyProgress()
  if (state.status !== 'ready') return null
  const course = state.value.find(c => c.next_item)
  if (!course?.next_item) return null
  const meta = courses.find(m => m.id === course.course_id)

  return (
    <section
      className="panel mb-10 flex flex-wrap items-center gap-4"
      style={{ '--accent': courseAccent(meta) } as React.CSSProperties}
    >
      <ProgressRing percent={course.percent} />
      <div className="min-w-0 flex-1">
        <h2 className="mt-0 text-base text-(--muted)">Pick up where you left off</h2>
        <p className="mt-0 font-heading text-lg font-semibold">{meta?.heading ?? course.title}</p>
        <p className="mt-0 truncate text-sm text-(--muted)" title={course.next_item.title}>Next: {course.next_item.title}</p>
      </div>
      <a className="btn-primary" href={continueHref(course.course_id, course.next_item.id, pageIds)}>
        Continue <Icon name="arrow" size={18} />
      </a>
    </section>
  )
}
