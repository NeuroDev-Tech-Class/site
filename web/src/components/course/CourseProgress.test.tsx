import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { ItemStatus } from '../../lib/api'
import type { UnitView } from '../../lib/content'
import { fakeCourseHub, fakeFetch } from '../../test/fake-hub'

const UNITS: UnitView[] = [
  { id: 'u_1', number: '1', title: 'Basics', description: 'Start here.', items: [
    { id: 'i_r', type: 'lesson', label: 'Reading', title: 'Layers', html: null, exercise: false, counts: true },
    { id: 'i_ex', type: 'note', label: 'Note', title: '', html: '<b>Exercise 1.1:</b> Try it.', exercise: true, counts: true },
    { id: 'i_n', type: 'note', label: 'Note', title: '', html: 'Tip: save often.', exercise: false, counts: false },
    { id: 'i_c', type: 'checkpoint', label: 'Checkpoint', title: 'Final Project', html: null, exercise: false, counts: true },
  ] },
  { id: 'u_2', number: '2', title: 'More', description: '', items: [
    { id: 'i_v', type: 'video', label: 'Video', title: 'Watch this', html: null, exercise: false, counts: true },
  ] },
]
const PAGE_IDS = ['i_r', 'i_v']
const COUNTED = [{ id: 'i_r' }, { id: 'i_ex' }, { id: 'i_c', type: 'checkpoint' }, { id: 'i_v' }]
const status = (item_id: string, value: ItemStatus['status']): ItemStatus =>
  ({ item_id, status: value, done_at: null, opened_at: null })

let fetchMock: Mock

async function renderPage(options: Omit<Parameters<typeof fakeCourseHub>[1], 'counted'> = {}) {
  const hub = fakeCourseHub(fetchMock, { counted: COUNTED, ...options })
  const { default: CourseProgressPanel } = await import('./CourseProgressPanel')
  const { default: CourseUnits } = await import('./CourseUnits')
  render(<><CourseProgressPanel courseId="gimp" pageIds={PAGE_IDS} /><CourseUnits courseId="gimp" units={UNITS} /></>)
  return hub
}

const unit = (title: string) => screen.getByRole('heading', { name: title }).closest('section') as HTMLElement
const exercise = () => screen.queryByRole('checkbox', { name: /Exercise 1\.1/ })

