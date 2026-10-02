import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import type { SubmissionDetail } from '../../lib/adminApi'
import type { UploadedFile } from '../../lib/api'
import { fakeFetch, json, requests } from '../../test/fake-hub'
import { detail, queueRow, type AdminHub } from '../../test/fake-admin'
import { openAdmin } from '../../test/open-admin'

let fetchMock: Mock
let graded: unknown[]

const file = (id: string, field_id: string, name: string, content_type: string): UploadedFile => ({
  id, field_id, name, content_type, bytes: 2048, status: 'ready', uploaded_at: '2026-09-28T15:00:00Z',
})

const ANSWERS = {
  title: 'Space Cats', story: 'Cats\nin space.', repo: 'https://github.com/sam/poster', script: 'print("hi")\n    done()',
  steps: ['Saved', 'Checked'], poster: ['f1'], song: ['f2'], model: ['f3'],
}
const FILES = [
  file('f1', 'poster', 'poster.png', 'image/png'), file('f2', 'song', 'theme.mp3', 'audio/mpeg'),
  file('f3', 'model', 'ring.stl', 'model/stl'),
]
const WORK = detail({ answers: ANSWERS, files: FILES })
const QUEUE = [queueRow({ id: 's1__i_8__1' }), queueRow({ id: 's2__i_8__1', student: { id: 's2', name: 'Ana', email: 'a@x' } })]

function hub(work: SubmissionDetail = WORK, options: AdminHub & { refuse?: { status: number, detail: string } } = {}) {
  graded = []
  let current = work
  return openAdmin(fetchMock, `#/grade/${work.id}`, {
    queue: QUEUE,
    ...options,
    routes: {
      [`/api/v1/tech/submissions/${work.id}`]: () => json(200, current),
      [`/api/v1/tech/submissions/${work.id}/grade`]: ({ body }) => {
        graded.push(body)
        if (options.refuse) return json(options.refuse.status, { detail: options.refuse.detail })
        const { outcome } = body as { outcome?: string }
        current = { ...current, status: outcome === 'return' ? 'returned' : 'graded',
          status_label: outcome === 'return' ? 'Needs revision' : 'Complete', graded_by: 'Ms Lee',
          graded_at: '2026-09-30T15:00:00Z', feedback: (body as { feedback?: string }).feedback ?? null }
        return json(200, current)
      },
      '/api/v1/tech/files/(f\\d)/link(\\?download=true)?': ({ match }) =>
        json(200, { url: `https://r2.test/${match[1]}${match[2] ? '?attachment' : ''}` }),
      ...options.routes,
    },
  })
}

const answer = (label: string) => screen.getByRole('group', { name: label })

// Compiles the component once, outside any test's time limit; each test still imports it afresh
beforeAll(async () => { await import('./AdminApp') }, 30_000)

beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-30T15:00:00Z'))
  fetchMock = fakeFetch()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  window.location.hash = ''
})

