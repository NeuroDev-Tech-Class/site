// The coach's side of the hub (app/routers/tech_*.py, tech admins only unless marked superadmin). Shapes match the
// hub's schemas.
import {
  request,
  type CheckpointField,
  type CourseProgress,
  type ItemProgress,
  type Ref,
  type Submission,
  type TechAccount,
  type UploadedFile,
} from './api'
import type { ItemType } from './itemLabel'

const TECH = '/api/v1/tech'
const id = (value: string) => encodeURIComponent(value)
const send = (body: unknown, method = 'POST'): RequestInit => ({ method, body: JSON.stringify(body) })
const query = (params: Record<string, string | undefined>) => {
  const kept = Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1]))
  return kept.length ? `?${new URLSearchParams(kept)}` : ''
}

export interface Person {
  id: string
  name: string
  email: string
}

export interface AdminAccount extends TechAccount {
  email_verified: boolean
  created_at: string
  approved_at: string | null
  last_login_at: string | null
}

export interface StudentRow {
  id: string
  name: string
  email: string
  status: TechAccount['status']
  student_type: TechAccount['student_type']
  email_verified: boolean
  created_at: string
  approved_at: string | null
  last_login_at: string | null
  courses_started: number
  courses_complete: number
  percent: number
  items_done: number
  last_activity_at: string | null
  waiting: number
  returned: number
}

export interface QueueRow {
  id: string
  kind: 'checkpoint' | 'test'
  attempt: number
  status: string
  legacy: boolean
  submitted_at: string | null
  student: Person
  course: Ref
  item: Ref
}

export interface Queue {
  total: number
  items: QueueRow[]
}

export interface Attempt {
  id: string
  attempt: number
  status: Submission['status']
  submitted_at: string | null
  graded_at: string | null
  feedback: string | null
}

export interface CheckpointForm {
  fields: CheckpointField[]
  required_one_of: string[][]
  requires_sign_off: boolean
  instructions_html: string
  // For the coach only: the answers or how the exercise's tests run
  grading_hint: { answers?: string[], runner?: string } | null
}

export interface SubmissionDetail extends Submission {
  student: Person
  graded_by: string | null
  legacy: boolean
  checkpoint: CheckpointForm | null
  attempts: Attempt[]
}

export interface GradeBody {
  outcome?: 'complete' | 'return'
  manual_score?: number
  total_max?: number | null
  feedback?: string
  signed_off?: boolean
}

export interface StudentCourse extends CourseProgress {
  items: ItemProgress[]
}

export interface ActivityLine {
  id: string
  type: string
  type_label: string
  summary: string
  actor_id: string | null
  actor_name: string
  // Who the line is about: the student, or the account approved
  subject_id: string | null
  subject_name: string
  course_id: string
  course_name: string
  link: string
  created_at: string
}

export interface Page<T> {
  items: T[]
  // Passed back as ?before= for the next, older page; null on the last one
  next: string | null
}

export interface InboxNote {
  id: string
  type: string
  title: string
  body: string
  link: string
  actor_name: string
  read: boolean
  created_at: string
}

export interface UsageRow {
  student: Person
  files: number
  bytes: number
  last_upload_at: string
}

export interface Usage {
  total_bytes: number
  students: UsageRow[]
}

export interface AdminFile extends UploadedFile {
  item: Ref
  course: Ref
  created_at: string
  removed_at: string | null
}

/** A course's units and items as the hub serves them (drafts too, for tech admins) */
export interface CourseOutline {
  id: string
  title: string
  heading: string
  units: {
    id: string
    title: string
    items: { id: string, type: ItemType, title: string | null, status: string, tags: string[], html?: string | null }[]
  }[]
}

export interface ActivityFilter {
  type?: string
  student?: string
  course?: string
}

