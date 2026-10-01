// The whole web/ gate in one command (`npm run gate`): checks that don't need the build run alongside it, the build
// and its checks run in order. Each task's output is shown only if it fails; a line per task says how it went.
import { spawn } from 'node:child_process'
import { pathToFileURL } from 'node:url'

export const GROUPS = [
  [{ name: 'lint', command: 'npm run lint' }],
  [{ name: 'typecheck', command: 'npm run typecheck' }],
  [{ name: 'test', command: 'npm test' }],
  [{ name: 'build', command: 'npm run build' }, { name: 'test:build', command: 'npm run test:build' }],
]

function run(task) {
  return new Promise(resolve => {
    const started = Date.now()
    let output = ''
    const child = spawn(task.command, { shell: true, env: { ...process.env, FORCE_COLOR: '0' } })
    child.stdout.on('data', chunk => { output += chunk })
    child.stderr.on('data', chunk => { output += chunk })
    child.on('close', code => resolve({ ok: code === 0, output, seconds: Math.round((Date.now() - started) / 1000) }))
  })
}

/** Runs the groups side by side, each group's tasks in order (stopping at a failure). True when everything passed. */
export async function runGate(groups, say = console.log) {
  const results = await Promise.all(groups.map(async tasks => {
    for (const task of tasks) {
      const { ok, output, seconds } = await run(task)
      if (!ok) say(output.trimEnd())
      say(`${ok ? '✓' : '✗'} ${task.name}`)
      if (!ok) return false
      if (seconds) say(`  ${task.name} took ${seconds}s`)
    }
    return true
  }))
  return results.every(Boolean)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const started = Date.now()
  const passed = await runGate(GROUPS)
  console.log(`${passed ? 'Gate passed' : 'Gate failed'} in ${Math.round((Date.now() - started) / 1000)}s`)
  process.exit(passed ? 0 : 1)
}
