// One course's progress for the signed-in student, shared by every island on the course page. It is read again
// whenever a page using it opens, so coming back from an item page never shows old numbers.
import { useEffect, useSyncExternalStore } from 'react'
import { completeItem, getCourseProgress, uncompleteItem, type CourseItemsProgress, type ProgressStatus } from './api'
import { useSession } from './session'

export type CourseProgressState =
  | { status: 'unavailable' }
  | { status: 'loading' }
  | { status: 'ready', progress: CourseItemsProgress }
  | { status: 'error' }

const UNAVAILABLE: CourseProgressState = { status: 'unavailable' }
const LOADING: CourseProgressState = { status: 'loading' }

const states = new Map<string, CourseProgressState>()
const inflight = new Map<string, Promise<void>>()
const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function load(courseId: string): Promise<void> {
  const running = inflight.get(courseId)
  if (running) return running
  const pending = getCourseProgress(courseId)
    .then(
      progress => { states.set(courseId, { status: 'ready', progress }) },
      () => { if (states.get(courseId)?.status !== 'ready') states.set(courseId, { status: 'error' }) },
    )
    .finally(() => {
      inflight.delete(courseId)
      listeners.forEach(listener => listener())
    })
  inflight.set(courseId, pending)
  return pending
}

/** Marks an item done or not done, then reads the course again so every total comes from the hub */
export async function setItemDone(courseId: string, itemId: string, done: boolean): Promise<void> {
  await (done ? completeItem(itemId) : uncompleteItem(itemId))
  await load(courseId)
}

// Mirrors the hub's counts_done: done, or a test once submitted
export const countsDone = (type: string, status: ProgressStatus | null): boolean =>
  status === 'done' || (type === 'test' && status === 'submitted')

export function useCourseProgress(courseId: string): CourseProgressState {
  const session = useSession()
  const approved = session.status === 'signed-in' && session.account.status === 'approved'

  useEffect(() => {
    if (approved) void load(courseId)
  }, [approved, courseId])

  const state = useSyncExternalStore(subscribe, () => states.get(courseId) ?? LOADING, () => UNAVAILABLE)
  return approved ? state : UNAVAILABLE
}
