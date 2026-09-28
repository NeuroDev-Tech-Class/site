import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { ItemContent, ItemProgress, TechAccount } from '../../lib/api'
import type { ItemPageView } from '../../lib/content'
import { fakeFetch, json, signedIn } from '../../test/fake-hub'

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('astro:transitions/client', () => ({ navigate }))

const PAGE: ItemPageView = {
  id: 'i_r', type: 'lesson', label: 'Reading', title: 'Layers',
  course: { id: 'gimp', heading: '2D Digital Art — GIMP', category: 'media' },
  unit: { id: 'u_1', title: 'Basics' },
  next: { href: '/courses/gimp#item-i_ex', text: 'Exercise 1.1: Try it.' },
}

const CONTENT: Record<string, ItemContent['content']> = {
  lesson: { title: 'Layers', subtitle: 'Stacking images', html: '<h2>Layers</h2><p>Layers stack.</p>', youtube_ids: [] },
  video: { youtube_id: 'abc123' },
  slides: { slides_url: 'https://docs.google.com/presentation/d/DECK_1/edit?usp=sharing' },
  link: { url: 'https://example.com/article' },
}

let fetchMock: Mock

interface Hub {
  account?: Partial<TechAccount> | null
  type?: keyof typeof CONTENT
  content?: ItemContent['content']
  item?: number
  progress?: Partial<ItemProgress>
  complete?: { status: number, body: unknown }
}

function hub(options: Hub = {}) {
  const type = options.type ?? 'lesson'
  let progress: ItemProgress = { item_id: 'i_r', status: null, done_at: null, opened_at: null, videos: [], ...options.progress }
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    const path = String(url).replace(/^https?:\/\/[^/]+/, '')
    const method = init?.method ?? 'GET'
    if (path.endsWith('/auth/refresh')) return options.account === null ? json(401, {}) : signedIn(options.account ?? {})
    if (path === '/api/v1/tech/items/i_r') {
      if (options.item) return json(options.item, { detail: options.item === 404 ? 'Item not found.' : 'down' })
      const item: ItemContent = {
        id: 'i_r', type, title: 'Layers', status: 'ok', tags: [], course: { id: 'gimp', title: 'GIMP' },
        unit: { id: 'u_1', title: 'Unit 1: Basics' }, content: options.content ?? CONTENT[type],
      }
      return json(200, item)
    }
    if (path === '/api/v1/tech/items/i_r/progress') return json(200, progress)
    if (path === '/api/v1/tech/items/i_r/open') return json(200, { ...progress, opened_at: '2026-10-01T15:00:00Z' })
    if (path === '/api/v1/tech/items/i_r/complete') {
      if (method === 'POST' && options.complete) return json(options.complete.status, options.complete.body)
      progress = { ...progress, status: method === 'DELETE' ? null : 'done' }
      return json(200, progress)
    }
    return json(404, { detail: 'Not found' })
  })
}

const calls = () => fetchMock.mock.calls.map(([url, init]) =>
  `${(init as RequestInit | undefined)?.method ?? 'GET'} ${String(url).replace(/^https?:\/\/[^/]+/, '')}`)

