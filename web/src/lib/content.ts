import sanitizeHtml from 'sanitize-html'
import catalogJson from '../../../content/catalog.json'
import vocabulary from '../../../content/vocabulary.json'

export type ItemType = 'lesson' | 'video' | 'checkpoint' | 'test' | 'slides' | 'link' | 'note'

export interface Item {
  id: string
  legacy_key: string
  type: ItemType
  title: string | null
  status: string
  tags: string[]
  payload: Record<string, unknown>
}

export interface Unit {
  id: string
  legacy_key: string
  title: string
  description: string
  items: Item[]
}

export interface Course {
  id: string
  title: string
  category: string
  status: string
  heading: string
  summary: string
  objectives: string[]
  intro_html: string
  units: Unit[]
}

export interface CatalogCourse {
  id: string
  title: string
  summary: string
  status: string
}

export interface Catalog {
  categories: { name: string, courses: CatalogCourse[] }[]
}

const LABELS: Record<ItemType, string> = {
  lesson: 'Reading',
  video: 'Video',
  checkpoint: 'Checkpoint',
  test: 'Test',
  slides: 'Slideshow',
  link: 'Link',
  note: 'Note',
}

// Title prefixes that only repeat what the item's label already says
const REDUNDANT_PREFIXES: Partial<Record<ItemType, string[]>> = {
  lesson: ['Reading'],
  slides: ['Slideshow'],
  test: ['Quiz'],
  link: ['Article'],
  checkpoint: ['Checkpoint'],
}

const SHIFTED_HEADINGS = { h3: 'h2', h4: 'h3', h5: 'h4' }

export const catalog: Catalog = catalogJson
export const courses: Course[] = Object.values(
  import.meta.glob<Course>('../../../content/courses/*.json', { eager: true, import: 'default' }),
)

export function publishedCatalog(source: Catalog): Catalog['categories'] {
  return source.categories
    .map(category => ({ ...category, courses: category.courses.filter(course => course.status === 'published') }))
    .filter(category => category.courses.length > 0)
}

export function publishedCourses(): Course[] {
  return courses.filter(course => course.status === 'published')
}

export function sanitize(html: string, { shiftHeadings = false } = {}): string {
  return sanitizeHtml(html, {
    allowedTags: vocabulary.tags,
    allowedAttributes: vocabulary.attributes,
    allowedClasses: { '*': [...vocabulary.classes, ...vocabulary.class_prefixes.map(prefix => `${prefix}*`)] },
    allowedIframeHostnames: vocabulary.iframe_hosts,
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: attribs.target === '_blank' ? { ...attribs, rel: 'noopener noreferrer' } : attribs,
      }),
      ...(shiftHeadings ? SHIFTED_HEADINGS : {}),
    },
  })
}

export function itemLabel(item: Item): { label: string, title: string } {
  const title = item.title ?? ''
  for (const prefix of REDUNDANT_PREFIXES[item.type] ?? []) {
    if (title.startsWith(`${prefix} - `)) return { label: prefix, title: title.slice(prefix.length + 3) }
  }
  return { label: LABELS[item.type], title }
}

export const isExercise = (item: Item): boolean => item.type === 'note' && item.tags.includes('exercise')

// Same rule as the hub's progress totals (app/tech/counting.py): plain notes and tests without content don't count
export const countsTowardProgress = (item: Item): boolean =>
  item.status === 'ok' && (item.type !== 'note' || isExercise(item))

export function courseStats(course: Course): { units: number, items: number } {
  return {
    units: course.units.length,
    items: course.units.reduce((sum, unit) => sum + unit.items.filter(countsTowardProgress).length, 0),
  }
}

export type CategoryKey = 'basics' | 'programming' | 'it' | 'web' | 'game' | 'media'

const CATEGORY_KEYS: Record<string, CategoryKey> = {
  'Computer Basics': 'basics',
  'Computer Programming': 'programming',
  'I.T.': 'it',
  'Web Development': 'web',
  'Game Development': 'game',
  Media: 'media',
}

export function categoryKey(name: string): CategoryKey {
  const key = CATEGORY_KEYS[name]
  if (!key) throw new Error(`No colour or icon for the category "${name}"; add it to CATEGORY_KEYS`)
  return key
}

export function unitHeading(heading: string): { number: string | null, title: string } {
  const match = heading.match(/^Unit (\d+):\s*(.+)$/)
  return match ? { number: match[1], title: match[2] } : { number: null, title: heading }
}

/** An item as the course page shows it; built at build time and handed to the CourseUnits island */
export interface ItemView {
  id: string
  type: ItemType
  label: string
  title: string
  // Notes only: their cleaned text, shown in place
  html: string | null
  exercise: boolean
  counts: boolean
}

export interface UnitView {
  id: string
  number: string | null
  title: string
  description: string
  items: ItemView[]
}

export function unitViews(course: Course): UnitView[] {
  return course.units.map(unit => ({
    id: unit.id,
    ...unitHeading(unit.title),
    description: unit.description,
    items: unit.items.map(item => ({
      id: item.id,
      type: item.type,
      ...itemLabel(item),
      html: item.type === 'note' ? sanitize(String(item.payload.html ?? '')) : null,
      exercise: isExercise(item),
      counts: countsTowardProgress(item),
    })),
  }))
}
