import { describe, expect, test } from 'vitest'
import { applyTheme, preferredTheme, saveTheme } from './theme'

const storage = (values: Record<string, string> = {}) => ({
  getItem: (key: string) => values[key] ?? null,
  setItem: (key: string, value: string) => { values[key] = value },
  values,
})
const broken = {
  getItem: () => { throw new Error('storage blocked') },
  setItem: () => { throw new Error('storage blocked') },
}

describe('theme preference', () => {
  test('dark unless the person chose light', () => {
    expect(preferredTheme(storage())).toBe('dark')
    expect(preferredTheme(storage({ theme: 'light' }))).toBe('light')
    expect(preferredTheme(storage({ theme: 'dark' }))).toBe('dark')
    expect(preferredTheme(storage({ theme: 'sparkly' }))).toBe('dark')
  })

  test('blocked storage falls back to dark and saving never throws', () => {
    expect(preferredTheme(broken)).toBe('dark')
    expect(() => saveTheme(broken, 'light')).not.toThrow()
  })

  test('saving remembers the choice', () => {
    const store = storage()
    saveTheme(store, 'light')
    expect(store.values.theme).toBe('light')
  })

  test('applying sets the class the styles key off', () => {
    const root = document.createElement('html')
    applyTheme(root, 'dark')
    expect(root.classList.contains('dark')).toBe(true)
    applyTheme(root, 'light')
    expect(root.classList.contains('dark')).toBe(false)
  })
})
