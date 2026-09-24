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

export async function logout(): Promise<void> {
  accessToken = null
  await fetch(`${API_URL}${AUTH}/logout`, { method: 'POST', credentials: 'include' }).catch(() => undefined)
}

export function googleSignInUrl(next: string): string {
  return `${API_URL}${AUTH}/google/start?redirect=${encodeURIComponent(next)}`
}
