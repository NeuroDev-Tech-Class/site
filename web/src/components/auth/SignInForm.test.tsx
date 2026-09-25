import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { fakeFetch, json, sentTo, signedIn } from '../../test/fake-hub'

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('astro:transitions/client', () => ({ navigate }))

let fetchMock: Mock

async function renderAt(url: string) {
  history.replaceState(null, '', url)
  const { default: SignInForm } = await import('./SignInForm')
  render(<SignInForm />)
}

async function signIn(email = 'sam@example.com', password = 'pw-123456') {
  if (email) await userEvent.type(screen.getByLabelText('Email'), email)
  if (password) await userEvent.type(screen.getByLabelText('Password'), password)
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
}

beforeEach(() => {
  vi.resetModules()
  fetchMock = fakeFetch()
  navigate.mockReset()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('SignInForm', () => {
  test('signs in and goes back to where they came from, signed in on every page', async () => {
    await renderAt('/sign-in?next=%2Fcourses%2Fgimp')
    fetchMock.mockResolvedValueOnce(signedIn())
    await signIn()
    expect(sentTo(fetchMock, '/auth/login')).toEqual([{ email: 'sam@example.com', password: 'pw-123456' }])
    expect(navigate).toHaveBeenCalledWith('/courses/gimp')
    expect((await import('../../lib/session')).getSession().status).toBe('signed-in')
  })

  test('an account still waiting for approval goes to the waiting page', async () => {
    await renderAt('/sign-in?next=%2Fcourses%2Fgimp')
    fetchMock.mockResolvedValueOnce(signedIn({ status: 'pending' }))
    await signIn()
    expect(navigate).toHaveBeenCalledWith('/waiting?next=%2Fcourses%2Fgimp')
  })

  test('empty fields never reach the hub; the problems are listed and the list takes focus', async () => {
    await renderAt('/sign-in')
    await signIn('', '')
    const summary = screen.getByRole('alert')
    expect(summary.textContent).toContain('Enter your email address.')
    expect(summary.textContent).toContain('Enter your password.')
    expect(document.activeElement).toBe(summary)
    expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBe('true')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test("a wrong password shows the hub's answer and stays on the page", async () => {
    await renderAt('/sign-in')
    fetchMock.mockResolvedValueOnce(json(401, { detail: 'Invalid email or password.' }))
    await signIn()
    expect(screen.getByRole('alert').textContent).toContain('Invalid email or password.')
    expect(navigate).not.toHaveBeenCalled()
  })

  test('an email that was never confirmed links to the code page', async () => {
    await renderAt('/sign-in')
    fetchMock.mockResolvedValueOnce(json(403, { detail: 'email_not_verified' }))
    await signIn()
    expect(screen.getByRole('alert').textContent).toContain('confirm your email')
    expect(screen.getByRole('link', { name: /Enter your code/ }).getAttribute('href'))
      .toBe('/verify?email=sam%40example.com')
  })

  test.each([
    ['google', "Google sign-in didn't work"],
    ['config', "Google sign-in isn't set up yet"],
    ['deactivated', 'This account has been deactivated'],
  ])('?error=%s is explained in plain words', async (error, words) => {
    await renderAt(`/sign-in?error=${error}`)
    expect(screen.getByRole('alert').textContent).toContain(words)
  })

  test('after a password reset, says it worked', async () => {
    await renderAt('/sign-in?reset=1')
    expect(screen.getByRole('status').textContent).toContain('Your password has been changed')
  })

  test('Sign in with Google comes back through the waiting page, which forwards approved accounts on', async () => {
    await renderAt('/sign-in?next=%2Fcourses%2Fgimp')
    const { API_URL } = await import('../../lib/api')
    expect(screen.getByRole('link', { name: 'Sign in with Google' }).getAttribute('href')).toBe(
      `${API_URL}/api/v1/tech/auth/google/start?redirect=${encodeURIComponent('/waiting?next=%2Fcourses%2Fgimp')}`,
    )
  })

  test('links to Forgot password and Register', async () => {
    await renderAt('/sign-in')
    expect(screen.getByRole('link', { name: 'Forgot your password?' }).getAttribute('href')).toBe('/forgot-password')
    expect(screen.getByRole('link', { name: 'Create an account' }).getAttribute('href')).toBe('/register')
  })
})
