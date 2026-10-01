// Zips each exercise's starter folder (a checkpoint's starter_path in ../content/checkpoints) into
// public/starters/<checkpoint id>.zip, which is gitignored. Each zip unpacks into a folder named after the exercise.
// A zip is rewritten only when its bytes change, and zips no checkpoint needs any more are removed.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { zipSync } from 'fflate'

// A fixed date, so the same starter always zips to the same bytes
const MTIME = new Date('2026-01-01T00:00:00Z')

function filesUnder(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name)
    return entry.isDirectory() ? filesUnder(full) : [full]
  })
}

/** Writes the file only if it isn't already exactly these bytes; true when it wrote. */
export function writeIfChanged(path, bytes) {
  if (existsSync(path) && Buffer.compare(readFileSync(path), Buffer.from(bytes)) === 0) return false
  writeFileSync(path, bytes)
  return true
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const site = fileURLToPath(new URL('../../', import.meta.url))
  const out = fileURLToPath(new URL('../public/starters/', import.meta.url))
  const checkpointDir = join(site, 'content/checkpoints')
  const withStarters = readdirSync(checkpointDir)
    .map(name => JSON.parse(readFileSync(join(checkpointDir, name), 'utf8')))
    .filter(checkpoint => checkpoint.starter_path)

  mkdirSync(out, { recursive: true })
  const wanted = new Set()
  let written = 0
  for (const checkpoint of withStarters) {
    const starter = join(site, checkpoint.starter_path)
    const folder = checkpoint.exercise.split('/').pop()
    const entries = Object.fromEntries(filesUnder(starter).map(file => [
      `${folder}/${relative(starter, file).split('\\').join('/')}`, readFileSync(file),
    ]))
    const name = `${checkpoint.id}.zip`
    wanted.add(name)
    written += writeIfChanged(join(out, name), zipSync(entries, { mtime: MTIME, level: 6 }))
  }
  for (const name of readdirSync(out)) if (!wanted.has(name)) rmSync(join(out, name))
  console.log(`zip-starters: ${withStarters.length} starters, ${written} written -> ${out}`)
}
