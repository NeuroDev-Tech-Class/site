import { useRef, useState, type KeyboardEvent } from 'react'
import Icon from '../Icon'

function Slide({ html, number, total }: { html: string, number: number, total: number }) {
  return (
    <div role="group" aria-label={`Slide ${number} of ${total}`}
      className="lesson aspect-video overflow-y-auto rounded-lg border border-(--border) bg-(--panel) p-6 sm:p-10 [&_img]:max-h-[32vh] [&_img]:w-auto [&_img]:bg-white [&_p:has(>img)]:mr-4 [&_p:has(>img)]:inline-block [&_p:has(>img)]:align-top"
      dangerouslySetInnerHTML={{ __html: html }} />
  )
}

/** A deck rebuilt in the site: one slide at a time (buttons or arrow keys), full screen, or every slide in a column */
export default function SlideDeck({ title, slides }: { title: string, slides: string[] }) {
  const [index, setIndex] = useState(0)
  const [all, setAll] = useState(false)
  const deck = useRef<HTMLElement>(null)
  const last = slides.length - 1
  const go = (to: number) => setIndex(Math.min(last, Math.max(0, to)))

  function keys(event: KeyboardEvent) {
    const to = { ArrowRight: index + 1, ArrowDown: index + 1, ArrowLeft: index - 1, ArrowUp: index - 1, Home: 0, End: last }[event.key]
    if (all || to === undefined) return
    event.preventDefault()
    go(to)
  }

  return (
    <section ref={deck} aria-label={`Slides: ${title}`} tabIndex={-1} onKeyDown={keys}
      className="flex flex-col gap-3 bg-(--bg) focus:outline-none">
      {all
        ? slides.map((html, i) => <Slide key={i} html={html} number={i + 1} total={slides.length} />)
        : <Slide html={slides[index]} number={index + 1} total={slides.length} />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {!all && slides.length > 1 && (
          <div className="flex items-center gap-2">
            <button type="button" className="btn-quiet" aria-label="Previous slide" disabled={index === 0} onClick={() => go(index - 1)}>
              <Icon name="back" size={18} />
            </button>
            <span aria-live="polite" className="min-w-16 text-center font-semibold">{index + 1} / {slides.length}</span>
            <button type="button" className="btn-quiet" aria-label="Next slide" disabled={index === last} onClick={() => go(index + 1)}>
              <Icon name="arrow" size={18} />
            </button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {slides.length > 1 && (
            <button type="button" className="btn-quiet" onClick={() => setAll(!all)}>{all ? 'One slide at a time' : 'Show all slides'}</button>
          )}
          {!all && (
            <button type="button" className="btn-quiet" onClick={() => void deck.current?.requestFullscreen?.().catch(() => undefined)}>
              Full screen
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
