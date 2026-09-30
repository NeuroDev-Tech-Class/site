import sanitizeHtml from 'sanitize-html'
import catalogJson from '../../../content/catalog.json'
import vocabulary from '../../../content/vocabulary.json'
import { itemLabel, type ItemType } from './itemLabel'

export { itemLabel, type ItemType }

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

const PAGED_TYPES: ItemType[] = ['lesson', 'video', 'slides', 'link', 'checkpoint']
const NEXT_TEXT_MAX = 80

export const hasPage = (type: ItemType): boolean => PAGED_TYPES.includes(type)

/** Where an item opens: its own page, or its place on the course page for items without one */
const itemHref = (courseId: string, item: { id: string, type: ItemType }): string =>
  hasPage(item.type) ? `/learn/${item.id}` : `/courses/${courseId}#item-${item.id}`

/** An item page's public outline, built at build time; what the item holds loads after sign-in */
export interface ItemPageView {
  id: string
  type: ItemType
  label: string
  title: string
  course: { id: string, heading: string, category: CategoryKey }
  unit: { id: string, title: string }
  previous: { href: string, text: string } | null
  next: { href: string, text: string } | null
}

function nextText(item: Item): string {
  if (item.type !== 'note') {
    const { label, title } = itemLabel(item)
    return `${label}: ${title}`
  }
  const words = sanitize(String(item.payload.html ?? '')).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  return words.length > NEXT_TEXT_MAX ? `${words.slice(0, NEXT_TEXT_MAX).replace(/\s+\S*$/, '')}…` : words
}

export function itemPages(course: Course): ItemPageView[] {
  const flat = course.units.flatMap(unit => unit.items.map(item => ({ unit, item })))
  const steps = flat.filter(({ item }) => item.type !== 'note' || isExercise(item))
  return steps.flatMap(({ unit, item }, index) => {
    if (!hasPage(item.type)) return []
    const before = steps[index - 1]?.item
    const after = steps[index + 1]?.item
    return [{
      id: item.id,
      type: item.type,
      ...itemLabel(item),
      course: { id: course.id, heading: course.heading, category: categoryKey(course.category) },
      unit: { id: unit.id, title: unitHeading(unit.title).title },
      previous: before ? { href: itemHref(course.id, before), text: nextText(before) } : null,
      next: after ? { href: itemHref(course.id, after), text: nextText(after) } : null,
    }]
  })
}

/** The embed view of a Google Slides deck, or null for anything else */
export function slidesEmbedUrl(url: string): string | null {
  const match = url.match(/^https:\/\/docs\.google\.com\/presentation\/(?:u\/\d+\/)?d\/([A-Za-z0-9_-]+)/)
  return match ? `https://docs.google.com/presentation/d/${match[1]}/embed?start=false&loop=false` : null
}

/** What a progress card needs to name and colour a course the hub mentions */
export interface CourseMeta {
  id: string
  heading: string
  category: CategoryKey
}

export const courseMeta = (): CourseMeta[] =>
  publishedCourses().map(course => ({ id: course.id, heading: course.heading, category: categoryKey(course.category) }))

/** A course card's accent colour; a course the site doesn't list (a draft an admin can see) gets the brand cyan */
export const courseAccent = (meta?: CourseMeta): string =>
  meta ? `var(--cat-${meta.category})` : 'var(--color-brand-cyan)'

/** Every item that has its own page, across the published courses */
export const allPageIds = (): string[] => publishedCourses().flatMap(itemPages).map(page => page.id)

/** Where Continue goes for the hub's next_item: its page if it has one (`pageIds`), else its place on the course page */
export const continueHref = (courseId: string, itemId: string, pageIds: string[]): string =>
  pageIds.includes(itemId) ? `/learn/${itemId}` : `/courses/${courseId}#item-${itemId}`
