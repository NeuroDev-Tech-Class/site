import { describe, expect, test } from 'vitest'
import type { CheckpointContent } from './api'
import { sizeWords, stillNeeded, withoutBlanks } from './checkpoint'

const checkpoint = (overrides: Partial<CheckpointContent>): CheckpointContent => ({
  id: 'c_1', title: 'Budget', instructions_html: '', fields: [], required_one_of: [], requires_sign_off: false,
  has_starter: false, ...overrides,
})

describe('stillNeeded', () => {
  test('a required checklist with no minimum needs every box', () => {
    const cp = checkpoint({ fields: [{ id: 'steps', type: 'checklist', label: 'Steps', required: true, items: ['A', 'B'] }] })
    expect(stillNeeded(cp, { steps: ['A'] })).toEqual(['Steps: tick every box.'])
    expect(stillNeeded(cp, { steps: ['A', 'B'] })).toEqual([])
  })

  test('one answer from a group is enough', () => {
    const cp = checkpoint({
      fields: [
        { id: 'link', type: 'url', label: 'A link', required: false },
        { id: 'file', type: 'file', label: 'A file', required: false },
      ],
      required_one_of: [['link', 'file']],
    })
    expect(stillNeeded(cp, {})).toEqual(['One of these: A link, A file.'])
    expect(stillNeeded(cp, { file: ['f1'] })).toEqual([])
  })

  test('whitespace is not an answer, and the coach sign-off is never asked of the student', () => {
    const cp = checkpoint({
      fields: [
        { id: 'title', type: 'shortText', label: 'Title', required: true },
        { id: 'seen', type: 'mentorSignOff', label: 'Seen', required: true },
      ],
    })
    expect(stillNeeded(cp, { title: '   ' })).toEqual(['Title: this is required.'])
  })
})

test('withoutBlanks drops cleared answers', () => {
  expect(withoutBlanks({ a: 'x', b: ' ', c: [], d: ['y'] })).toEqual({ a: 'x', d: ['y'] })
})

test('sizeWords', () => {
  expect(sizeWords(200)).toBe('1 KB')
  expect(sizeWords(2048)).toBe('2 KB')
  expect(sizeWords(5 * 1024 * 1024)).toBe('5 MB')
  expect(sizeWords(2.5 * 1024 * 1024)).toBe('2.5 MB')
})
