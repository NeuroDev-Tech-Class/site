import { useSyncExternalStore } from 'react'
import { applyTheme, saveTheme, type Theme } from '../lib/theme'

// The source of truth is the class on <html> (set before paint by Base.astro, and again after each navigation)
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}
const currentTheme = (): Theme => (document.documentElement.classList.contains('dark') ? 'dark' : 'light')
const buildTimeTheme = (): Theme => 'dark'

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, currentTheme, buildTimeTheme)
  const next: Theme = theme === 'dark' ? 'light' : 'dark'

  function toggle() {
    applyTheme(document.documentElement, next)
    saveTheme(localStorage, next)
  }

  return (
    <button type="button" className="btn-quiet" onClick={toggle}>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        {next === 'light'
          ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>
          : <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />}
      </svg>
      {`Switch to ${next} theme`}
    </button>
  )
}
