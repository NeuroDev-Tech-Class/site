// Zips each exercise's starter folder (a checkpoint's starter_path in ../content/checkpoints) into
// public/starters/<checkpoint id>.zip, which is gitignored. Each zip unpacks into a folder named after the exercise.
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { zipSync } from 'fflate'

const site = fileURLToPath(new URL('../../', import.meta.url))
const out = fileURLToPath(new URL('../public/starters/', import.meta.url))
// A fixed date, so the same starter always zips to the same bytes
const MTIME = new Date('2026-01-01T00:00:00Z')

function filesUnder(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name)
    return entry.isDirectory() ? filesUnder(full) : [full]
  })
}

const checkpointDir = join(site, 'content/checkpoints')
const withStarters = readdirSync(checkpointDir)
  .map(name => JSON.parse(readFileSync(join(checkpointDir, name), 'utf8')))
  .filter(checkpoint => checkpoint.starter_path)

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
for (const checkpoint of withStarters) {
  const starter = join(site, checkpoint.starter_path)
  const folder = checkpoint.exercise.split('/').pop()
  const entries = Object.fromEntries(filesUnder(starter).map(file => [
    `${folder}/${relative(starter, file).split('\\').join('/')}`, readFileSync(file),
  ]))
  writeFileSync(join(out, `${checkpoint.id}.zip`), zipSync(entries, { mtime: MTIME, level: 6 }))
}
console.log(`zip-starters: ${withStarters.length} starters -> ${out}`)
