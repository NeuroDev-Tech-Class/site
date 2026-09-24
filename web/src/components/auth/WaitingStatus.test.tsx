import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { json, fakeFetch, signedIn } from '../../test/fake-hub'
import type { TechAccount } from '../../lib/api'

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('astro:transitions/client', () => ({ navigate }))

let fetchMock: Mock

async function renderAs(status: TechAccount['status'] | null, url = '/waiting') {
  history.replaceState(null, '', url)
  fetchMock.mockResolvedValueOnce(status ? signedIn({ status }) : json(401, {}))
  const { default: WaitingStatus } = await import('./WaitingStatus')
  render(<WaitingStatus />)
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

describe('WaitingStatus', () => {
  test('pending: explains the wait and offers Sign out, which goes home', async () => {
    await renderAs('pending')
    expect(await screen.findByText(/waiting for your tech coach to approve it/)).toBeTruthy()
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/'))
  })

  test('declined: says to talk to a coach, with Sign out', async () => {
    await renderAs('declined')
    expect(await screen.findByText(/wasn't approved/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy()
  })

  test('approved: goes straight on to where they were heading', async () => {
    await renderAs('approved', '/waiting?next=%2Fcourses%2Fgimp')
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/courses/gimp', { history: 'replace' }))
  })

  test('signed out: offers Sign in', async () => {
    await renderAs(null)
    expect((await screen.findByRole('link', { name: 'Sign in' })).getAttribute('href')).toBe('/sign-in')
  })
})
