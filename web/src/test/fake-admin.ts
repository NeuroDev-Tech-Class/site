// The coach's side of the fake hub: roster rows, queue rows, and a hub answering the dashboard's reads.
import type { Mock } from 'vitest'
import type { TechAccount } from '../lib/api'
import type { QueueRow, StudentRow, SubmissionDetail } from '../lib/adminApi'
import { fakeHub, json, submission, type Route } from './fake-hub'

export const COACH: Partial<TechAccount> = { id: 'c1', email: 'lee@example.com', first_name: 'Ms', last_name: 'Lee', role: 'admin' }
export const OWNER: Partial<TechAccount> = { ...COACH, id: 'o1', first_name: 'Topher', last_name: 'S', role: 'superadmin' }

export const studentRow = (overrides: Partial<StudentRow> = {}): StudentRow => ({
  id: 's1', name: 'Sam Student', email: 'sam@example.com', status: 'approved', student_type: 'current',
  email_verified: true, created_at: '2026-09-01T15:00:00Z', approved_at: '2026-09-02T15:00:00Z',
  last_login_at: '2026-09-29T15:00:00Z', courses_started: 1, courses_complete: 0, percent: 40, items_done: 12,
  last_activity_at: '2026-09-29T15:00:00Z', waiting: 0, returned: 0, ...overrides,
})

export const queueRow = (overrides: Partial<QueueRow> = {}): QueueRow => ({
  id: 's1__i_8__1', kind: 'checkpoint', attempt: 1, status: 'submitted', legacy: false,
  submitted_at: '2026-09-28T15:00:00Z', student: { id: 's1', name: 'Sam Student', email: 'sam@example.com' },
  course: { id: 'gimp', title: 'GIMP' }, item: { id: 'i_8', title: 'Movie Poster' }, ...overrides,
})

/** A piece of work as the grade view reads it: the Movie Poster checkpoint, handed in once */
export const detail = (overrides: Partial<SubmissionDetail> = {}): SubmissionDetail => ({
  ...submission({ id: 's1__i_8__1', item: { id: 'i_8', title: 'Movie Poster' } }),
  student: { id: 's1', name: 'Sam Student', email: 'sam@example.com' },
  graded_by: null, legacy: false,
  checkpoint: {
    fields: [
      { id: 'title', type: 'shortText', label: 'Your movie title', required: true },
      { id: 'story', type: 'longText', label: 'What it is about', required: false },
      { id: 'repo', type: 'url', label: 'Link to your project', required: false },
      { id: 'script', type: 'code', label: 'Your script', required: false },
      { id: 'steps', type: 'checklist', label: 'What you did', required: true, items: ['Saved', 'Exported', 'Checked'] },
      { id: 'poster', type: 'image', label: 'Your poster', required: true },
      { id: 'song', type: 'file', label: 'Your soundtrack', required: false, accept: ['.mp3'] },
      { id: 'model', type: 'file', label: 'Your model', required: false, accept: ['.stl'] },
      { id: 'seen', type: 'mentorSignOff', label: 'Your coach sees it printed', required: true },
    ],
    required_one_of: [], requires_sign_off: false,
    instructions_html: '<p>Design a poster for a <strong>movie</strong>.</p>',
    grading_hint: null,
  },
  attempts: [{ id: 's1__i_8__1', attempt: 1, status: 'submitted', submitted_at: '2026-09-28T15:00:00Z', graded_at: null, feedback: null }],
  ...overrides,
})

export interface AdminHub {
  account?: Partial<TechAccount> | null
  students?: StudentRow[]
  queue?: QueueRow[]
  fail?: boolean
  routes?: Record<string, Route>
}

/** A hub for the dashboard; `routes` replace a default with the same pattern, or add to them */
export function adminHub(fetchMock: Mock, options: AdminHub = {}): void {
  const students = options.students ?? []
  const queue = options.queue ?? []
  const down = () => json(500, { detail: 'down' })
  fakeHub(fetchMock, options.account === undefined ? COACH : options.account, {
    '/api/v1/tech/students': () => (options.fail ? down() : json(200, students)),
    '/api/v1/tech/accounts/badge': () =>
      json(200, { pending: students.filter(s => s.status === 'pending' && s.email_verified).length }),
    '/api/v1/tech/submissions/queue/count': () => json(200, { count: queue.length }),
    '/api/v1/tech/submissions/queue(\\?.*)?': () => (options.fail ? down() : json(200, { total: queue.length, items: queue })),
    ...options.routes,
  })
}
