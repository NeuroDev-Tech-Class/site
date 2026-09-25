import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { fakeFetch, json, sentTo } from '../../test/fake-hub'

let fetchMock: Mock

async function renderForm() {
  const { default: ForgotPasswordForm } = await import('./ForgotPasswordForm')
  render(<ForgotPasswordForm />)
}

async function ask(email: string) {
  if (email) await userEvent.type(screen.getByLabelText('Email'), email)
  await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }))
}

beforeEach(() => {
  vi.resetModules()
  fetchMock = fakeFetch()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('ForgotPasswordForm', () => {
  test('always gives the same answer, so it never reveals who has an account', async () => {
    await renderForm()
    fetchMock.mockResolvedValueOnce(json(200, { status: 'ok' }))
    await ask('sam@example.com')
    expect(sentTo(fetchMock, '/auth/forgot-password')).toEqual([{ email: 'sam@example.com' }])
    expect(screen.getByRole('status').textContent).toContain("If there's an account for that email, a reset link is on its way.")
    expect(screen.queryByRole('button', { name: 'Send reset link' })).toBeNull()
  })

  test('an empty email is caught before sending', async () => {
    await renderForm()
    await ask('')
    expect(screen.getByRole('alert').textContent).toContain('Enter your email address.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('says so when the hub turns the request away', async () => {
    await renderForm()
    fetchMock.mockResolvedValueOnce(json(429, { detail: 'Rate limit exceeded: 30 per 1 hour' }))
    await ask('sam@example.com')
    expect(screen.getByRole('alert').textContent).toContain('Rate limit exceeded')
  })
})
