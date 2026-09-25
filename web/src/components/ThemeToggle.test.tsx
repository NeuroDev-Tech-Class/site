import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import ThemeToggle from './ThemeToggle'

const root = document.documentElement

beforeEach(() => {
  localStorage.clear()
  root.classList.add('dark')
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ThemeToggle', () => {
  test('says what it will do, and switches between dark and light', async () => {
    render(<ThemeToggle />)
    await userEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }))
    expect(root.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('theme')).toBe('light')

    await userEvent.click(await screen.findByRole('button', { name: 'Switch to dark theme' }))
    expect(root.classList.contains('dark')).toBe(true)
    expect(await screen.findByRole('button', { name: 'Switch to light theme' })).toBeTruthy()
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  test('starts from the theme already on the page, and follows it when it changes', async () => {
    root.classList.remove('dark')
    render(<ThemeToggle />)
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeTruthy()
    root.classList.add('dark') // what the router's after-swap script does on the next page
    expect(await screen.findByRole('button', { name: 'Switch to light theme' })).toBeTruthy()
  })

  test('still switches when the browser blocks storage', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    render(<ThemeToggle />)
    await userEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }))
    expect(root.classList.contains('dark')).toBe(false)
  })
})