// Students and accounts
export const getStudents = () => request<StudentRow[]>(`${TECH}/students`)
export const getAccount = (accountId: string) => request<AdminAccount>(`${TECH}/accounts/${id(accountId)}`)
export const getStaff = () => request<AdminAccount[]>(`${TECH}/accounts?role=staff`)
export const getPendingBadge = () => request<{ pending: number }>(`${TECH}/accounts/badge`)
export const approveAccount = (accountId: string) =>
  request<AdminAccount>(`${TECH}/accounts/${id(accountId)}/approve`, { method: 'POST' })
export const declineAccount = (accountId: string) =>
  request<AdminAccount>(`${TECH}/accounts/${id(accountId)}/decline`, { method: 'POST' })
/** Only for sign-ups that were never approved */
export const deleteAccount = (accountId: string) =>
  request<void>(`${TECH}/accounts/${id(accountId)}`, { method: 'DELETE' })
export const updateAccount = (accountId: string, change: { student_type?: 'current' | 'old', status?: 'approved' | 'deactivated' }) =>
  request<AdminAccount>(`${TECH}/accounts/${id(accountId)}`, send(change, 'PATCH'))
export const addAdmin = (email: string) => request<AdminAccount>(`${TECH}/accounts/admins`, send({ email }))
export const removeAdmin = (accountId: string) =>
  request<AdminAccount>(`${TECH}/accounts/admins/${id(accountId)}`, { method: 'DELETE' })

// A student's progress and work
export const getStudentProgress = (accountId: string) =>
  request<{ account_id: string, courses: StudentCourse[] }>(`${TECH}/accounts/${id(accountId)}/progress`)
export const getStudentWork = (accountId: string) =>
  request<Submission[]>(`${TECH}/accounts/${id(accountId)}/submissions`)
export const getCourseOutline = (courseId: string) => request<CourseOutline>(`${TECH}/courses/${id(courseId)}`)
export const markFor = (accountId: string, itemId: string, done: boolean) =>
  request<ItemProgress>(`${TECH}/accounts/${id(accountId)}/items/${id(itemId)}/complete`, { method: done ? 'POST' : 'DELETE' })

// Grading
export const getQueue = (filter: { course?: string, q?: string } = {}) =>
  request<Queue>(`${TECH}/submissions/queue${query(filter)}`)
export const getQueueCount = () => request<{ count: number }>(`${TECH}/submissions/queue/count`)
export const getSubmission = (submissionId: string) =>
  request<SubmissionDetail>(`${TECH}/submissions/${id(submissionId)}`)
export const gradeSubmission = (submissionId: string, body: GradeBody) =>
  request<SubmissionDetail>(`${TECH}/submissions/${id(submissionId)}/grade`, send(body))

// The activity record
export const getActivity = (filter: ActivityFilter, before?: string) =>
  request<Page<ActivityLine>>(`${TECH}/activity${query({ ...filter, before })}`)
export const activityCsvPath = (filter: ActivityFilter) => `${TECH}/activity.csv${query({ ...filter })}`

// The bell, for every signed-in account
export const getInbox = (before?: string) => request<Page<InboxNote>>(`${TECH}/inbox${query({ before })}`)
export const getUnreadCount = () => request<{ count: number }>(`${TECH}/inbox/unread-count`)
/** Sent as the note's link opens, so keepalive lets it finish after the page has gone */
export const markNoteRead = (noteId: string) =>
  request<void>(`${TECH}/inbox/${id(noteId)}/read`, { method: 'POST', keepalive: true })
export const markAllRead = () => request<{ count: number }>(`${TECH}/inbox/read-all`, { method: 'POST' })

// Storage (superadmin)
export const getUsage = () => request<Usage>(`${TECH}/files/usage`)
export const getStudentFiles = (accountId: string) => request<AdminFile[]>(`${TECH}/accounts/${id(accountId)}/files`)
export const removeFile = (fileId: string) => request<void>(`${TECH}/files/${id(fileId)}`, { method: 'DELETE' })
export const removeAllFiles = (accountId: string) =>
  request<{ count: number, bytes: number }>(`${TECH}/accounts/${id(accountId)}/files/remove-all`, { method: 'POST' })
