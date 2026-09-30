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

const CHECKPOINT_WORDS: Record<string, string> = { done: 'Complete', submitted: 'Submitted', returned: 'Needs revision' }

/** How an item's progress is said on course pages and the coach's view of a student's course */
export function statusWord(type: string, status: ProgressStatus | null): string | null {
  if (type === 'checkpoint') return CHECKPOINT_WORDS[status ?? ''] ?? null
  if (type === 'test' && status === 'returned') return 'Try again'
  if (status === 'submitted') return 'Submitted'
  if (status === 'returned') return 'Needs revision'
  return status === 'done' ? 'Done' : null
}

// Mirrors the hub: done (a test once passed or out of attempts, a checkpoint once graded complete)
export const countsDone = (status: ProgressStatus | null): boolean => status === 'done'

/** The signed-in, approved account's id, or null for anyone else */
export function useApprovedId(): string | null {
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
