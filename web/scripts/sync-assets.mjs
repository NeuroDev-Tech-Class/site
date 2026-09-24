// Copies the site's images (the single source is ../assets/images) into public/images, which is gitignored
import { cpSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const from = fileURLToPath(new URL('../../assets/images/', import.meta.url))
const to = fileURLToPath(new URL('../public/images/', import.meta.url))

rmSync(to, { recursive: true, force: true })
cpSync(from, to, { recursive: true })
console.log(`sync-assets: ${from} -> ${to}`)
