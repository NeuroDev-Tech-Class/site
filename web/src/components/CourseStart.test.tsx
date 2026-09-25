import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const base = {
  id: 'a1', email: 'sam@example.com', first_name: 'Sam', last_name: 'Student', role: 'student',
  status: 'approved', student_type: 'current', staff_source: null, has_password: true,
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

let fetchMock: ReturnType<typeof vi.fn>

async function renderAs(account: Partial<typeof base> | null | 'checking') {
  if (account === 'checking') fetchMock.mockReturnValueOnce(new Promise(() => undefined))
  else fetchMock.mockResolvedValueOnce(account ? json(200, { access_token: 't', account: { ...base, ...account } }) : json(401, {}))
  const { default: CourseStart } = await import('./CourseStart')
  render(<CourseStart courseId="gimp" />)
}

beforeEach(() => {
  vi.resetModules()
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('CourseStart', () => {
  test.each([null, 'checking'] as const)('signed out (%s): Sign in to start, coming back to this course', async state => {
    await renderAs(state)
    expect((await screen.findByRole('link', { name: 'Sign in to start this course' })).getAttribute('href'))
      .toBe('/sign-in?next=%2Fcourses%2Fgimp')
  })

  test('approved: lessons are on their way, and no Sign in', async () => {
    await renderAs({})
    expect(await screen.findByText('Lessons open here soon.')).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Sign in to start this course' })).toBeNull()
  })

  test('pending: waiting for the coach', async () => {
    await renderAs({ status: 'pending' })
    expect(await screen.findByText(/waiting for your tech coach to approve it/)).toBeTruthy()
  })

  test('declined: talk to a coach', async () => {
    await renderAs({ status: 'declined' })
    expect(await screen.findByText(/wasn't approved/)).toBeTruthy()
  })
})
