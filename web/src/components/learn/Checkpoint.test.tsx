import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import type { Answers, CheckpointContent, Draft, ItemContent, Submission, UploadedFile } from '../../lib/api'
import type { ItemPageView } from '../../lib/content'
import { fakeFetch, fakeHub, json, requests, submission } from '../../test/fake-hub'

vi.mock('astro:transitions/client', () => ({ navigate: vi.fn() }))

const PAGE: ItemPageView = {
  id: 'i_c', type: 'checkpoint', label: 'Checkpoint', title: 'Movie Poster',
  course: { id: 'gimp', heading: '2D Digital Art — GIMP', category: 'media' },
  unit: { id: 'u_1', title: 'Basics' },
  previous: { href: '/learn/i_prev', text: 'Video: Tools' },
  next: { href: '/learn/i_next', text: 'Reading: Layers' },
}

const CHECKPOINT: CheckpointContent = {
  id: 'c_1', title: 'Movie Poster', instructions_html: '<p>Design a poster for a <strong>movie</strong>.</p>',
  fields: [
    { id: 'title', type: 'shortText', label: 'Your movie title', required: true },
    { id: 'story', type: 'longText', label: 'What the movie is about', required: false, help: 'Two or three sentences.' },
    { id: 'repo', type: 'url', label: 'Link to your project', required: false },
    { id: 'script', type: 'code', label: 'Your script', required: false, language: 'python' },
    { id: 'steps', type: 'checklist', label: 'What you did', required: true, items: ['Saved', 'Exported', 'Checked spelling'], min: 2 },
    { id: 'poster', type: 'image', label: 'Your finished poster', required: true, multiple: false },
    { id: 'signoff', type: 'mentorSignOff', label: 'Your coach sees it printed', required: true },
  ],
  required_one_of: [], requires_sign_off: true, has_starter: true,
}

const POSTER: UploadedFile = {
  id: 'f1', field_id: 'poster', name: 'poster.png', content_type: 'image/png', bytes: 2048, status: 'ready',
  uploaded_at: '2026-10-01T15:00:00Z',
}

const EMPTY: Draft = { attempt: 1, answers: {}, files: [], saved_at: null, started_from: null }
const FULL: Answers = { title: 'Space Cats', steps: ['Saved', 'Exported'], poster: ['f1'] }

interface Hub {
  draft?: Draft
  draftError?: { status: number, detail: string }
  attempts?: Submission[]
  saveFails?: boolean
  saveRefused?: Record<string, string>
  submit?: { status: number, body: unknown }
  uploadRefused?: string
}

let fetchMock: Mock
let saved: Answers[]
let submitted: unknown[]

