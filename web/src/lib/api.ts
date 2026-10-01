// Port of the hub frontend's client (neurodev-hub/frontend/src/api/client.ts) for the tech auth API.
// The access token lives in memory only; the hub's httpOnly refresh cookie is what survives a reload.

export const API_URL: string = import.meta.env.PUBLIC_API_URL ?? ''
const AUTH = '/api/v1/tech/auth'

export type TechRole = 'student' | 'admin' | 'superadmin'
export type TechStatus = 'pending' | 'approved' | 'declined' | 'deactivated'

export interface TechAccount {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: TechRole
  status: TechStatus
  student_type: 'current' | 'old'
  staff_source: string | null
  has_password: boolean
}

interface TokenResponse {
  access_token: string
  account: TechAccount
}

let accessToken: string | null = null
let refreshing: Promise<TechAccount | null> | null = null

export interface LineProblem {
  // 0 for a problem with the whole file
  line: number
  message: string
}

export class ApiError extends Error {
  // A 422 about a form's answers names each field with its problem; one about an uploaded file, each line's
  constructor(
    public status: number, message: string, public fields: Record<string, string> = {}, public problems: LineProblem[] = [],
  ) {
    super(message)
  }
}

const GENERIC = 'Something went wrong. Please try again.'

/** Exchanges the refresh cookie for a new access token. Concurrent callers share one request. */
export function refreshSession(): Promise<TechAccount | null> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${API_URL}${AUTH}/refresh`, { method: 'POST', credentials: 'include' })
      if (!res.ok) {
        accessToken = null
        return null
      }
      const body = (await res.json()) as TokenResponse
      accessToken = body.access_token
      return body.account
    } catch {
      accessToken = null
      return null
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

/** A signed-in call to the hub, refreshing the session once if the token has run out */
async function signedFetch(path: string, init: RequestInit, retry: boolean): Promise<Response> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  })
  if (res.status === 401 && retry && (await refreshSession())) return signedFetch(path, init, false)
  if (!res.ok) {
    const detail = await res.json().then(b => b?.detail, () => null)
    if (typeof detail === 'string') throw new ApiError(res.status, detail)
    if (typeof detail?.message === 'string') {
      throw new ApiError(res.status, detail.message, detail.fields ?? {}, detail.problems ?? [])
    }
    throw new ApiError(res.status, GENERIC)
  }
  return res
}

export async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const res = await signedFetch(path, init, retry)
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

/** A file the hub builds on request (the activity CSV, a test file), with the name the hub gives it */
export async function fetchFile(path: string): Promise<{ blob: Blob, name: string | null }> {
  const res = await signedFetch(path, {}, true)
  const name = res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] ?? null
  return { blob: await res.blob(), name }
}

/** Fetches a file from the hub and hands it to the browser to save */
export async function saveFile(path: string, fallbackName: string): Promise<void> {
  const { blob, name } = await fetchFile(path)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name ?? fallbackName
  // On the page and kept a moment, or some browsers drop the download
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function signIn(path: string, body: unknown): Promise<TechAccount> {
  const { access_token, account } = await request<TokenResponse>(path, { method: 'POST', body: JSON.stringify(body) }, false)
  accessToken = access_token
  return account
}

export function login(email: string, password: string): Promise<TechAccount> {
  return signIn(`${AUTH}/login`, { email, password })
}

export function verifyEmail(email: string, code: string): Promise<TechAccount> {
  return signIn(`${AUTH}/verify-email`, { email, code })
}

const post = (path: string, body: unknown) =>
  request<{ status: string }>(`${AUTH}${path}`, { method: 'POST', body: JSON.stringify(body) }, false)

export const register = (body: { first_name: string, last_name: string, email: string, password: string }) =>
  post('/register', body)
export const resendCode = (email: string) => post('/resend-code', { email })
export const forgotPassword = (email: string) => post('/forgot-password', { email })
export const resetPassword = (token: string, new_password: string) => post('/reset-password', { token, new_password })

// Content and progress (hub: app/routers/tech_content.py, tech_progress.py). Shapes match the hub's schemas.
const TECH = '/api/v1/tech'
const id = (value: string) => encodeURIComponent(value)

export type ProgressStatus = 'done' | 'submitted' | 'returned'

export interface Ref {
  id: string
  title: string
}

export interface ItemContent {
  id: string
  type: string
  title: string | null
  status: string
  tags: string[]
  course: Ref
  unit: Ref
  content: Record<string, unknown>
}

export interface VideoProgress {
  video_id: string
  percent: number
}

export interface ItemStatus {
  item_id: string
  status: ProgressStatus | null
  done_at: string | null
  opened_at: string | null
}

export interface ItemProgress extends ItemStatus {
  videos: VideoProgress[]
}

export interface CourseProgress {
  course_id: string
  title: string
  done: number
  total: number
  percent: number
  next_item: Ref | null
  last_activity_at: string | null
}

export interface CourseItemsProgress extends CourseProgress {
  items: ItemStatus[]
}

// Checkpoints (hub: app/tech/answers.py, drafts.py, uploads.py): the form, drafts, uploads and handing in
export type FieldType = 'shortText' | 'longText' | 'url' | 'code' | 'checklist' | 'file' | 'image' | 'mentorSignOff'

export interface CheckpointField {
  id: string
  type: FieldType
  label: string
  required: boolean
  help?: string
  // Checklists: the boxes, and how many are enough when not all
  items?: string[]
  min?: number
  // File fields: the extensions it takes
  accept?: string[]
  multiple?: boolean
  language?: string
}

export interface CheckpointContent {
  id: string
  title: string
  instructions_html: string
  fields: CheckpointField[]
  required_one_of: string[][]
  requires_sign_off: boolean
  has_starter: boolean
}

// Text for text, link and code fields; the ticked items for a checklist; upload ids for file and image fields
export type Answers = Record<string, string | string[]>

export interface UploadedFile {
  id: string
  field_id: string
  name: string
  content_type: string
  bytes: number
  status: 'pending' | 'ready' | 'removed'
  uploaded_at: string | null
}

export interface Draft {
  attempt: number
  answers: Answers
  files: UploadedFile[]
  saved_at: string | null
  started_from: number | null
}

export interface UploadTicket {
  file: UploadedFile
  upload: { url: string, method: 'PUT', headers: Record<string, string> }
}

// Submissions (hub: app/routers/tech_submissions.py): the student's own work, feedback included
export interface Submission {
  id: string
  kind: 'checkpoint' | 'test'
  attempt: number
  status: 'draft' | 'submitted' | 'graded' | 'returned' | 'auto_graded'
  status_label: string
  score_label: string
  item: Ref
  course: Ref
  answers: Answers
  feedback: string | null
  auto_score: number | null
  manual_score: number | null
  total_score: number | null
  total_max: number | null
  passed: boolean | null
  submitted_at: string | null
  graded_at: string | null
  files: UploadedFile[]
  // A hands-on checkpoint the coach saw in person
  sign_off: { by_name: string, at: string } | null
}

export interface Heartbeat {
  item_id: string
  video_id: string
  position_s: number
  duration_s: number
}

export const getMyProgress = () => request<{ courses: CourseProgress[] }>(`${TECH}/progress`)
export const getCourseProgress = (courseId: string) =>
  request<CourseItemsProgress>(`${TECH}/courses/${id(courseId)}/progress`)
export const getItem = (itemId: string) => request<ItemContent>(`${TECH}/items/${id(itemId)}`)
export const getItemProgress = (itemId: string) => request<ItemProgress>(`${TECH}/items/${id(itemId)}/progress`)
export const openItem = (itemId: string) =>
  request<ItemProgress>(`${TECH}/items/${id(itemId)}/open`, { method: 'POST' })
export const completeItem = (itemId: string) =>
  request<ItemProgress>(`${TECH}/items/${id(itemId)}/complete`, { method: 'POST' })
export const uncompleteItem = (itemId: string) =>
  request<ItemProgress>(`${TECH}/items/${id(itemId)}/complete`, { method: 'DELETE' })
/** One item's attempts, newest first; without an item, the most recent work across every course */
export const getMyWork = (itemId?: string) =>
  request<Submission[]>(`${TECH}/submissions/mine${itemId ? `?item_id=${id(itemId)}` : ''}`)
const send = (body: unknown, method = 'POST'): RequestInit => ({ method, body: JSON.stringify(body) })

export const getDraft = (itemId: string) => request<Draft>(`${TECH}/items/${id(itemId)}/draft`)
/** keepalive lets the save finish after the page has gone */
export const saveDraft = (itemId: string, answers: Answers, keepalive = false) =>
  request<Draft>(`${TECH}/items/${id(itemId)}/draft`, { ...send({ answers }, 'PUT'), keepalive })
export const handIn = (itemId: string, answers: Answers) =>
  request<Submission>(`${TECH}/items/${id(itemId)}/submit`, send({ answers }))
export const startUpload = (itemId: string, fieldId: string, name: string, size: number) =>
  request<UploadTicket>(`${TECH}/items/${id(itemId)}/uploads`, send({ field_id: fieldId, name, size }))
export const finishUpload = (fileId: string) =>
  request<UploadedFile>(`${TECH}/uploads/${id(fileId)}/done`, { method: 'POST' })
export const discardUpload = (fileId: string) => request<void>(`${TECH}/uploads/${id(fileId)}`, { method: 'DELETE' })
/** A short-lived link to see a file (or with `download`, to save it): ask again rather than keeping it */
export const fileLink = (fileId: string, download = false) =>
  request<{ url: string }>(`${TECH}/files/${id(fileId)}/link${download ? '?download=true' : ''}`)
export const sendHeartbeat = (beat: Heartbeat) =>
  request<VideoProgress & { counted: boolean }>(`${TECH}/media/heartbeat`, { method: 'POST', body: JSON.stringify(beat) })

export async function logout(): Promise<void> {
  accessToken = null
  await fetch(`${API_URL}${AUTH}/logout`, { method: 'POST', credentials: 'include' }).catch(() => undefined)
}

export function googleSignInUrl(next: string): string {
  return `${API_URL}${AUTH}/google/start?redirect=${encodeURIComponent(next)}`
}

// Tests (the hub's app/schemas/tech_tests.py): what a student sees of a test, never its key
export type QuestionType = 'mc' | 'multi' | 'tf' | 'match' | 'short' | 'written' | 'code'

export interface TestQuestion {
  number: number
  type: QuestionType
  prompt_html: string
  points: number
  // mc and multi
  choices?: string[]
  // match: a choice from options for each row
  rows?: string[]
  options?: string[]
  // code
  language?: string
}

export interface TestView {
  item_id: string
  title: string
  instructions_html: string
  pass_percent: number
  attempts_allowed: number
  total_points: number
  questions: TestQuestion[]
}

export interface TestDraft {
  attempt: number
  // By question number
  answers: Record<string, unknown>
  saved_at: string | null
}

export interface TestMark {
  // null while the coach marks a written answer
  points: number | null
  max: number
  // null for written answers
  right: boolean | null
  // match questions: each row right or not
  rows?: boolean[]
}

/** The right answers, once the student has finished the test */
export interface TestKeyEntry {
  answer?: number | number[] | boolean
  accept?: string[]
  explanation_html?: string
}

export interface TestAttempt {
  attempt: number
  status: string
  status_label: string
  score_label: string
  submitted_at: string | null
  graded_at: string | null
  total_score: number | null
  total_max: number | null
  passed: boolean | null
  provisional: boolean
  feedback: string | null
  questions: TestQuestion[]
  answers: Record<string, unknown>
  marks: Record<string, TestMark>
  key: Record<string, TestKeyEntry> | null
}

export interface TestState {
  ready: boolean
  test: TestView | null
  attempts_allowed: number | null
  attempts_used: number
  can_start: boolean
  finished: boolean
  waiting: boolean
  reason: string | null
  draft: TestDraft | null
  // Newest first
  attempts: TestAttempt[]
  best_attempt: number | null
}

const testPath = (itemId: string) => `${TECH}/items/${id(itemId)}/test`
export const getTestState = (itemId: string) => request<TestState>(testPath(itemId))
export const startTest = (itemId: string) => request<TestState>(`${testPath(itemId)}/start`, { method: 'POST' })
export const saveTestAnswers = (itemId: string, answers: Record<string, unknown>) =>
  request<TestDraft>(`${testPath(itemId)}/answers`, { method: 'PUT', body: JSON.stringify({ answers }) })
export const submitTest = (itemId: string, answers: Record<string, unknown>) =>
  request<TestState>(`${testPath(itemId)}/submit`, { method: 'POST', body: JSON.stringify({ answers }) })
