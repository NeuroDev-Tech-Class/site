import { useSession } from '../lib/session'

// Until lessons open inside the site (Phase 6), this says what a visitor can do next with this course
export default function CourseStart({ courseId }: { courseId: string }) {
  const session = useSession()

  if (session.status !== 'signed-in') {
    return (
      <a className="btn-primary" href={`/sign-in?next=${encodeURIComponent(`/courses/${courseId}`)}`}>
        Sign in to start this course
      </a>
    )
  }
  if (session.account.status === 'pending') {
    return <span>Your account is waiting for your tech coach to approve it. You can start once it's approved.</span>
  }
  if (session.account.status !== 'approved') {
    return <span>Your account wasn't approved. Please talk to your tech coach.</span>
  }
  return <span className="font-semibold">Lessons open here soon.</span>
}