describe("the student's answers", () => {
  test('each answer shows the way its question asked for it', async () => {
    await hub()
    expect(await screen.findByRole('heading', { level: 1, name: 'Movie Poster' })).toBeTruthy()
    expect(within(answer('Your movie title')).getByText('Space Cats')).toBeTruthy()
    const link = within(answer('Link to your project')).getByRole('link', { name: 'https://github.com/sam/poster' })
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(within(answer('Your script')).getByText(/print\("hi"\)/).closest('pre')).not.toBeNull()
    const steps = within(answer('What you did')).getAllByRole('listitem').map(li => li.textContent)
    expect(steps).toEqual(['Ticked: Saved', 'Not ticked: Exported', 'Ticked: Checked'])
    expect(within(answer('Your coach sees it printed')).getByText('You confirm this in person when you mark it complete.')).toBeTruthy()
  })

  test('an image is shown, a sound can be played, and anything else downloads', async () => {
    const open = vi.fn()
    vi.stubGlobal('open', open)
    await hub()
    const poster = await within(await screen.findByRole('group', { name: 'Your poster' })).findByRole('img', { name: 'poster.png' })
    expect(poster.getAttribute('src')).toBe('https://r2.test/f1')
    await waitFor(() => expect(answer('Your soundtrack').querySelector('audio')?.getAttribute('src')).toBe('https://r2.test/f2'))
    await userEvent.click(within(answer('Your model')).getByRole('button', { name: 'Download ring.stl' }))
    await waitFor(() => expect(open).toHaveBeenCalledWith('https://r2.test/f3?attachment', '_blank', 'noopener'))
    expect(requests(fetchMock)).toContain('GET /api/v1/tech/files/f3/link?download=true')
  })

  test('each answer sits in its own box under its question', async () => {
    await hub()
    const link = within(await screen.findByRole('group', { name: 'Link to your project' }))
    expect(within(link.getByRole('group', { name: 'Their answer' })).getByRole('link', { name: 'https://github.com/sam/poster' })).toBeTruthy()
  })

  test('the instructions, the coach-only hint and earlier attempts are beside the answers', async () => {
    await hub(detail({
      answers: ANSWERS, files: FILES, attempt: 2, id: 's1__i_8__2',
      checkpoint: { ...WORK.checkpoint!, grading_hint: { answers: ['Title at least 72pt'] } },
      attempts: [
        { id: 's1__i_8__2', attempt: 2, status: 'submitted', submitted_at: '2026-09-29T15:00:00Z', graded_at: null, feedback: null },
        { id: 's1__i_8__1', attempt: 1, status: 'returned', submitted_at: '2026-09-20T15:00:00Z', graded_at: '2026-09-21T15:00:00Z', feedback: 'Make the title bigger.' },
      ],
    }))
    await screen.findByRole('heading', { level: 1, name: 'Movie Poster' })
    expect(screen.getByText('movie').tagName).toBe('STRONG')
    expect(within(screen.getByRole('region', { name: 'For you only' })).getByText('Title at least 72pt')).toBeTruthy()
    const earlier = screen.getByRole('region', { name: 'Attempts' })
    expect(within(earlier).getByRole('link', { name: /Attempt 1/ }).getAttribute('href')).toBe('#/grade/s1__i_8__1')
    expect(within(earlier).getByText('Make the title bigger.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Sam Student' }).getAttribute('href')).toBe('#/students/s1')
  })

  test('work that is not there any more says so', async () => {
    await openAdmin(fetchMock, '#/grade/gone', { routes: { '/api/v1/tech/submissions/gone': () => json(404, { detail: 'Submission not found.' }) } })
    expect(await screen.findByText("This work isn't there any more.")).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Back to the queue' }).getAttribute('href')).toBe('#/queue')
  })
})

