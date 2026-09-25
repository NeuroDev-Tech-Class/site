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
  const { default: RegisterForm } = await import('./RegisterForm')
  render(<RegisterForm />)
}

async function fill(fields: Partial<Record<'First name' | 'Last name' | 'Email' | 'Password' | 'Confirm password', string>>) {
  for (const [label, value] of Object.entries(fields)) {
    if (value) await userEvent.type(screen.getByLabelText(label), value)
  }
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
}

const complete = {
  'First name': 'Sam', 'Last name': 'Student', Email: 'sam@example.com',
  Password: 'pw-123456', 'Confirm password': 'pw-123456',
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

describe('RegisterForm', () => {
  test('creates the account, then asks for the emailed code, keeping where they were heading', async () => {
    await renderAt('/register?next=%2Fcourses%2Fgimp')
    fetchMock.mockResolvedValueOnce(json(200, { status: 'verification_required' }))
    await fill(complete)
    expect(sentTo(fetchMock, '/auth/register')).toEqual([
      { first_name: 'Sam', last_name: 'Student', email: 'sam@example.com', password: 'pw-123456' },
    ])
    expect(navigate).toHaveBeenCalledWith('/verify?email=sam%40example.com&next=%2Fcourses%2Fgimp')
  })

  test('empty fields are each named, and nothing is sent', async () => {
    await renderAt('/register')
    await fill({})
    const summary = screen.getByRole('alert')
    for (const words of ['Enter your first name.', 'Enter your last name.', 'Enter your email address.', 'Choose a password.']) {
      expect(summary.textContent).toContain(words)
    }
    expect(document.activeElement).toBe(summary)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('a short password and a mismatched confirmation are caught before sending', async () => {
    await renderAt('/register')
    await fill({ ...complete, Password: 'short', 'Confirm password': 'different' })
    expect(screen.getByRole('alert').textContent).toContain('Use at least 8 characters.')
    expect(screen.getByRole('alert').textContent).toContain("The passwords don't match.")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('the password field says how long it must be', async () => {
    await renderAt('/register')
    const hintId = screen.getByLabelText('Password').getAttribute('aria-describedby') ?? ''
    expect(document.getElementById(hintId.split(' ')[0])?.textContent).toContain('At least 8 characters')
  })

  test("an email already in use shows the hub's answer", async () => {
    await renderAt('/register')
    fetchMock.mockResolvedValueOnce(json(409, { detail: 'An account with this email already exists. Sign in instead.' }))
    await fill(complete)
    expect(screen.getByRole('alert').textContent).toContain('An account with this email already exists.')
    expect(navigate).not.toHaveBeenCalled()
  })
})
