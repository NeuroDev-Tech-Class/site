// Dark is the default, as on the old site. The choice is a convenience, so storage failing is never an error.

export type Theme = 'dark' | 'light'

interface ThemeStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

const KEY = 'theme'

export function preferredTheme(storage: ThemeStorage): Theme {
  try {
    return storage.getItem(KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function saveTheme(storage: ThemeStorage, theme: Theme): void {
  try {
    storage.setItem(KEY, theme)
  } catch {
    // private browsing or blocked storage: the theme still changes for this page
  }
}

export function applyTheme(root: HTMLElement, theme: Theme): void {
  root.classList.toggle('dark', theme === 'dark')
}
