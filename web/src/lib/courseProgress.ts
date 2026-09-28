// One course's progress and the student's started courses, for the islands that show them
import { completeItem, getCourseProgress, getMyProgress, uncompleteItem, type CourseItemsProgress, type CourseProgress, type ProgressStatus } from './api'
import { createRemote, type Remote } from './remote'
import { getSession, useSession } from './session'

type CourseProgressState =
  | { status: 'unavailable' }
  | { status: 'loading' }
  | { status: 'ready', progress: CourseItemsProgress }
  | { status: 'error' }

const course = createRemote(getCourseProgress)
const mine = createRemote(() => getMyProgress().then(body => body.courses))

// Mirrors the hub's counts_done: done, or a test once submitted
export const countsDone = (type: string, status: ProgressStatus | null): boolean =>
  status === 'done' || (type === 'test' && status === 'submitted')

/** The signed-in, approved account's id, or null for anyone else */
function useApprovedId(): string | null {
  const session = useSession()
  return session.status === 'signed-in' && session.account.status === 'approved' ? session.account.id : null
}

/** Marks an item done or not done, then reads the course again so every total comes from the hub */
export async function setItemDone(courseId: string, itemId: string, done: boolean): Promise<void> {
  await (done ? completeItem(itemId) : uncompleteItem(itemId))
  const session = getSession()
  if (session.status === 'signed-in') await course.reload(session.account.id, courseId)
}

export function useCourseProgress(courseId: string): CourseProgressState {
  const state = course.useRemote(courseId, useApprovedId())
  return state.status === 'ready' ? { status: 'ready', progress: state.value } : state
}

/** The courses the student has started, most recent first (the hub's order) */
export function useMyProgress(): Remote<CourseProgress[]> {
  return mine.useRemote('me', useApprovedId())
}
