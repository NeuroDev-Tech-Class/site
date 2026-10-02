// Copies the site's images (the single source is ../images) into public/images, which is gitignored.
// Only what is new or changed is copied, and what is gone is removed: the copy goes through the Windows bind mount,
// so copying all 18 MB on every build was most of its time.
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, utimesSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

function filesUnder(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name)
    return entry.isDirectory() ? filesUnder(full) : [full]
  })
}

/** Makes `to` hold exactly what `from` holds, copying a file only when its size or modified time (to the second) differs. */
export function syncDir(from, to) {
  let copied = 0
  let removed = 0
  const wanted = new Set()
  for (const source of filesUnder(from)) {
    const path = relative(from, source)
    wanted.add(path)
    const target = join(to, path)
    const was = existsSync(target) ? statSync(target) : null
    const is = statSync(source)
    // Whole seconds: setting a time back on the copy drops the sub-millisecond part
    if (was && was.size === is.size && Math.floor(was.mtimeMs / 1000) === Math.floor(is.mtimeMs / 1000)) continue
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(source, target)
    utimesSync(target, is.atime, is.mtime)
    copied += 1
  }
  for (const target of filesUnder(to)) {
    if (wanted.has(relative(to, target))) continue
    rmSync(target)
    removed += 1
  }
  return { copied, removed }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const from = fileURLToPath(new URL('../../images/', import.meta.url))
  const to = fileURLToPath(new URL('../public/images/', import.meta.url))
  const { copied, removed } = syncDir(from, to)
  console.log(`sync-assets: ${copied} copied, ${removed} removed (${from} -> ${to})`)
}
