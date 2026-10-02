import { useMyProgress } from '../../lib/courseProgress'
import ProgressRing from '../course/ProgressRing'
import Icon from '../Icon'
import { Bone } from '../Skeleton'

// A catalog card's progress: nothing until the student starts the course; every ring on the page shares one request
export default function CourseRing({ courseId }: { courseId: string }) {
  const state = useMyProgress()
  // Each card holds the ring's place quietly; a page of rings shouldn't announce itself a dozen times
  if (state.status === 'loading') {
    return <span className="inline-flex items-center gap-2"><Bone className="size-10 rounded-full" /><Bone className="h-4 w-28" /></span>
  }
  if (state.status !== 'ready') return null
  const course = state.value.find(c => c.course_id === courseId)
  if (!course) return null
  if (course.percent >= 100) {
    return (
      <span className="done-chip">
        <Icon name="check" size={16} />Complete
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
