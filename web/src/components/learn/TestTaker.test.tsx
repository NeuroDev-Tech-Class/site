import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import type { ItemContent, TestAttempt, TestQuestion, TestState, TestView } from '../../lib/api'
import type { ItemPageView } from '../../lib/content'
import { fakeFetch, fakeHub, json, requests } from '../../test/fake-hub'

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('astro:transitions/client', () => ({ navigate }))

const PAGE: ItemPageView = {
  id: 'i_t', type: 'test', label: 'Test', title: 'Unit 2 Test',
  course: { id: 'gimp', heading: '2D Digital Art — GIMP', category: 'media' },
  unit: { id: 'u_2', title: 'Tests' },
  previous: { href: '/learn/i_r', text: 'Reading: Layers' },
  next: { href: '/learn/i_n', text: 'Reading: Filters' },
}

const QUESTIONS: TestQuestion[] = [
  { number: 1, type: 'mc', prompt_html: '<p>Pick A.</p>', points: 2, choices: ['A', 'B'] },
  { number: 2, type: 'tf', prompt_html: '<p>The sky is blue.</p>', points: 1 },
  { number: 3, type: 'short', prompt_html: '<p>Which command lists a folder?</p>', points: 1 },
  { number: 4, type: 'match', prompt_html: '<p>Match them.</p>', points: 2, rows: ['One', 'Two'], options: ['1', '2'] },
]
const TEST: TestView = {
  item_id: 'i_t', title: 'Unit 2 Test', instructions_html: '<p>Take your time.</p>', pass_percent: 70,
  attempts_allowed: 2, total_points: 6, questions: QUESTIONS,
}
const ALL = { 1: 0, 2: true, 3: 'ls', 4: [0, 1] }

const state = (overrides: Partial<TestState> = {}): TestState => ({
  ready: true, test: TEST, attempts_allowed: 2, attempts_used: 0, can_start: true, finished: false, waiting: false,
  reason: null, draft: null, attempts: [], best_attempt: null, ...overrides,
})

const attempt = (overrides: Partial<TestAttempt> = {}): TestAttempt => ({
  attempt: 1, status: 'graded', status_label: 'Not passed', score_label: '3 / 6 (50%)',
  submitted_at: '2026-10-01T15:00:00Z', graded_at: '2026-10-01T15:00:00Z', total_score: 3, total_max: 6,
  passed: false, provisional: false, feedback: null, questions: QUESTIONS,
  answers: { 1: 1, 2: true, 3: 'ls', 4: [0, 0] },
  marks: {
    1: { points: 0, max: 2, right: false }, 2: { points: 1, max: 1, right: true }, 3: { points: 1, max: 1, right: true },
    4: { points: 1, max: 2, right: false, rows: [true, false] },
  },
  key: null, ...overrides,
})

const KEY = { 1: { answer: 0, explanation_html: '<p>Because A comes first.</p>' }, 2: { answer: true }, 3: { accept: ['ls', 'ls -l'] }, 4: { answer: [0, 1] } }

let fetchMock: Mock
let saved: unknown[]
let handedIn: unknown[]

function hub(start: TestState, { after, save = 200 }: { after?: TestState, save?: number } = {}) {
  let current = start
  saved = []
  handedIn = []
  const item: ItemContent = {
    id: 'i_t', type: 'test', title: 'Unit 2 Test', status: 'ok', tags: [], course: { id: 'gimp', title: 'GIMP' },
    unit: { id: 'u_2', title: 'Unit 2: Tests' }, content: {},
  }
  fakeHub(fetchMock, {}, {
    '/api/v1/tech/items/i_t': () => json(200, item),
    '/api/v1/tech/items/i_t/progress': () => json(200, { item_id: 'i_t', status: null, done_at: null, opened_at: 'x', videos: [] }),
    '/api/v1/tech/items/i_t/test': () => json(200, current),
    '/api/v1/tech/items/i_t/test/start': () => {
      current = { ...current, can_start: false, draft: { attempt: current.attempts_used + 1, answers: {}, saved_at: null } }
      return json(200, current)
    },
    '/api/v1/tech/items/i_t/test/answers': ({ body }) => {
      saved.push(body)
      return save === 200 ? json(200, { attempt: 1, answers: (body as { answers: object }).answers, saved_at: 'now' }) : json(save, {})
    },
    '/api/v1/tech/items/i_t/test/submit': ({ body }) => {
      handedIn.push(body)
      current = after ?? current
      return json(200, current)
    },
  })
}

async function renderTest() {
  const { default: LearnItem } = await import('./LearnItem')
  render(<LearnItem page={PAGE} />)
}

const question = (n: number) => screen.getByRole('group', { name: new RegExp(`^Question ${n}\\b`) })

