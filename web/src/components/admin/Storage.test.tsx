import { cleanup, screen, within } from '@testing-library/react'
import type { Mock } from 'vitest'
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import type { Usage } from '../../lib/adminApi'
import { fakeFetch, json, requests } from '../../test/fake-hub'
import { OWNER, type AdminHub } from '../../test/fake-admin'
import { openAdmin } from '../../test/open-admin'

let fetchMock: Mock
const MB = 1024 * 1024

const USAGE: Usage = {
  total_bytes: 7 * MB,
  students: [
    { student: { id: 's1', name: 'Sam Student', email: 'sam@example.com' }, files: 2, bytes: 5 * MB, last_upload_at: '2026-09-28T15:00:00Z' },
    { student: { id: 's2', name: 'Ana Bloggs', email: 'ana@example.com' }, files: 1, bytes: 2 * MB, last_upload_at: '2026-09-10T15:00:00Z' },
  ],
}

const open = (options: AdminHub & { usage?: Usage } = {}) => openAdmin(fetchMock, '#/storage', {
  account: OWNER,
  ...options,
  routes: { '/api/v1/tech/files/usage': () => json(200, options.usage ?? USAGE), ...options.routes },
})

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

describe('Storage', () => {
  test('says how much the uploads use, and who uses most, each opening their uploads', async () => {
    await open()
    expect(await screen.findByText('Uploads use 7 MB in all.')).toBeTruthy()
    const rows = within(screen.getByRole('table', { name: 'Space used by each student' })).getAllByRole('row').slice(1)
    expect(within(rows[0]).getByRole('link', { name: 'Sam Student' }).getAttribute('href')).toBe('#/students/s1')
    expect(rows[0].textContent).toContain('5 MB')
    expect(rows[0].textContent).toContain('2 files')
    expect(rows[0].textContent).toContain('2 days ago')
    expect(within(rows[1]).getAllByRole('cell')[2].textContent).toBe('1 file')
  })

  test('nothing stored says so', async () => {
    await open({ usage: { total_bytes: 0, students: [] } })
    expect(await screen.findByText('No uploads are stored.')).toBeTruthy()
  })

  test('is for the superadmin only', async () => {
    await openAdmin(fetchMock, '#/storage')
    expect(await screen.findByText('Storage is for the superadmin.')).toBeTruthy()
    expect(requests(fetchMock)).not.toContain('GET /api/v1/tech/files/usage')
  })

  test('the hub not answering says so', async () => {
    await open({ routes: { '/api/v1/tech/files/usage': () => json(500, {}) } })
    expect(await screen.findByText("Couldn't load this. It will try again shortly, or reload the page.")).toBeTruthy()
  })
})