function hub(options: Hub = {}) {
  saved = []
  submitted = []
  let draft = options.draft ?? EMPTY
  const item: ItemContent = {
    id: 'i_c', type: 'checkpoint', title: 'Movie Poster', status: 'ok', tags: [], course: { id: 'gimp', title: 'GIMP' },
    unit: { id: 'u_1', title: 'Unit 1: Basics' }, content: CHECKPOINT as unknown as Record<string, unknown>,
  }
  fakeHub(fetchMock, {}, {
    '/api/v1/tech/items/i_c': () => json(200, item),
    '/api/v1/tech/items/i_c/progress': () => json(200, { item_id: 'i_c', status: null, done_at: null, opened_at: 'x', videos: [] }),
    '/api/v1/tech/items/i_c/draft': ({ method, body }) => {
      if (options.draftError) return json(options.draftError.status, { detail: options.draftError.detail })
      if (method === 'PUT') {
        if (options.saveFails) return json(500, { detail: 'down' })
        if (options.saveRefused) return json(422, { detail: { message: 'Some answers need another look.', fields: options.saveRefused } })
        const answers = (body as { answers: Answers }).answers
        saved.push(answers)
        const files = (answers.poster ?? []).includes('f1') ? [POSTER] : []
        draft = { ...draft, answers, files, saved_at: '2026-10-01T15:00:00Z' }
      }
      return json(200, draft)
    },
    '/api/v1/tech/submissions/mine\\?item_id=i_c': () => json(200, options.attempts ?? []),
    '/api/v1/tech/items/i_c/uploads': ({ body }) => {
      if (options.uploadRefused) return json(422, { detail: options.uploadRefused })
      const { field_id, name, size } = body as { field_id: string, name: string, size: number }
      return json(200, {
        file: { ...POSTER, field_id, name, bytes: size, status: 'pending', uploaded_at: null },
        upload: { url: 'https://r2.test/put/f1', method: 'PUT', headers: { 'Content-Type': 'image/png' } },
      })
    },
    '/api/v1/tech/uploads/f1/done': () => json(200, POSTER),
    '/api/v1/tech/uploads/f1': () => new Response(null, { status: 204 }),
    '/api/v1/tech/files/f1/link': () => json(200, { url: 'https://r2.test/get/f1' }),
    '/api/v1/tech/items/i_c/submit': ({ body }) => {
      submitted.push(body)
      if (options.submit) return json(options.submit.status, options.submit.body)
      return json(200, submission({ id: 'a1__i_c__1', item: { id: 'i_c', title: 'Movie Poster' }, answers: FULL, files: [POSTER] }))
    },
  })
}

// The browser's upload straight to R2, with a progress event half way
class FakeUpload {
  static sent: { method: string, url: string, headers: Record<string, string>, body: Blob }[] = []
  upload: { onprogress: ((event: { loaded: number, total: number, lengthComputable: boolean }) => void) | null } = { onprogress: null }
  status = 0
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  private request = { method: '', url: '', headers: {} as Record<string, string> }
  open(method: string, url: string) { this.request = { method, url, headers: {} } }
  setRequestHeader(name: string, value: string) { this.request.headers[name] = value }
  send(body: Blob) {
    FakeUpload.sent.push({ ...this.request, body })
    setTimeout(() => this.upload.onprogress?.({ loaded: body.size / 2, total: body.size, lengthComputable: true }), 5)
    setTimeout(() => { this.status = 200; this.onload?.() }, 80)
  }
}

async function renderPage() {
  const { default: LearnItem } = await import('./LearnItem')
  render(<LearnItem page={PAGE} />)
  await screen.findByText(/Design a poster/)
}

const puts = () => requests(fetchMock).filter(r => r === 'PUT /api/v1/tech/items/i_c/draft').length

// Compiles the component once, outside any test's time limit; each test still imports it afresh
beforeAll(async () => { await Promise.all([import('./LearnItem')]) }, 30_000)

