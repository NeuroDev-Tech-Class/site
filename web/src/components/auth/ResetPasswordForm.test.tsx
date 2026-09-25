import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { fakeFetch, json, sentTo } from '../../test/fake-hub'

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('astro:transitions/client', () => ({ navigate }))

let fetchMock: Mock

async function renderAt(url: string) {
  history.replaceState(null, '', url)
  const { default: ResetPasswordForm } = await import('./ResetPasswordForm')
  render(<ResetPasswordForm />)
}

async function choose(password: string, confirm: string) {
  if (password) await userEvent.type(screen.getByLabelText('New password'), password)
  if (confirm) await userEvent.type(screen.getByLabelText('Confirm password'), confirm)
  await userEvent.click(screen.getByRole('button', { name: 'Save password' }))
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

describe('ResetPasswordForm', () => {
  test('saves the new password and sends them to sign in', async () => {
    await renderAt('/reset-password?token=abc123')
    fetchMock.mockResolvedValueOnce(json(200, { status: 'ok' }))
    await choose('new-pass-1', 'new-pass-1')
    expect(sentTo(fetchMock, '/auth/reset-password')).toEqual([{ token: 'abc123', new_password: 'new-pass-1' }])
    expect(navigate).toHaveBeenCalledWith('/sign-in?reset=1')
  })

  test('a short password or a mismatch is caught before sending', async () => {
    await renderAt('/reset-password?token=abc123')
    await choose('short', 'other')
    expect(screen.getByRole('alert').textContent).toContain('Use at least 8 characters.')
    expect(screen.getByRole('alert').textContent).toContain("The passwords don't match.")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('an expired or used link says so and offers a new one', async () => {
    await renderAt('/reset-password?token=old')
    fetchMock.mockResolvedValueOnce(json(400, { detail: 'This link is invalid or has expired.' }))
    await choose('new-pass-1', 'new-pass-1')
    expect(screen.getByRole('alert').textContent).toContain('This link is invalid or has expired.')
    expect(screen.getByRole('link', { name: 'Ask for a new link' }).getAttribute('href')).toBe('/forgot-password')
  })

  test('a link with no token shows no form, just the way to get a new link', async () => {
    await renderAt('/reset-password')
    expect(screen.queryByLabelText('New password')).toBeNull()
    expect(screen.getByRole('link', { name: 'Ask for a new link' }).getAttribute('href')).toBe('/forgot-password')
  })
})
