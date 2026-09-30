// What an item is called, kept apart from content.ts so browser code can use it without the course files
export type ItemType = 'lesson' | 'video' | 'checkpoint' | 'test' | 'slides' | 'link' | 'note'

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

export function itemLabel(item: { type: ItemType, title: string | null }): { label: string, title: string } {
  const title = item.title ?? ''
  for (const prefix of REDUNDANT_PREFIXES[item.type] ?? []) {
    if (title.startsWith(`${prefix} - `)) return { label: prefix, title: title.slice(prefix.length + 3) }
  }
  return { label: LABELS[item.type], title }
}