describe('grading an old Google Form score, marked against the uploaded test', () => {
  const OLD: SubmissionDetail = detail({
    id: 's1__i_5__0', kind: 'test', attempt: 0, legacy: true, item: { id: 'i_5', title: 'Unit 1 Test' }, checkpoint: null,
    total_max: null, auto_score: null, files: [],
    answers: { 'Pick A.': 'A', 'The sky is blue.': 'False', 'Explain layers.': 'They stack.', 'What did you enjoy?': 'Fun' },
    attempts: [{ id: 's1__i_5__0', attempt: 0, status: 'submitted', submitted_at: '2025-11-04T18:00:00Z', graded_at: null, feedback: null }],
    old_marks: {
      rows: [
        { question: 'Pick A.', answer: 'A', number: 1, status: 'right', points: 2, max: 2, right_answer: 'A', rubric: null },
        { question: 'The sky is blue.', answer: 'False', number: 2, status: 'wrong', points: 0, max: 1, right_answer: 'True', rubric: null },
        { question: 'Explain layers.', answer: 'They stack.', number: 5, status: 'coach', points: null, max: 4, right_answer: null, rubric: 'They stack' },
        { question: 'What did you enjoy?', answer: 'Fun', number: null, status: 'not_on_test', points: null, max: null, right_answer: null, rubric: null },
      ],
      auto_points: 2, out_of: 7,
    },
  })
  const rows = () => within(screen.getByRole('list', { name: 'Old Form answers' })).getAllByRole('listitem')
  const box = (row: HTMLElement) => within(row).getByRole('group', { name: 'Their answer' }).textContent

  test('each answer is in its own box under its question, marked, with the right answer', async () => {
    await hub(OLD)
    await screen.findByRole('list', { name: 'Old Form answers' })
    expect(rows().map(row => box(row))).toEqual(['Their answerA', 'Their answerFalse', 'Their answerThey stack.', 'Their answerFun'])
    expect(rows()[0].textContent).toContain('Right')
    expect(rows()[1].textContent).toContain('Wrong')
    expect(rows()[1].textContent).toContain('Right answer: True')
    expect(rows()[2].textContent).toContain('Yours to score')
    expect(rows()[2].textContent).toContain('Rubric: They stack')
    expect(rows()[3].textContent).toContain('Not on the current test')
    expect(within(rows()[3]).queryByRole('spinbutton')).toBeNull()
  })

  test('the total adds the points given to the marked ones, and saving sends it out of the matched total', async () => {
    await hub(OLD)
    expect(await screen.findByText('2 / 7 (29%) · below the 70% pass mark')).toBeTruthy()
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Points for question 5' }), '3')
    expect(screen.getByText('5 / 7 (71%) · passes')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Save grade' }))
    await waitFor(() => expect(graded).toEqual([{ manual_score: 5, total_max: 7, feedback: '' }]))
  })

  test('every answer that is yours to score needs points, no more than it is worth', async () => {
    await hub(OLD)
    await userEvent.click(await screen.findByRole('button', { name: 'Save grade' }))
    expect(await screen.findByText("Give points for every answer that's yours to score.")).toBeTruthy()
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Points for question 5' }), '5')
    await userEvent.click(screen.getByRole('button', { name: 'Save grade' }))
    expect(await screen.findByText('Question 5 is worth 4 points at most.')).toBeTruthy()
    expect(graded).toEqual([])
  })
})

describe('grading a checkpoint', () => {
  test('Mark complete sends the feedback, then offers the next piece', async () => {
    await hub()
    await userEvent.type(await screen.findByRole('textbox', { name: /Feedback/ }), 'Great poster!')
    await userEvent.click(screen.getByRole('button', { name: 'Mark complete' }))
    await waitFor(() => expect(graded).toEqual([{ outcome: 'complete', feedback: 'Great poster!', signed_off: false }]))
    expect(await screen.findByText('Marked complete.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Grade next (1 left)' }).getAttribute('href')).toBe('#/grade/s2__i_8__1')
    await waitFor(() => expect(requests(fetchMock).filter(r => r === 'GET /api/v1/tech/submissions/queue/count').length).toBeGreaterThan(1))
  })

  test('Return needs something to change, then sends it back', async () => {
    await hub()
    await userEvent.click(await screen.findByRole('button', { name: 'Return for changes' }))
    expect(await screen.findByText('Say what to change before sending it back.')).toBeTruthy()
    expect(graded).toEqual([])
    await userEvent.type(screen.getByRole('textbox', { name: /Feedback/ }), 'Make the title bigger.')
    await userEvent.click(screen.getByRole('button', { name: 'Return for changes' }))
    await waitFor(() => expect(graded).toEqual([{ outcome: 'return', feedback: 'Make the title bigger.', signed_off: false }]))
    expect(await screen.findByText('Sent back to Sam Student.')).toBeTruthy()
  })

  test('hands-on work needs the in-person tick to be marked complete', async () => {
    await hub(detail({ answers: ANSWERS, files: FILES, checkpoint: { ...WORK.checkpoint!, requires_sign_off: true } }))
    await userEvent.click(await screen.findByRole('button', { name: 'Mark complete' }))
    expect(await screen.findByText('Tick that you saw this in person before marking it complete.')).toBeTruthy()
    expect(graded).toEqual([])
    await userEvent.click(screen.getByRole('checkbox', { name: 'I saw this in person' }))
    await userEvent.click(screen.getByRole('button', { name: 'Mark complete' }))
    await waitFor(() => expect(graded).toEqual([{ outcome: 'complete', feedback: '', signed_off: true }]))
  })

  test('the tick only appears on hands-on work', async () => {
    await hub()
    await screen.findByRole('button', { name: 'Mark complete' })
    expect(screen.queryByRole('checkbox', { name: 'I saw this in person' })).toBeNull()
  })

  test("the hub's refusal is shown", async () => {
    await hub(WORK, { refuse: { status: 409, detail: 'A newer attempt has been handed in. Grade that one.' } })
    await userEvent.click(await screen.findByRole('button', { name: 'Mark complete' }))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain('A newer attempt has been handed in. Grade that one.')
  })

  test('work already graded shows how, with the feedback ready to change', async () => {
    await hub(detail({ answers: ANSWERS, files: FILES, status: 'graded', status_label: 'Complete', graded_by: 'Ms Lee',
      graded_at: '2026-09-29T15:00:00Z', feedback: 'Nice.' }))
    expect(await screen.findByText('graded by Ms Lee on September 29, 2026')).toBeTruthy()
    expect(screen.getByText('Complete', { selector: '.done-chip' })).toBeTruthy()
    expect((screen.getByRole('textbox', { name: /Feedback/ }) as HTMLTextAreaElement).value).toBe('Nice.')
  })

  test('with nothing else waiting, it offers the way back instead', async () => {
    await hub(WORK, { queue: [queueRow({ id: 's1__i_8__1' })] })
    await userEvent.click(await screen.findByRole('button', { name: 'Mark complete' }))
    expect(await screen.findByRole('link', { name: 'Back to the queue' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /Grade next/ })).toBeNull()
  })
})

