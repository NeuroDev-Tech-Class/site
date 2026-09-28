import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import ProgressRing from './ProgressRing'

afterEach(cleanup)

test.each([[0, '0%'], [37, '37%'], [100, '100%']])('%i%% is drawn and said in words', (percent, text) => {
  render(<ProgressRing percent={percent} />)
  const ring = screen.getByRole('img', { name: `${percent}% complete` })
  expect(ring.textContent).toContain(text)
  const arc = ring.querySelector('[data-arc]') as SVGCircleElement
  expect(Number(arc.getAttribute('stroke-dashoffset'))).toBeCloseTo(100 - percent)
})

test('values outside 0 to 100 are held inside it', () => {
  render(<ProgressRing percent={140} />)
  expect(screen.getByRole('img', { name: '100% complete' })).toBeTruthy()
})
