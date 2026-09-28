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

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

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

export async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  })
  if (res.status === 401 && retry && (await refreshSession())) return request<T>(path, init, false)
  if (!res.ok) {
    const detail = await res.json().then(b => b?.detail, () => null)
    throw new ApiError(res.status, typeof detail === 'string' ? detail : 'Something went wrong. Please try again.')
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
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
export const sendHeartbeat = (beat: Heartbeat) =>
  request<VideoProgress & { counted: boolean }>(`${TECH}/media/heartbeat`, { method: 'POST', body: JSON.stringify(beat) })

export async function logout(): Promise<void> {
  accessToken = null
  await fetch(`${API_URL}${AUTH}/logout`, { method: 'POST', credentials: 'include' }).catch(() => undefined)
}

export function googleSignInUrl(next: string): string {
  return `${API_URL}${AUTH}/google/start?redirect=${encodeURIComponent(next)}`
}
