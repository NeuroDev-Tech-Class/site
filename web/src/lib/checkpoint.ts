// What the checkpoint form needs to know about its questions. The hub checks everything again when the work is
// handed in (app/tech/answers.py); these only let the page say what is still needed before it asks.
import type { Answers, CheckpointContent, CheckpointField } from './api'
import type { ItemPageView } from './content'

const IMAGE_ACCEPT = '.png,.jpg,.jpeg,.webp,.gif'

/** Every question the student answers; the coach's in-person sign-off is not one of them */
export const answerable = (fields: CheckpointField[]): CheckpointField[] => fields.filter(f => f.type !== 'mentorSignOff')

export const filled = (value: string | string[] | undefined): boolean =>
  Array.isArray(value) ? value.length > 0 : Boolean(value?.trim())

export const answeredCount = (fields: CheckpointField[], answers: Answers): number =>
  answerable(fields).filter(field => filled(answers[field.id])).length

/** How many boxes a checklist needs ticked: all of a required one, unless it says fewer */
export const boxesNeeded = (field: CheckpointField): number =>
  field.required ? (field.min ?? field.items?.length ?? 0) : 0

export function checklistHint(field: CheckpointField): string | null {
  const needed = boxesNeeded(field)
  if (!needed) return null
  return needed === field.items?.length ? 'Tick every box.' : `Tick at least ${needed}.`
}

/** What still stands between the answers and handing them in, as the Review step says it */
export function stillNeeded(checkpoint: CheckpointContent, answers: Answers): string[] {
  const gaps: string[] = []
  for (const field of answerable(checkpoint.fields)) {
    const value = answers[field.id]
    if (field.type === 'checklist') {
      const needed = boxesNeeded(field)
      const ticked = Array.isArray(value) ? value.length : 0
      if (ticked < needed) gaps.push(`${field.label}: ${checklistHint(field)?.toLowerCase()}`)
    } else if (field.required && !filled(value)) {
      gaps.push(`${field.label}: this is required.`)
    }
  }
  const labels = new Map(checkpoint.fields.map(field => [field.id, field.label]))
  for (const group of checkpoint.required_one_of) {
    if (!group.some(fieldId => filled(answers[fieldId]))) {
      gaps.push(`One of these: ${group.map(fieldId => labels.get(fieldId) ?? fieldId).join(', ')}.`)
    }
  }
  return gaps
}

/** Only answered questions are saved, so clearing a box removes its answer */
export const withoutBlanks = (answers: Answers): Answers =>
  Object.fromEntries(Object.entries(answers).filter(([, value]) => filled(value)))

export const acceptFor = (field: CheckpointField): string =>
  field.type === 'image' ? IMAGE_ACCEPT : (field.accept ?? []).join(',')

export function sizeWords(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} MB`
}

/** The starter's download name: the course and checkpoint, so it is easy to find in Downloads */
export function starterFileName(page: ItemPageView): string {
  const slug = page.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${page.course.id}-${slug}-starter.zip`
}
