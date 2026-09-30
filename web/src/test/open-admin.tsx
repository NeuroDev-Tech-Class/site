import { render } from '@testing-library/react'
import type { Mock } from 'vitest'
import type { CourseMeta } from '../lib/content'
import { adminHub, type AdminHub } from './fake-admin'

export const COURSES: CourseMeta[] = [
  { id: 'gimp', heading: '2D Digital Art — GIMP', category: 'media' },
  { id: 'python-1', heading: 'Python I', category: 'programming' },
]

/** The dashboard at `hash`, against a fake hub; imported afresh so each test starts signed out of the last one */
export async function openAdmin(fetchMock: Mock, hash: string, hub: AdminHub = {}) {
  window.location.hash = hash
  adminHub(fetchMock, hub)
  const { default: AdminApp } = await import('../components/admin/AdminApp')
  return render(<AdminApp courses={COURSES} />)
}
