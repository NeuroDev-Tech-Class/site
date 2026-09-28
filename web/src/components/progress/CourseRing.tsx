import { useMyProgress } from '../../lib/courseProgress'
import ProgressRing from '../course/ProgressRing'
import Icon from '../Icon'

// A catalog card's progress: nothing until the student starts the course; every ring on the page shares one request
export default function CourseRing({ courseId }: { courseId: string }) {
  const state = useMyProgress()
  if (state.status !== 'ready') return null
  const course = state.value.find(c => c.course_id === courseId)
  if (!course) return null
  if (course.percent >= 100) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-(--page) px-3 py-1 text-sm font-semibold">
        <Icon name="check" size={16} className="text-(--accent)" />Complete
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold">
      <ProgressRing percent={course.percent} size={40} />
      <span>In progress · {course.percent}%</span>
    </span>
  )
}