async function renderItem(page: ItemPageView = PAGE) {
  const { default: LearnItem } = await import('./LearnItem')
  render(<LearnItem page={page} />)
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

describe('who can open it', () => {
  test('signed out: a way to sign in that comes back here, and nothing about the item is fetched', async () => {
    hub({ account: null })
    await renderItem()
    expect((await screen.findByRole('link', { name: 'Sign in to open this' })).getAttribute('href'))
      .toBe('/sign-in?next=%2Flearn%2Fi_r')
    expect(calls().some(c => c.includes('/items/'))).toBe(false)
  })

  test.each([['pending', /waiting for your tech coach/], ['declined', /wasn't approved/]] as const)(
    '%s: says why, and fetches nothing about the item', async (status, words) => {
      hub({ account: { status } })
      await renderItem()
      expect(await screen.findByText(words)).toBeTruthy()
      expect(calls().some(c => c.includes('/items/'))).toBe(false)
    },
  )
})

describe('a reading', () => {
  test('shows the lesson and records that it was opened', async () => {
    hub()
    await renderItem()
    expect(await screen.findByText('Stacking images')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Layers', level: 2 })).toBeTruthy()
    await waitFor(() => expect(calls()).toContain('POST /api/v1/tech/items/i_r/open'))
  })

  test('Mark complete saves it and goes back to the course at this item', async () => {
    hub()
    await renderItem()
    await userEvent.click(await screen.findByRole('button', { name: 'Mark complete' }))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/courses/gimp?done=i_r'))
    expect(calls()).toContain('POST /api/v1/tech/items/i_r/complete')
  })

  test('a finished item says so and can be marked not done', async () => {
    hub({ progress: { status: 'done', done_at: '2026-10-01T15:00:00Z' } })
    await renderItem()
    expect(await screen.findByText('Done')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Mark not done' }))
    expect(await screen.findByRole('button', { name: 'Mark complete' })).toBeTruthy()
    expect(calls()).toContain('DELETE /api/v1/tech/items/i_r/complete')
    expect(navigate).not.toHaveBeenCalled()
  })

  test("when the hub refuses, its reason is shown and the student stays", async () => {
    hub({ complete: { status: 409, body: { detail: 'Watch the video to finish (40% watched).' } } })
    await renderItem()
    await userEvent.click(await screen.findByRole('button', { name: 'Mark complete' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Watch the video to finish (40% watched).')
    expect(navigate).not.toHaveBeenCalled()
  })

  test.each([
    [[{ video_id: 'v1', percent: 40 }], 'Watch the video to finish (40% watched).'],
    [[{ video_id: 'v1', percent: 95 }, { video_id: 'v2', percent: 0 }], 'Watch every video to finish (the least watched is at 0%).'],
  ])('a video in it under 90%% keeps the button off and says why', async (videos, words) => {
    hub({ progress: { videos } })
    await renderItem()
    const button = await screen.findByRole('button', { name: 'Mark complete' })
    expect(button.hasAttribute('disabled')).toBe(true)
    expect(screen.getByText(words)).toBeTruthy()
  })

  test('Next takes them on, even before it loads', async () => {
    hub()
    await renderItem()
    expect(screen.getByRole('link', { name: /Next: Exercise 1\.1: Try it\./ }).getAttribute('href'))
      .toBe('/courses/gimp#item-i_ex')
  })
})

describe('other kinds of item', () => {
  test('a video plays in the page and has to be watched first', async () => {
    hub({ type: 'video', progress: { videos: [{ video_id: 'abc123', percent: 0 }] } })
    await renderItem({ ...PAGE, type: 'video', label: 'Video' })
    const player = await screen.findByTitle('Layers')
    expect(player.getAttribute('src')).toContain('/embed/abc123')
    expect(screen.getByText('Watch the video to finish (0% watched).')).toBeTruthy()
  })

  test('slides are embedded, with a way to open them in a new tab', async () => {
    hub({ type: 'slides' })
    await renderItem({ ...PAGE, type: 'slides', label: 'Slideshow' })
    const deck = await screen.findByTitle('Layers')
    expect(deck.getAttribute('src')).toBe('https://docs.google.com/presentation/d/DECK_1/embed?start=false&loop=false')
    const open = screen.getByRole('link', { name: /Open the slides in a new tab/ })
    expect([open.getAttribute('href'), open.getAttribute('target')])
      .toEqual(['https://docs.google.com/presentation/d/DECK_1/edit?usp=sharing', '_blank'])
  })

  test('a link opens in a new tab, safely', async () => {
    hub({ type: 'link' })
    await renderItem({ ...PAGE, type: 'link', label: 'Link' })
    const open = await screen.findByRole('link', { name: /Open Layers/ })
    expect([open.getAttribute('href'), open.getAttribute('target'), open.getAttribute('rel')])
      .toEqual(['https://example.com/article', '_blank', 'noopener noreferrer'])
    expect(screen.getByText('example.com')).toBeTruthy()
  })
})

describe('when it goes wrong', () => {
  test('an item that is gone says so and points back to the course', async () => {
    hub({ item: 404 })
    await renderItem()
    expect(await screen.findByText("This item isn't available any more.")).toBeTruthy()
    expect(screen.getByRole('link', { name: /Back to 2D Digital Art — GIMP/ }).getAttribute('href')).toBe('/courses/gimp')
  })

  test('the hub not answering says to try again', async () => {
    hub({ item: 500 })
    await renderItem()
    expect(await screen.findByText("Couldn't load this. Reload the page to try again.")).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Mark complete' })).toBeNull()
  })
})
