import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const base = {
  id: 'a1', email: 'sam@example.com', first_name: 'Sam', last_name: 'Student', role: 'student',
  status: 'approved', student_type: 'current', staff_source: null, has_password: true,
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

let fetchMock: ReturnType<typeof vi.fn>

async function renderAs(account: Partial<typeof base> | null) {
  fetchMock.mockResolvedValueOnce(account ? json(200, { access_token: 't', account: { ...base, ...account } }) : json(401, {}))
  const { default: UserMenu } = await import('./UserMenu')
  render(<UserMenu />)
}

const openMenu = async () => userEvent.click(await screen.findByRole('button', { name: /Sam Student/ }))

beforeEach(() => {
  vi.resetModules()
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  history.replaceState(null, '', '/')
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('UserMenu', () => {
  test('signed out: offers Sign in, which brings them back to this page, and Register', async () => {
    history.replaceState(null, '', '/courses/gimp')
    await renderAs(null)
    expect((await screen.findByRole('link', { name: 'Sign in' })).getAttribute('href'))
      .toBe('/sign-in?next=%2Fcourses%2Fgimp')
    expect(screen.getByRole('link', { name: 'Register' }).getAttribute('href')).toBe('/register')
  })

  test('signed out on the home page: Sign in needs no way back', async () => {
    await renderAs(null)
    expect((await screen.findByRole('link', { name: 'Sign in' })).getAttribute('href')).toBe('/sign-in')
  })

  test('shows nothing to click while it is still checking, then the right links', async () => {
    let answer: (response: Response) => void = () => undefined
    fetchMock.mockReturnValueOnce(new Promise<Response>(resolve => { answer = resolve }))
    const { default: UserMenu } = await import('./UserMenu')
    render(<UserMenu />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
    answer(json(401, {}))
    expect(await screen.findByRole('link', { name: 'Sign in' })).toBeTruthy()
  })

  test('approved student: name and email, My courses, no Dashboard, Sign out', async () => {
    await renderAs({})
    await openMenu()
    expect(screen.getByText('sam@example.com')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'My courses' }).getAttribute('href')).toBe('/my-courses')
    expect(screen.queryByRole('link', { name: 'Dashboard' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy()
  })

  test.each(['admin', 'superadmin'])('%s: also has the Dashboard', async role => {
    await renderAs({ role })
    await openMenu()
    expect(screen.getByRole('link', { name: 'Dashboard' }).getAttribute('href')).toBe('/admin')
  })

  test.each([
    ['pending', 'Waiting for approval'],
    ['declined', 'Not approved'],
  ])('%s: says so, with no course links', async (status, words) => {
    await renderAs({ status })
    await openMenu()
    expect(screen.getByText(words)).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'My courses' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy()
  })

  test('the menu button says whether it is open, and Escape closes it and returns focus', async () => {
    await renderAs({})
    const button = await screen.findByRole('button', { name: /Sam Student/ })
    expect(button.getAttribute('aria-expanded')).toBe('false')
    await userEvent.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    await userEvent.keyboard('{Escape}')
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull()
    expect(document.activeElement).toBe(button)
  })

  test('a click outside closes the menu', async () => {
    await renderAs({})
    await openMenu()
    await userEvent.click(document.body)
    expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull()
  })

  test('Sign out ends the session and goes back to Sign in and Register', async () => {
    await renderAs({})
    await openMenu()
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    await waitFor(() => expect(screen.getByRole('link', { name: 'Sign in' })).toBeTruthy())
    expect(String(fetchMock.mock.calls.at(-1)?.[0])).toMatch(/\/logout$/)
  })
})