beforeAll(async () => { await import('./LearnItem') }, 30_000)

beforeEach(() => {
  vi.resetModules()
  fetchMock = fakeFetch()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('before starting', () => {
  test('a test not uploaded yet says so', async () => {
    hub(state({ ready: false, test: null, attempts_allowed: null, can_start: false, reason: "This test isn't ready yet." }))
    await renderTest()
    expect(await screen.findByText("This test isn't ready yet.")).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Start/ })).toBeNull()
  })

  test('a test the coach marked done says so, with no attempt to start', async () => {
    hub(state({ can_start: false, finished: true, reason: 'Your coach has marked this test done.' }))
    await renderTest()
    expect(await screen.findByText('Your coach has marked this test done.')).toBeTruthy()
    expect(screen.getByText('4 questions · 6 points · pass mark 70%')).toBeTruthy()
    expect(screen.queryByText(/attempt 1 of 2/)).toBeNull()
    expect(screen.queryByRole('button', { name: /Start/ })).toBeNull()
  })

  test('the start screen says what to expect, and the bar has no Mark complete', async () => {
    hub(state())
    await renderTest()
    expect(await screen.findByText('4 questions · 6 points · pass mark 70% · attempt 1 of 2')).toBeTruthy()
    expect(screen.getByText('Take your time.')).toBeTruthy()
    expect(screen.queryByRole('group', { name: /Question 1/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Start the test' })).toBeTruthy()
    const bar = screen.getByRole('navigation', { name: 'Course steps' })
    expect(within(bar).queryByRole('button', { name: /Mark complete/ })).toBeNull()
    expect(within(bar).getByRole('link', { name: /Next:/ })).toBeTruthy()
  })
})

describe('taking it', () => {
  test('starting shows every question, counts the answered ones, and saves as it goes', async () => {
    hub(state())
    await renderTest()
    await userEvent.click(await screen.findByRole('button', { name: 'Start the test' }))
    expect(await screen.findByText('0 of 4 answered')).toBeTruthy()
    await userEvent.click(within(question(1)).getByRole('radio', { name: 'A' }))
    await userEvent.click(within(question(2)).getByRole('radio', { name: 'True' }))
    await userEvent.type(within(question(3)).getByRole('textbox'), 'ls')
    await userEvent.selectOptions(within(question(4)).getByRole('combobox', { name: 'One' }), '1')
    expect(screen.getByText('3 of 4 answered')).toBeTruthy()
    await userEvent.selectOptions(within(question(4)).getByRole('combobox', { name: 'Two' }), '2')
    expect(screen.getByText('4 of 4 answered')).toBeTruthy()
    await waitFor(() => expect(saved.at(-1)).toEqual({ answers: { 1: 0, 2: true, 3: 'ls', 4: [0, 1] } }), { timeout: 3000 })
    expect(await screen.findByText('Saved')).toBeTruthy()
  })

  test('an attempt already started carries on with its saved answers', async () => {
    hub(state({ can_start: false, draft: { attempt: 1, answers: { 1: 1 }, saved_at: '2026-10-01T15:00:00Z' } }))
    await renderTest()
    expect(await screen.findByText('1 of 4 answered')).toBeTruthy()
    expect((within(question(1)).getByRole('radio', { name: 'B' }) as HTMLInputElement).checked).toBe(true)
    expect(screen.queryByRole('button', { name: /Start/ })).toBeNull()
  })

  test('handing in asks first and names the questions left unanswered', async () => {
    hub(state({ can_start: false, draft: { attempt: 1, answers: {}, saved_at: null } }), { after: state({ can_start: true, attempts_used: 1, attempts: [attempt()] }) })
    await renderTest()
    await userEvent.click(within(await screen.findByRole('group', { name: /^Question 1\b/ })).getByRole('radio', { name: 'A' }))
    await userEvent.click(screen.getByRole('button', { name: 'Hand in' }))
    expect(screen.getByText("You haven't answered questions 2, 3 and 4. Hand it in anyway? You can't change your answers afterwards.")).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Keep working' }))
    expect(screen.queryByText(/Hand it in anyway/)).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Hand in' }))
    await userEvent.click(screen.getByRole('button', { name: 'Hand it in' }))
    expect(handedIn).toEqual([{ answers: { 1: 0 } }])
    expect(await screen.findByText('Not passed · 3 / 6 (50%)')).toBeTruthy()
  })

  test('with everything answered, handing in only asks to confirm', async () => {
    hub(state({ can_start: false, draft: { attempt: 1, answers: ALL, saved_at: null } }))
    await renderTest()
    await userEvent.click(await screen.findByRole('button', { name: 'Hand in' }))
    expect(screen.getByText("Hand in your answers? You can't change them afterwards.")).toBeTruthy()
  })

  test("a save that fails says so and keeps the answers on the page", async () => {
    hub(state({ can_start: false, draft: { attempt: 1, answers: {}, saved_at: null } }), { save: 500 })
    await renderTest()
    await userEvent.click(within(await screen.findByRole('group', { name: /^Question 1\b/ })).getByRole('radio', { name: 'A' }))
    expect(await screen.findByText("Couldn't save. Your answers are still here; keep going and it will try again.", {}, { timeout: 3000 })).toBeTruthy()
    expect((within(question(1)).getByRole('radio', { name: 'A' }) as HTMLInputElement).checked).toBe(true)
  })
})

describe('the result', () => {
  test('says the score and which questions were wrong, without the right answers, and offers another try', async () => {
    hub(state({ attempts_used: 1, attempts: [attempt()], best_attempt: 1 }))
    await renderTest()
    expect(await screen.findByText('Not passed · 3 / 6 (50%)')).toBeTruthy()
    const results = screen.getByRole('list', { name: 'Attempt 1, question by question' })
    const rows = within(results).getAllByRole('listitem')
    expect(rows[0].textContent).toContain('Wrong')
    expect(rows[0].textContent).toContain('Your answer: B')
    expect(rows[1].textContent).toContain('Right')
    expect(rows[3].textContent).toContain('1 of 2 points')
    expect(rows[3].textContent).toContain('One → 1')
    expect(screen.queryByText(/Right answer/)).toBeNull()
    expect(screen.queryByText(/Your best/)).toBeNull()
    expect(screen.getByRole('button', { name: 'Try again (attempt 2 of 2)' })).toBeTruthy()
  })

  test('once finished, shows the right answers and explanations', async () => {
    hub(state({
      attempts_used: 2, can_start: false, finished: true, reason: "You've used every attempt at this test.",
      attempts: [attempt({ attempt: 2, key: KEY, score_label: '2 / 6 (33%)' }), attempt({ key: KEY })], best_attempt: 1,
    }))
    await renderTest()
    expect(await screen.findByText("You've used every attempt at this test.")).toBeTruthy()
    expect(screen.getByText('Your best: attempt 1 · 3 / 6 (50%)')).toBeTruthy()
    const rows = within(screen.getByRole('list', { name: 'Attempt 2, question by question' })).getAllByRole('listitem')
    expect(rows[0].textContent).toContain('Right answer: A')
    expect(rows[0].textContent).toContain('Because A comes first.')
    expect(rows[1].textContent).toContain('Right answer: True')
    expect(rows[2].textContent).toContain('Accepted answers: ls, ls -l')
    expect(rows[3].textContent).toContain('Right answer: One → 1, Two → 2')
    expect(screen.getByText('Attempt 1').closest('details')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Try again/ })).toBeNull()
  })

  test('written answers waiting for the coach say so, and so does the next attempt', async () => {
    const written: TestQuestion = { number: 5, type: 'written', prompt_html: '<p>Explain.</p>', points: 4 }
    hub(state({
      can_start: false, waiting: true, attempts_used: 1, reason: 'Your coach is grading your last attempt.',
      attempts: [attempt({
        status: 'auto_graded', status_label: 'Graded (provisional)', score_label: 'Not graded', provisional: true,
        total_score: 3, total_max: 10, questions: [...QUESTIONS, written], answers: { 5: 'Because.' },
        marks: { ...attempt().marks, 5: { points: null, max: 4, right: null } },
      })],
    }))
    await renderTest()
    expect(await screen.findByText('Your coach is marking your written answers. So far: 3 of 10 points.')).toBeTruthy()
    expect(screen.getByText('Your coach is grading your last attempt.')).toBeTruthy()
    const rows = within(screen.getByRole('list', { name: 'Attempt 1, question by question' })).getAllByRole('listitem')
    expect(rows[4].textContent).toContain('Waiting for your coach')
  })

  test("the coach's feedback is shown with the attempt", async () => {
    hub(state({ attempts_used: 1, attempts: [attempt({ feedback: 'Nice work on the match.' })] }))
    await renderTest()
    expect(await screen.findByText('Nice work on the match.')).toBeTruthy()
  })

  test('starting the second try opens a fresh attempt', async () => {
    hub(state({ attempts_used: 1, attempts: [attempt()] }))
    await renderTest()
    await userEvent.click(await screen.findByRole('button', { name: 'Try again (attempt 2 of 2)' }))
    expect(await screen.findByText('0 of 4 answered')).toBeTruthy()
    expect(requests(fetchMock)).toContain('POST /api/v1/tech/items/i_t/test/start')
  })
})
