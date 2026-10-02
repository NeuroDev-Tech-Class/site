// What the pages' scripts need from the course content, with none of the content itself: importing lib/content.ts
// from a browser component would ship every course outline to the browser.
import type { ItemType } from './itemLabel'

export type CategoryKey = 'basics' | 'programming' | 'it' | 'web' | 'game' | 'media'

/** What a progress card needs to name and colour a course the hub mentions */
export interface CourseMeta {
  id: string
  heading: string
  category: CategoryKey
}

const PAGED_TYPES: ItemType[] = ['lesson', 'video', 'slides', 'link', 'checkpoint', 'test']

export const hasPage = (type: ItemType): boolean => PAGED_TYPES.includes(type)

/** A course card's accent colour; a course the site doesn't list (a draft an admin can see) gets the brand cyan */
export const courseAccent = (meta?: CourseMeta): string =>
  meta ? `var(--cat-${meta.category})` : 'var(--color-brand-cyan)'

/** Where Continue goes for the hub's next_item: its page if it has one (`pageIds`), else its place on the course page */
export const continueHref = (courseId: string, itemId: string, pageIds: string[]): string =>
  pageIds.includes(itemId) ? `/learn/${itemId}` : `/courses/${courseId}#item-${itemId}`

/** The embed view of a Google Slides deck, or null for anything else */
export function slidesEmbedUrl(url: string): string | null {
  const match = url.match(/^https:\/\/docs\.google\.com\/presentation\/(?:u\/\d+\/)?d\/([A-Za-z0-9_-]+)/)
  return match ? `https://docs.google.com/presentation/d/${match[1]}/embed?start=false&loop=false` : null
}