beforeEach(() => {
  vi.resetModules()
  fetchMock = fakeFetch()
  FakeUpload.sent = []
  vi.stubGlobal('XMLHttpRequest', FakeUpload)
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('the checkpoint page', () => {
  test('shows the instructions, the starter to download and the in-person sign-off, and no Mark complete', async () => {
    hub()
    await renderPage()
    expect(screen.getByText('movie').tagName).toBe('STRONG')
    const starter = screen.getByRole('link', { name: 'Download the starter code' })
    expect(starter.getAttribute('href')).toBe('/starters/c_1.zip')
    expect(starter.getAttribute('download')).toBe('gimp-movie-poster-starter.zip')
    expect(screen.getByText('Your coach sees it printed')).toBeTruthy()
    expect(screen.getByText('Your coach will confirm this in person.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Mark complete' })).toBeNull()
    expect(screen.getByRole('link', { name: /Next: Reading: Layers/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Previous: Video: Tools/ }).getAttribute('href')).toBe('/learn/i_prev')
    expect(screen.queryByRole('button', { name: /Mark complete/ })).toBeNull()
  })

  test('has a labelled field for each question, marking the required ones', async () => {
    hub()
    await renderPage()
    expect(screen.getByRole('textbox', { name: 'Your movie title (required)' }).tagName).toBe('INPUT')
    expect(screen.getByRole('textbox', { name: 'What the movie is about' }).tagName).toBe('TEXTAREA')
    expect(screen.getByText('Two or three sentences.')).toBeTruthy()
    expect(screen.getByRole('textbox', { name: 'Link to your project' }).getAttribute('type')).toBe('url')
    expect(screen.getByRole('textbox', { name: 'Your script' }).getAttribute('spellcheck')).toBe('false')
    const steps = screen.getByRole('group', { name: 'What you did (required)' })
    expect(within(steps).getAllByRole('checkbox')).toHaveLength(3)
    expect(within(steps).getByText('Tick at least 2.')).toBeTruthy()
    expect(screen.getByLabelText('Your finished poster (required)').getAttribute('accept')).toBe('.png,.jpg,.jpeg,.webp,.gif')
    expect(screen.getByText('0 of 6 answered')).toBeTruthy()
  })
})

describe('autosave', () => {
  test('saves once when the typing pauses, and says so', async () => {
    hub()
    await renderPage()
    await userEvent.type(screen.getByRole('textbox', { name: 'Your movie title (required)' }), 'Space Cats')
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Saved'))
    expect(puts()).toBe(1)
    expect(saved[0]).toEqual({ title: 'Space Cats' })
    expect(screen.getByText('1 of 6 answered')).toBeTruthy()
  })

  test('leaving the page straight after typing still saves', async () => {
    hub()
    await renderPage()
    await userEvent.type(screen.getByRole('textbox', { name: 'Your movie title (required)' }), 'Space Cats')
    cleanup()
    await waitFor(() => expect(saved).toEqual([{ title: 'Space Cats' }]))
  })

  test('leaving without changing anything sends nothing', async () => {
    hub()
    await renderPage()
    window.dispatchEvent(new Event('pagehide'))
    cleanup()
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(puts()).toBe(0)
  })

  test('closing the tab straight after typing still saves, with a request that outlives the page', async () => {
    hub()
    await renderPage()
    await userEvent.type(screen.getByRole('textbox', { name: 'Your movie title (required)' }), 'Space Cats')
    window.dispatchEvent(new Event('pagehide'))
    await waitFor(() => expect(saved).toEqual([{ title: 'Space Cats' }]))
    const put = fetchMock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === 'PUT')
    expect((put?.[1] as RequestInit).keepalive).toBe(true)
  })

  test('ticking boxes saves the ticked items', async () => {
    hub()
    await renderPage()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Exported' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Saved' }))
    await waitFor(() => expect(saved.at(-1)).toEqual({ steps: ['Saved', 'Exported'] }))
  })

  test("a save that fails says so, keeps the work, and can be tried again", async () => {
    hub({ saveFails: true })
    await renderPage()
    const title = screen.getByRole('textbox', { name: 'Your movie title (required)' })
    await userEvent.type(title, 'Space Cats')
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/Couldn't save/))
    expect((title as HTMLInputElement).value).toBe('Space Cats')
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(puts()).toBe(2))
  })

  test('an answer the hub refuses shows beside its question, not as a failed save', async () => {
    hub({ saveRefused: { title: 'Keep this under 200 characters.' } })
    await renderPage()
    const title = screen.getByRole('textbox', { name: 'Your movie title (required)' })
    await userEvent.type(title, 'Space Cats')
    expect(await screen.findByText('Keep this under 200 characters.')).toBeTruthy()
    expect(title.getAttribute('aria-invalid')).toBe('true')
    expect(screen.queryByText(/Couldn't save/)).toBeNull()
  })

  test('picks up where the student left off', async () => {
    hub({ draft: { ...EMPTY, answers: { title: 'Space Cats', steps: ['Saved'] }, saved_at: '2026-10-01T15:00:00Z' } })
    await renderPage()
    expect((screen.getByRole('textbox', { name: 'Your movie title (required)' }) as HTMLInputElement).value).toBe('Space Cats')
    expect((screen.getByRole('checkbox', { name: 'Saved' }) as HTMLInputElement).checked).toBe(true)
    expect(screen.getByText('2 of 6 answered')).toBeTruthy()
    expect(puts()).toBe(0)
  })
})

