import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { fakeFetch, json, sentTo, signedIn } from '../../test/fake-hub'

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('astro:transitions/client', () => ({ navigate }))

let fetchMock: Mock

async function renderAt(url: string) {
  history.replaceState(null, '', url)
  const { default: VerifyForm } = await import('./VerifyForm')
  render(<VerifyForm />)
}

async function enterCode(code: string) {
  if (code) await userEvent.type(screen.getByLabelText('Code'), code)
  await userEvent.click(screen.getByRole('button', { name: 'Confirm email' }))
}

beforeEach(() => {
  vi.resetModules()
  fetchMock = fakeFetch()
  navigate.mockReset()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('VerifyForm', () => {
  test('confirms the email, signs in and goes to the waiting page', async () => {
    await renderAt('/verify?email=sam%40example.com&next=%2Fcourses%2Fgimp')
    expect(screen.getByText(/sam@example.com/)).toBeTruthy()
    fetchMock.mockResolvedValueOnce(signedIn({ status: 'pending' }))
    await enterCode('123456')
    expect(sentTo(fetchMock, '/auth/verify-email')).toEqual([{ email: 'sam@example.com', code: '123456' }])
    expect(navigate).toHaveBeenCalledWith('/waiting?next=%2Fcourses%2Fgimp')
    expect((await import('../../lib/session')).getSession().status).toBe('signed-in')
  })

  test('the code field brings up a number pad and accepts the code from the email app', async () => {
    await renderAt('/verify?email=sam%40example.com')
    const field = screen.getByLabelText('Code')
    expect(field.getAttribute('inputmode')).toBe('numeric')
    expect(field.getAttribute('autocomplete')).toBe('one-time-code')
  })

  test('anything but six digits is caught before sending', async () => {
    await renderAt('/verify?email=sam%40example.com')
    await enterCode('12a4')
    expect(screen.getByRole('alert').textContent).toContain('Enter the 6-digit code from the email.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test("a wrong code shows the hub's answer", async () => {
    await renderAt('/verify?email=sam%40example.com')
    fetchMock.mockResolvedValueOnce(json(400, { detail: 'Incorrect code.' }))
    await enterCode('000000')
    expect(screen.getByRole('alert').textContent).toContain('Incorrect code.')
    expect(navigate).not.toHaveBeenCalled()
  })

  test('without an email in the link, asks for it', async () => {
    await renderAt('/verify')
    fetchMock.mockResolvedValueOnce(signedIn({ status: 'pending' }))
    await userEvent.type(screen.getByLabelText('Email'), 'sam@example.com')
    await enterCode('123456')
    expect(sentTo(fetchMock, '/auth/verify-email')).toEqual([{ email: 'sam@example.com', code: '123456' }])
  })

  test('Send a new code sends one, then waits a minute before offering another', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await renderAt('/verify?email=sam%40example.com')
    fetchMock.mockResolvedValueOnce(json(200, { status: 'ok' }))
    const resend = screen.getByRole('button', { name: 'Send a new code' })
    await user.click(resend)
    expect(sentTo(fetchMock, '/auth/resend-code')).toEqual([{ email: 'sam@example.com' }])
    expect(screen.getByRole('status').textContent).toContain('A new code is on its way')
    expect(resend.hasAttribute('disabled')).toBe(true)
    act(() => vi.advanceTimersByTime(60_000))
    expect(resend.hasAttribute('disabled')).toBe(false)
  })
})
