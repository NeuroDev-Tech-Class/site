import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest'

const SLIDES = [
  '<h2>What Is Version Control?</h2><p>A way to keep every version.</p>',
  '<h2>Why use it</h2><ul><li>Go back</li></ul>',
  '<h2>Try it</h2><p>Make a commit.</p>',
]

async function renderDeck(slides = SLIDES) {
  const { default: SlideDeck } = await import('./SlideDeck')
  render(<SlideDeck title="What Is Version Control?" slides={slides} />)
  return screen.getByRole('region', { name: 'Slides: What Is Version Control?' })
}

const shown = () => screen.getByRole('group', { name: /^Slide \d+ of \d+$/ })

beforeAll(async () => { await import('./SlideDeck') }, 30_000)
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('the slide viewer', () => {
  test('shows one slide at a time, with where you are', async () => {
    await renderDeck()
    expect(shown().getAttribute('aria-label')).toBe('Slide 1 of 3')
    expect(within(shown()).getByRole('heading', { name: 'What Is Version Control?' })).toBeTruthy()
    expect(screen.queryByText('Why use it')).toBeNull()
    expect(screen.getByText('1 / 3')).toBeTruthy()
  })

  test('Next and Previous move through the deck and stop at the ends', async () => {
    await renderDeck()
    const previous = screen.getByRole('button', { name: 'Previous slide' }) as HTMLButtonElement
    const next = screen.getByRole('button', { name: 'Next slide' }) as HTMLButtonElement
    expect(previous.disabled).toBe(true)
    await userEvent.click(next)
    expect(shown().getAttribute('aria-label')).toBe('Slide 2 of 3')
    await userEvent.click(next)
    expect(next.disabled).toBe(true)
    expect(within(shown()).getByText('Make a commit.')).toBeTruthy()
    await userEvent.click(previous)
    expect(shown().getAttribute('aria-label')).toBe('Slide 2 of 3')
  })

  test('the arrow keys move through the deck once it has focus', async () => {
    const deck = await renderDeck()
    deck.focus()
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
    expect(shown().getAttribute('aria-label')).toBe('Slide 3 of 3')
    await userEvent.keyboard('{ArrowLeft}')
    expect(shown().getAttribute('aria-label')).toBe('Slide 2 of 3')
    await userEvent.keyboard('{Home}')
    expect(shown().getAttribute('aria-label')).toBe('Slide 1 of 3')
    await userEvent.keyboard('{End}')
    expect(shown().getAttribute('aria-label')).toBe('Slide 3 of 3')
  })

  test('"Show all slides" lists every slide in order, and back to one at a time', async () => {
    await renderDeck()
    await userEvent.click(screen.getByRole('button', { name: 'Show all slides' }))
    const all = screen.getAllByRole('group', { name: /^Slide \d+ of 3$/ })
    expect(all.map(slide => slide.getAttribute('aria-label'))).toEqual(['Slide 1 of 3', 'Slide 2 of 3', 'Slide 3 of 3'])
    expect(screen.queryByRole('button', { name: 'Next slide' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'One slide at a time' }))
    expect(screen.getAllByRole('group', { name: /^Slide/ })).toHaveLength(1)
  })

  test('Full screen asks the browser to show the slides full screen', async () => {
    const deck = await renderDeck()
    const request = vi.fn().mockResolvedValue(undefined)
    deck.requestFullscreen = request
    await userEvent.click(screen.getByRole('button', { name: 'Full screen' }))
    expect(request).toHaveBeenCalled()
  })

  test('a one-slide deck has nothing to move through', async () => {
    await renderDeck(SLIDES.slice(0, 1))
    expect(screen.queryByRole('button', { name: 'Next slide' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Show all slides' })).toBeNull()
  })
})
