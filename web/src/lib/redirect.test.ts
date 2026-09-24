import { describe, expect, test } from 'vitest'
import { account } from '../test/fake-hub'
import { afterSignIn, safeNext } from './redirect'

describe('safeNext', () => {
  test.each([
    ['?next=%2Fcourses%2Fgimp', '/courses/gimp'],
    ['?next=%2Fcourses%2Fgimp%3Ftab%3D2', '/courses/gimp?tab=2'],
    ['', '/'],
    ['?next=https%3A%2F%2Fevil.example', '/'],
    ['?next=%2F%2Fevil.example', '/'],
    ['?next=%2F%5Cevil.example', '/'],
    ['?next=%2Fsign-in', '/'],
    ['?next=%2Fwaiting%3Fnext%3D%252F', '/'],
  ])('%s goes to %s', (search, expected) => {
    expect(safeNext(search)).toBe(expected)
  })
})

describe('afterSignIn', () => {
  test('an approved account goes where it was heading', () => {
    expect(afterSignIn(account(), '/courses/gimp')).toBe('/courses/gimp')
  })

  test.each(['pending', 'declined'] as const)('a %s account waits, remembering where it was heading', status => {
    expect(afterSignIn(account({ status }), '/courses/gimp')).toBe('/waiting?next=%2Fcourses%2Fgimp')
    expect(afterSignIn(account({ status }), '/')).toBe('/waiting')
  })
})
