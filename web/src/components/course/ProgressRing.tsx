// A ring filled to `percent` in the page's --accent colour, with the number in the middle
export default function ProgressRing({ percent, size = 64 }: { percent: number, size?: number }) {
  const value = Math.min(100, Math.max(0, Math.round(percent)))
  return (
    <div role="img" aria-label={`${value}% complete`} className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" strokeWidth="3.5" />
        <circle
          data-arc
          cx="18"
          cy="18"
          r="15.9"
          fill="none"
          stroke="var(--accent, var(--color-brand-cyan))"
          strokeWidth="3.5"
          strokeLinecap={value > 0 ? 'round' : 'butt'}
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset={100 - value}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="font-heading text-sm font-bold">{value}%</span>
    </div>
  )
}