beforeEach(() => {
  vi.resetModules()
  fetchMock = fakeFetch()
  history.replaceState(null, '', '/courses/gimp')
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('signed out', () => {
  test('the page reads as it always has, with a way to sign in and nothing fetched about progress', async () => {
    const hub = await renderPage({ account: null })
    expect((await screen.findByRole('link', { name: 'Sign in to start this course' })).getAttribute('href'))
      .toBe('/sign-in?next=%2Fcourses%2Fgimp')
    expect(screen.getByText('Layers')).toBeTruthy()
    expect(screen.getByText('Tip: save often.')).toBeTruthy()
    expect(exercise()).toBeNull()
    expect(screen.queryByText(/of \d+ done/)).toBeNull()
    expect(hub.calls().some(c => c.includes('/progress'))).toBe(false)
  })
})

describe.each([
  ['pending', /waiting for your tech coach to approve it/],
  ['declined', /wasn't approved/],
] as const)('%s', (accountStatus, words) => {
  test('says why, shows no checkboxes and fetches no progress', async () => {
    const hub = await renderPage({ account: { status: accountStatus } })
    expect(await screen.findByText(words)).toBeTruthy()
    expect(exercise()).toBeNull()
    expect(hub.calls().some(c => c.includes('/progress'))).toBe(false)
  })
})

describe('approved', () => {
  test('a new student sees 0%, Start at the first item, and each unit at 0 done', async () => {
    await renderPage()
    expect(await screen.findByRole('img', { name: '0% complete' })).toBeTruthy()
    expect(screen.getByText('0 of 4 done')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Start this course/ }).getAttribute('href')).toBe('/learn/i_r')
    expect(within(unit('Basics')).getByText('0 of 3 done')).toBeTruthy()
    expect(within(unit('More')).getByText('0 of 1 done')).toBeTruthy()
  })

  test('progress shows as a percent, Continue, and a word on each finished item', async () => {
    await renderPage({ items: [status('i_r', 'done'), status('i_c', 'submitted')] })
    expect(await screen.findByRole('img', { name: '25% complete' })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Continue/ }).getAttribute('href')).toBe('#item-i_ex')
    const basics = unit('Basics')
    expect(within(basics).getByText('1 of 3 done')).toBeTruthy()
    expect(within(document.getElementById('item-i_r') as HTMLElement).getByText('Done')).toBeTruthy()
    expect(within(document.getElementById('item-i_c') as HTMLElement).getByText('Submitted')).toBeTruthy()
    expect(within(document.getElementById('item-i_v') as HTMLElement).queryByText(/Done|Submitted/)).toBeNull()
  })

  test.each([
    ['returned', 'Needs revision'],
    ['done', 'Complete'],
  ] as const)('a checkpoint %s says %s', async (value, words) => {
    await renderPage({ items: [status('i_c', value)] })
    expect(await within(await waitForItem('i_c')).findByText(words)).toBeTruthy()
  })

  test('everything done says so instead of Continue', async () => {
    await renderPage({ items: COUNTED.map(c => status(c.id, 'done')) })
    expect(await screen.findByText('You finished this course!')).toBeTruthy()
    expect(screen.queryByRole('link', { name: /Continue|Start this course/ })).toBeNull()
  })

  test('ticking an exercise marks it complete, and the unit, total and ring all move', async () => {
    const hub = await renderPage({ items: [status('i_r', 'done')] })
    const box = await screen.findByRole('checkbox', { name: /Exercise 1\.1/ })
    expect((box as HTMLInputElement).checked).toBe(false)
    await userEvent.click(box)
    await waitFor(() => expect(screen.getByRole('img', { name: '50% complete' })).toBeTruthy())
    expect((box as HTMLInputElement).checked).toBe(true)
    expect(within(unit('Basics')).getByText('2 of 3 done')).toBeTruthy()
    expect(hub.calls()).toContain('POST /api/v1/tech/items/i_ex/complete')

    await userEvent.click(box)
    await waitFor(() => expect((box as HTMLInputElement).checked).toBe(false))
    expect(hub.calls()).toContain('DELETE /api/v1/tech/items/i_ex/complete')
  })

  test('a plain note has no checkbox', async () => {
    await renderPage()
    await screen.findByRole('checkbox', { name: /Exercise 1\.1/ })
    expect(screen.getAllByRole('checkbox')).toHaveLength(1)
  })

  test("when a tick can't be saved it springs back and says so", async () => {
    await renderPage({ failComplete: true })
    const box = await screen.findByRole('checkbox', { name: /Exercise 1\.1/ })
    await userEvent.click(box)
    expect(await screen.findByText("Couldn't save that. Please try again.")).toBeTruthy()
    expect((box as HTMLInputElement).checked).toBe(false)
  })

  test('coming back from Mark complete scrolls to the item, highlights it, and tidies the address', async () => {
    history.replaceState(null, '', '/courses/gimp?done=i_v')
    await renderPage({ items: [status('i_v', 'done')] })
    const item = await waitForItem('i_v')
    await waitFor(() => expect(item.getAttribute('data-just-done')).toBe('true'))
    expect(item.scrollIntoView).toHaveBeenCalled()
    expect(window.location.search).toBe('')
  })

  test('signing out from the menu on this page takes the progress and checkboxes away', async () => {
    await renderPage({ items: [status('i_r', 'done')] })
    await screen.findByRole('checkbox', { name: /Exercise 1\.1/ })
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    const { signOut } = await import('../../lib/session')
    await act(() => signOut())
    expect(exercise()).toBeNull()
    expect(screen.queryByText(/of \d+ done/)).toBeNull()
    expect(screen.getByRole('link', { name: 'Sign in to start this course' })).toBeTruthy()
  })

  test('readings, videos, slides and links open their own page; checkpoints and notes do not', async () => {
    await renderPage()
    expect((await screen.findByRole('link', { name: 'Layers' })).getAttribute('href')).toBe('/learn/i_r')
    expect(screen.getByRole('link', { name: 'Watch this' }).getAttribute('href')).toBe('/learn/i_v')
    expect(screen.queryByRole('link', { name: 'Final Project' })).toBeNull()
  })

  test('units and items have anchors to jump to', async () => {
    await renderPage()
    expect(unit('Basics').id).toBe('unit-u_1')
    expect(document.getElementById('item-i_ex')).toBeTruthy()
  })
})

async function waitForItem(id: string): Promise<HTMLElement> {
  return waitFor(() => {
    const el = document.getElementById(`item-${id}`)
    if (!el) throw new Error(`no item-${id}`)
    return el
  })
}
