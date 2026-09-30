import { describe, expect, test } from 'vitest'
import { parseRoute, routeHash, type AdminRoute } from './adminRoute'

describe('parseRoute', () => {
  test.each([
    ['#/today', { view: 'today' }],
    ['#/queue', { view: 'queue' }],
    ['#/queue?course=gimp&q=sam', { view: 'queue', course: 'gimp', q: 'sam' }],
    ['#/grade/a1__i_8__2', { view: 'grade', id: 'a1__i_8__2' }],
    ['#/students', { view: 'students', tab: 'current' }],
    ['#/students?tab=old&q=ana', { view: 'students', tab: 'old', q: 'ana' }],
    ['#/students/5f0c', { view: 'student', id: '5f0c' }],
    ['#/students/5f0c/courses/gimp', { view: 'student-course', id: '5f0c', course: 'gimp' }],
    ['#/activity?type=submission_graded&student=5f0c&course=gimp',
      { view: 'activity', type: 'submission_graded', student: '5f0c', course: 'gimp' }],
    ['#/storage', { view: 'storage' }],
  ] as [string, AdminRoute][])('%s', (hash, route) => {
    expect(parseRoute(hash)).toEqual({ route })
  })

  test("the hub's notification link for sign-ups opens the Pending tab", () => {
    expect(parseRoute('#/accounts?status=pending')).toEqual({
      route: { view: 'students', tab: 'pending' }, redirect: '#/students?tab=pending',
    })
  })

  test('an unknown tab falls back to Current', () => {
    expect(parseRoute('#/students?tab=nope')).toEqual({ route: { view: 'students', tab: 'current' } })
  })

  test.each(['', '#', '#/', '#/nowhere', '#/grade/', '#/students/5f0c/nope'])('%j opens Today', hash => {
    expect(parseRoute(hash)).toEqual({ route: { view: 'today' }, redirect: '#/today' })
  })

  test('a mangled link opens Today instead of breaking the page', () => {
    expect(parseRoute('#/grade/50%')).toEqual({ route: { view: 'today' }, redirect: '#/today' })
    expect(parseRoute('#/students/%E0%A4%A')).toEqual({ route: { view: 'today' }, redirect: '#/today' })
  })

  test('ids and filters are decoded', () => {
    expect(parseRoute('#/grade/a%20b')).toEqual({ route: { view: 'grade', id: 'a b' } })
    expect(parseRoute('#/queue?q=Sam%20Student')).toEqual({ route: { view: 'queue', q: 'Sam Student' } })
  })
})

describe('routeHash', () => {
  test.each([
    [{ view: 'today' }, '#/today'],
    [{ view: 'queue', course: 'gimp', q: 'Sam Student' }, '#/queue?course=gimp&q=Sam+Student'],
    [{ view: 'queue' }, '#/queue'],
    [{ view: 'grade', id: 'a1__i_8__2' }, '#/grade/a1__i_8__2'],
    [{ view: 'students', tab: 'current' }, '#/students'],
    [{ view: 'students', tab: 'pending', q: 'ana' }, '#/students?tab=pending&q=ana'],
    [{ view: 'student', id: '5f0c' }, '#/students/5f0c'],
    [{ view: 'student-course', id: '5f0c', course: 'gimp' }, '#/students/5f0c/courses/gimp'],
    [{ view: 'activity', type: 'submission_graded' }, '#/activity?type=submission_graded'],
    [{ view: 'storage' }, '#/storage'],
  ] as [AdminRoute, string][])('%j', (route, hash) => {
    expect(routeHash(route)).toBe(hash)
    expect(parseRoute(hash).route).toEqual(route)
  })
})