describe('grading a test', () => {
  const TEST = detail({
    id: 's1__i_5__1', kind: 'test', item: { id: 'i_5', title: 'Unit 1 Test' }, checkpoint: null, total_max: null,
    auto_score: null, answers: { 'Question 1': 'B', 'Question 2': 'A router' }, files: [],
    attempts: [{ id: 's1__i_5__1', attempt: 1, status: 'submitted', submitted_at: '2026-09-28T15:00:00Z', graded_at: null, feedback: null }],
  })

  test('its answers are listed and it takes points, out of a total when the test has none', async () => {
    await hub(TEST)
    expect(await screen.findByText('A router')).toBeTruthy()
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Points' }), '8')
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Out of' }), '10')
    await userEvent.click(screen.getByRole('button', { name: 'Save grade' }))
    await waitFor(() => expect(graded).toEqual([{ manual_score: 8, total_max: 10, feedback: '' }]))
  })

  test('a score brought over from the old site says where it came from, beside the attempts on this one', async () => {
    const OLD: SubmissionDetail = { ...TEST, id: 's1__i_5__0', attempt: 0, legacy: true, submitted_at: '2025-11-04T18:00:00Z', attempts: [
      { id: 's1__i_5__1', attempt: 1, status: 'graded', submitted_at: '2026-10-02T15:00:00Z', graded_at: null, feedback: null },
      { id: 's1__i_5__0', attempt: 0, status: 'graded', submitted_at: '2025-11-04T18:00:00Z', graded_at: null, feedback: null },
    ] }
    await hub(OLD)
    expect(await screen.findByText('Old site (Google Form) · handed in November 4, 2025')).toBeTruthy()
    const attempts = within(screen.getByRole('region', { name: 'Attempts' })).getAllByRole('link').map(a => a.textContent)
    expect(attempts).toEqual(['Attempt 1', 'Old site (Google Form)'])
  })

  test('an old Form score shows each answer in its own box, and says what uploading the test would do', async () => {
    await hub({ ...TEST, legacy: true, attempt: 0 })
    const boxes = await screen.findAllByRole('group', { name: 'Their answer' })
    expect(boxes.map(box => box.textContent)).toEqual(['Their answerB', 'Their answerA router'])
    expect(screen.getByText('Question 1').closest('[role=group]')).toBeNull()
    expect(screen.getByText("Upload this course's test on the Tests page and its multiple choice and true/false answers are marked for you.")).toBeTruthy()
  })

  test('a test with its own total only asks for points', async () => {
    await hub({ ...TEST, total_max: 20 })
    await screen.findByRole('spinbutton', { name: 'Points' })
    expect(screen.queryByRole('spinbutton', { name: 'Out of' })).toBeNull()
    expect(screen.getByText('out of 20')).toBeTruthy()
  })
})

