import { ICON_PATHS, type IconName } from '../lib/icons'

// The React twin of Icon.astro; decorative, so hidden from screen readers
export default function Icon({ name, size = 22, className }: { name: IconName, size?: number, className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] }}
    />
  )
}