describe('uploads', () => {
  const choose = async () => {
    const file = new File(['x'.repeat(2048)], 'poster.png', { type: 'image/png' })
    await userEvent.upload(screen.getByLabelText('Your finished poster (required)'), file)
    return file
  }

  test('a chosen file goes straight to storage with a progress bar, then joins the answers', async () => {
    hub()
    await renderPage()
    const file = await choose()
    const bar = await screen.findByRole('progressbar', { name: 'Uploading poster.png' })
    await waitFor(() => expect(bar.getAttribute('value')).toBe('50'))
    expect(await screen.findByText('poster.png')).toBeTruthy()
    expect(FakeUpload.sent).toHaveLength(1)
    expect(FakeUpload.sent[0]).toMatchObject({ method: 'PUT', url: 'https://r2.test/put/f1', headers: { 'Content-Type': 'image/png' } })
    expect(FakeUpload.sent[0].body).toBe(file)
    const calls = requests(fetchMock)
    expect(calls).toContain('POST /api/v1/tech/items/i_c/uploads')
    expect(calls).toContain('POST /api/v1/tech/uploads/f1/done')
    await waitFor(() => expect(saved.at(-1)).toEqual({ poster: ['f1'] }))
  })

  test('an upload the hub refuses explains why beside the question', async () => {
    hub({ uploadRefused: 'This takes PNG, JPG, WebP or GIF images.' })
    await renderPage()
    await choose()
    expect(await screen.findByText('This takes PNG, JPG, WebP or GIF images.')).toBeTruthy()
    expect(FakeUpload.sent).toHaveLength(0)
  })

  test('an uploaded file can be viewed and removed', async () => {
    hub({ draft: { ...EMPTY, answers: { poster: ['f1'] }, files: [POSTER], saved_at: 'x' } })
    const open = vi.fn()
    vi.stubGlobal('open', open)
    await renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'View poster.png' }))
    await waitFor(() => expect(open).toHaveBeenCalledWith('https://r2.test/get/f1', '_blank', 'noopener'))
    await userEvent.click(screen.getByRole('button', { name: 'Remove poster.png' }))
    await waitFor(() => expect(requests(fetchMock)).toContain('DELETE /api/v1/tech/uploads/f1'))
    await waitFor(() => expect(screen.queryByText('poster.png')).toBeNull())
    await waitFor(() => expect(saved.at(-1)).toEqual({}))
  })
})