describe('grading a test taken on the site', () => {
  const NATIVE = detail({
    id: 's1__i_5__1', kind: 'test', item: { id: 'i_5', title: 'Unit 2 Test' }, checkpoint: null, status: 'auto_graded',
    status_label: 'Graded (provisional)', auto_score: 2, total_score: 2, total_max: 8, files: [],
    // A test's answers are choices, true or false and text, not a checkpoint's fields
    answers: { 1: 1, 2: true, 3: 'ls', 4: 'Layers stack.' } as unknown as SubmissionDetail['answers'],
    attempts: [{ id: 's1__i_5__1', attempt: 1, status: 'auto_graded', submitted_at: '2026-09-28T15:00:00Z', graded_at: null, feedback: null }],
    test: {
      questions: [
        { number: 1, type: 'mc', prompt_html: '<p>Pick A.</p>', points: 2, choices: ['A', 'B'] },
        { number: 2, type: 'tf', prompt_html: '<p>The sky is blue.</p>', points: 1 },
        { number: 3, type: 'short', prompt_html: '<p>Which command lists a folder?</p>', points: 1 },
        { number: 4, type: 'written', prompt_html: '<p>Why use layers?</p>', points: 4 },
      ],
      key: { 1: { answer: 0, explanation_html: '<p>A comes first.</p>' }, 2: { answer: true }, 3: { accept: ['ls'] }, 4: { rubric: '4 = two ideas; 2 = one' } },
      marks: {
        1: { points: 0, max: 2, right: false }, 2: { points: 1, max: 1, right: true }, 3: { points: 1, max: 1, right: true },
        4: { points: null, max: 4, right: null },
      },
      pass_percent: 70, to_grade: [4],
    },
  })
  const rows = () => within(screen.getByRole('list', { name: 'Questions and answers' })).getAllByRole('listitem')
  const pointsFor = (n: number) => screen.getByRole('spinbutton', { name: `Points for question ${n}` })

  test('each question shows their answer, whether it was right, and the key with the rubric', async () => {
    await hub(NATIVE)
    await screen.findByRole('list', { name: 'Questions and answers' })
    expect(within(within(rows()[0]).getByRole('group', { name: 'Their answer' })).getByText('B')).toBeTruthy()
    expect(rows()[0].textContent).toContain('Wrong')
    expect(rows()[0].textContent).toContain('Right answer: A')
    expect(rows()[0].textContent).toContain('A comes first.')
    expect(rows()[2].textContent).toContain('Accepted answers: ls')
    expect(rows()[3].textContent).toContain('Layers stack.')
    expect(rows()[3].textContent).toContain('Rubric: 4 = two ideas; 2 = one')
    expect(within(rows()[3]).getByRole('spinbutton', { name: 'Points for question 4' }).getAttribute('max')).toBe('4')
    expect(screen.queryByRole('spinbutton', { name: 'Points' })).toBeNull()
    expect(screen.queryByRole('spinbutton', { name: 'Out of' })).toBeNull()
  })

  test('the total follows the points given, and saving sends each written answer its points', async () => {
    await hub(NATIVE)
    await userEvent.type(await screen.findByRole('spinbutton', { name: 'Points for question 4' }), '3')
    expect(screen.getByText('5 / 8 (63%) · below the 70% pass mark')).toBeTruthy()
    await userEvent.clear(pointsFor(4))
    await userEvent.type(pointsFor(4), '4')
    expect(screen.getByText('6 / 8 (75%) · passes')).toBeTruthy()
    await userEvent.type(screen.getByRole('textbox', { name: /Feedback/ }), 'Good.')
    await userEvent.click(screen.getByRole('button', { name: 'Save grade' }))
    await waitFor(() => expect(graded).toEqual([{ points: { 4: 4 }, feedback: 'Good.' }]))
  })

  test.each([
    ['', 'Give points for every written answer.'],
    ['5', 'Question 4 is worth 4 points at most.'],
  ])('points %j are refused before sending', async (typed, words) => {
    await hub(NATIVE)
    if (typed) await userEvent.type(await screen.findByRole('spinbutton', { name: 'Points for question 4' }), typed)
    await userEvent.click(await screen.findByRole('button', { name: 'Save grade' }))
    expect(await screen.findByText(words)).toBeTruthy()
    expect(graded).toEqual([])
  })

  test('a test marked on the spot only takes feedback', async () => {
    await hub({ ...NATIVE, status: 'graded', test: { ...NATIVE.test!, to_grade: [], questions: NATIVE.test!.questions.slice(0, 3) } })
    await userEvent.type(await screen.findByRole('textbox', { name: /Feedback/ }), 'Well done.')
    expect(screen.queryByRole('spinbutton')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Save grade' }))
    await waitFor(() => expect(graded).toEqual([{ points: {}, feedback: 'Well done.' }]))
  })
})
