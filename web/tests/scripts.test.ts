import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { runGate } from '../scripts/gate.mjs'
import { syncDir } from '../scripts/sync-assets.mjs'
import { writeIfChanged } from '../scripts/zip-starters.mjs'

let root: string
const at = (...parts: string[]) => join(root, ...parts)
const put = (path: string, body: string) => {
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, body)
}

beforeEach(() => { root = mkdtempSync(join(tmpdir(), 'scripts-')) })
afterEach(() => rmSync(root, { recursive: true, force: true }))

describe('syncDir', () => {
  test('copies what is new or changed, leaves the rest, and removes what is gone', () => {
    put(at('from', 'a.png'), 'A')
    put(at('from', 'deck', 'b.webp'), 'B')
    expect(syncDir(at('from'), at('to'))).toEqual({ copied: 2, removed: 0 })
    expect(readFileSync(at('to', 'deck', 'b.webp'), 'utf8')).toBe('B')

    expect(syncDir(at('from'), at('to'))).toEqual({ copied: 0, removed: 0 })

    put(at('from', 'a.png'), 'A, bigger now')
    put(at('to', 'old.png'), 'gone from the source')
    expect(syncDir(at('from'), at('to'))).toEqual({ copied: 1, removed: 1 })
    expect(readFileSync(at('to', 'a.png'), 'utf8')).toBe('A, bigger now')
    expect(existsSync(at('to', 'old.png'))).toBe(false)
  })
})

describe('writeIfChanged', () => {
  test('writes only when the bytes differ', () => {
    const file = at('x.zip')
    expect(writeIfChanged(file, new Uint8Array([1, 2]))).toBe(true)
    expect(writeIfChanged(file, new Uint8Array([1, 2]))).toBe(false)
    expect(writeIfChanged(file, new Uint8Array([1, 3]))).toBe(true)
    expect([...readFileSync(file)]).toEqual([1, 3])
  })
})

describe('runGate', () => {
  const ok = (name: string) => ({ name, command: `node -e "console.log('${name} ran')"` })
  const fails = (name: string) => ({ name, command: `node -e "console.error('${name} broke'); process.exit(1)"` })

  test('runs the groups side by side and each group in order; passes when all pass', async () => {
    const lines: string[] = []
    const passed = await runGate([[ok('lint')], [ok('build'), ok('test:build')]], line => lines.push(line))
    expect(passed).toBe(true)
    expect(lines.some(l => l.includes('build ran'))).toBe(false)
    expect(lines.filter(l => /^(✓|✗) /.test(l)).sort()).toEqual(['✓ build', '✓ lint', '✓ test:build'])
  })

  test('a failure shows its output, stops the rest of its group, and fails the gate', async () => {
    const lines: string[] = []
    const passed = await runGate([[ok('lint')], [fails('build'), ok('test:build')]], line => lines.push(line))
    expect(passed).toBe(false)
    expect(lines).toContain('✗ build')
    expect(lines.some(l => l.includes('build broke'))).toBe(true)
    expect(lines.some(l => l.includes('test:build'))).toBe(false)
  })
})
