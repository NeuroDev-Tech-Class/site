import type { ReactNode } from 'react'

// Grey shapes standing in for content still loading, laid out like it so nothing jumps when it arrives

const LINE_WIDTHS = ['w-full', 'w-11/12', 'w-10/12', 'w-full', 'w-9/12']

/** One shape; hidden from screen readers, which hear the Skeleton's label instead */
export function Bone({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`skeleton ${className}`} />
}

/** Something loading: its label for screen readers, shapes like it for everyone else */
export function Skeleton({ label, className = '', children }: { label: string, className?: string, children: ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

/** Lines of text, the last one short */
export function TextBones({ lines = 3, className = '' }: { lines?: number, className?: string }) {
  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Bone key={i} className={`h-4 ${i === lines - 1 ? 'w-2/3' : LINE_WIDTHS[i % LINE_WIDTHS.length]}`} />
      ))}
    </div>
  )
}

/** Course cards: a ring, the title and count, and a button (My Courses, a student's page) */
export function CourseCardBones({ count = 2 }: { count?: number }) {
  return (
    <div className="mt-6 grid gap-5 md:grid-cols-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="panel flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Bone className="size-16 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Bone className="h-5 w-3/4" />
              <Bone className="h-4 w-1/3" />
              <Bone className="h-3 w-1/2" />
            </div>
          </div>
          <Bone className="h-4 w-2/3" />
          <Bone className="h-11 w-32 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

/** A table: a header and rows of cells (the queue, students, tests, storage) */
export function TableBones({ rows = 5, columns = 4 }: { rows?: number, columns?: number }) {
  const cells = (height: string) => Array.from({ length: columns }, (_, c) => (
    <Bone key={c} className={`${height} ${c === 0 ? 'w-full' : 'w-3/4'} ${c > 1 ? 'hidden sm:block' : ''}`} />
  ))
  const grid = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
  return (
    <div className="panel mt-6 flex flex-col p-0">
      <div className="grid gap-4 border-b border-(--border) px-5 py-3" style={grid}>{cells('h-3')}</div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="grid items-center gap-4 border-b border-(--border) px-5 py-4 last:border-b-0" style={grid}>{cells('h-4')}</div>
      ))}
    </div>
  )
}

/** A list of short cards, each a title and a line (activity, recent work, certificates, notes) */
export function ListBones({ count = 3, compact = false }: { count?: number, compact?: boolean }) {
  return (
    <div className={`flex flex-col ${compact ? 'gap-3 px-2 py-1' : 'mt-4 gap-3'}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={compact ? 'flex flex-col gap-2' : 'panel flex flex-col gap-2 py-4'}>
          <Bone className={`h-4 ${i % 2 ? 'w-1/2' : 'w-2/3'}`} />
          <Bone className="h-3 w-5/6" />
        </div>
      ))}
    </div>
  )
}

/** Today's tiles: a number and what it counts */
export function TileBones({ count = 3 }: { count?: number }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="panel flex flex-col gap-3">
          <Bone className="h-9 w-14" />
          <Bone className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  )
}

/** The course page's progress panel: the ring, the count and Continue */
export function ProgressPanelBones() {
  return (
    <div className="flex flex-wrap items-center gap-5">
      <Bone className="size-20 shrink-0 rounded-full" />
      <div className="flex min-w-48 flex-1 flex-col gap-2">
        <Bone className="h-5 w-40" />
        <Bone className="h-4 w-56 max-w-full" />
      </div>
      <Bone className="h-11 w-36 rounded-lg" />
    </div>
  )
}

/** A reading: a title, paragraphs and a picture */
export function LessonBones() {
  return (
    <div className="panel flex flex-col gap-5">
      <Bone className="h-8 w-2/3" />
      <TextBones lines={4} />
      <Bone className="h-48 w-full rounded-lg" />
      <TextBones lines={3} />
    </div>
  )
}

/** A form: labelled fields and a button (a checkpoint, a certificate) */
export function FormBones({ fields = 3 }: { fields?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Bone className="h-4 w-32" />
          <Bone className="h-11 w-full rounded-lg" />
        </div>
      ))}
      <Bone className="h-11 w-40 rounded-lg" />
    </div>
  )
}

/** Questions: a number, the question and its choices (a test, grading) */
export function QuestionBones({ count = 3 }: { count?: number }) {
  return (
    <div className="mt-4 flex flex-col gap-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="panel flex flex-col gap-3">
          <Bone className="h-5 w-28" />
          <TextBones lines={2} />
          <Bone className="mt-1 h-16 w-full rounded-lg" />
        </div>
      ))}
    </div>
  )
}

/** A course's units, each a heading and its items */
export function UnitBones({ units = 2, items = 4 }: { units?: number, items?: number }) {
  return (
    <div className="mt-6 flex flex-col gap-6">
      {Array.from({ length: units }, (_, u) => (
        <div key={u} className="panel flex flex-col gap-3">
          <Bone className="h-6 w-1/2" />
          {Array.from({ length: items }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Bone className="size-6 shrink-0 rounded-full" />
              <Bone className={`h-4 ${i % 2 ? 'w-1/2' : 'w-2/3'}`} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/** The dashboard before it knows who is signed in: the sidebar and a view */
export function ShellBones() {
  return (
    <div className="flex gap-8">
      <div className="hidden w-56 shrink-0 flex-col gap-3 min-[900px]:flex">
        {Array.from({ length: 6 }, (_, i) => <Bone key={i} className="h-10 w-full rounded-lg" />)}
      </div>
      <div className="min-w-0 flex-1">
        <Bone className="h-9 w-48" />
        <TileBones />
        <ListBones count={2} />
      </div>
    </div>
  )
}