describe('handing it in', () => {
  test('the review lists every answer and what is still needed before handing in', async () => {
    hub({ draft: { ...EMPTY, answers: { title: 'Space Cats', steps: ['Saved'] }, saved_at: 'x' } })
    await renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Review and hand in' }))
    const review = screen.getByRole('region', { name: 'Check your answers' })
    expect(document.activeElement).toBe(within(review).getByRole('heading', { name: 'Check your answers' }))
    expect(within(review).getByText('Space Cats')).toBeTruthy()
    const needed = within(review).getByRole('list', { name: 'Still needed' })
    expect(within(needed).getAllByRole('listitem').map(li => li.textContent)).toEqual([
      'What you did: tick at least 2.', 'Your finished poster: this is required.',
    ])
    expect((within(review).getByRole('button', { name: 'Hand it in' }) as HTMLButtonElement).disabled).toBe(true)
    await userEvent.click(within(review).getByRole('button', { name: 'Keep editing' }))
    expect(screen.queryByRole('region', { name: 'Check your answers' })).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Review and hand in' }))
  })

  test('handing in sends the answers and shows the receipt', async () => {
    hub({ draft: { ...EMPTY, answers: FULL, files: [POSTER], saved_at: 'x' } })
    await renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Review and hand in' }))
    await userEvent.click(screen.getByRole('button', { name: 'Hand it in' }))
    const receipt = await screen.findByRole('heading', { name: 'Waiting for your coach' })
    expect(document.activeElement).toBe(receipt)
    expect(submitted).toEqual([{ answers: FULL }])
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.getByText('Space Cats')).toBeTruthy()
  })

  test("the hub's objections show beside each question and in a summary", async () => {
    hub({
      draft: { ...EMPTY, answers: FULL, files: [POSTER], saved_at: 'x' },
      submit: { status: 422, body: { detail: { message: 'Some answers need another look.', fields: {
        title: 'Keep this under 200 characters.', poster: "One of these files isn't available any more. Upload it again.",
      } } } },
    })
    await renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Review and hand in' }))
    await userEvent.click(screen.getByRole('button', { name: 'Hand it in' }))
    const summary = await screen.findByRole('alert')
    expect(within(summary).getByRole('link', { name: 'Your movie title: Keep this under 200 characters.' })
      .getAttribute('href')).toBe('#field-title')
    await waitFor(() => expect(document.activeElement).toBe(summary))
    expect(screen.getByRole('textbox', { name: 'Your movie title (required)' }).getAttribute('aria-describedby'))
      .toContain('title-error')
    expect(screen.getByText('Keep this under 200 characters.')).toBeTruthy()
    expect(screen.getByText("One of these files isn't available any more. Upload it again.")).toBeTruthy()
  })
})

describe('work already handed in', () => {
  test('waiting for the coach shows the receipt and no form', async () => {
    hub({ attempts: [submission({ id: 'a1__i_c__1', answers: FULL, files: [POSTER], submitted_at: '2026-10-02T15:00:00Z' })] })
    await renderPage()
    expect(await screen.findByRole('heading', { name: 'Waiting for your coach' })).toBeTruthy()
    expect(screen.getByText(/Handed in October 2, 2026/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'View poster.png' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Review and hand in' })).toBeNull()
    expect(document.activeElement).toBe(document.body)
    expect(requests(fetchMock)).not.toContain('GET /api/v1/tech/items/i_c/draft')
  })

  test('complete shows the coach confirmed it in person', async () => {
    hub({ attempts: [submission({
      status: 'graded', status_label: 'Complete', answers: FULL, files: [POSTER], feedback: 'Great poster!',
      graded_at: '2026-10-03T15:00:00Z', sign_off: { by_name: 'Ms Lee', at: '2026-10-03T15:00:00Z' },
    })] })
    await renderPage()
    expect(await screen.findByRole('heading', { name: 'Complete' })).toBeTruthy()
    expect(screen.getByText('Ms Lee confirmed this in person on October 3, 2026.')).toBeTruthy()
    expect(screen.getByText('Great poster!')).toBeTruthy()
  })

  test('returned work reopens with the feedback pinned at the top', async () => {
    hub({
      attempts: [submission({ status: 'returned', status_label: 'Needs revision', feedback: 'Make the title bigger.' })],
      draft: { attempt: 2, answers: FULL, files: [POSTER], saved_at: null, started_from: 1 },
    })
    await renderPage()
    const pinned = await screen.findByRole('region', { name: 'Your coach sent this back' })
    expect(within(pinned).getByText('Make the title bigger.')).toBeTruthy()
    expect((screen.getByRole('textbox', { name: 'Your movie title (required)' }) as HTMLInputElement).value).toBe('Space Cats')
    expect(screen.getByText('poster.png')).toBeTruthy()
  })

  test('done without anything handed in says so', async () => {
    hub({ draftError: { status: 409, detail: 'Your coach has already marked this complete.' } })
    await renderPage()
    expect(await screen.findByText('Your coach has already marked this complete.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Review and hand in' })).toBeNull()
  })
})
