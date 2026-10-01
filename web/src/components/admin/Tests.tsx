import { useState, type ChangeEvent } from 'react'
import { getTestPreview, getTests, testSourcePath, uploadTest, type TestRow } from '../../lib/adminApi'
import { routeHash } from '../../lib/adminRoute'
import { ApiError, saveFile, type LineProblem } from '../../lib/api'
import { countWords, formatDate } from '../../lib/format'
import { useLoad } from '../../lib/useLoad'
import Question from '../test/Question'
import { CELL, DataTable, ErrorLine, LoadError, Loading, problemWords, StatusLine, ViewHeading } from './shared'

const EXAMPLE = `# Unit 1 Test
pass: 70
attempts: 2

1. [mc] (1pt) What does len() return?
   - The number of items *
   - The last item
   > len() counts the items.

2. [short] (1pt) Which command lists a folder?
   accept: ls

3. [written] (3pt) Explain what an operating system does.
   rubric: 3 = hardware and programs; 1 = one idea.`

function byCourse(rows: TestRow[]): { course: TestRow['course'], rows: TestRow[] }[] {
  const groups = new Map<string, { course: TestRow['course'], rows: TestRow[] }>()
  for (const row of rows) {
    const group = groups.get(row.course.id) ?? { course: row.course, rows: [] }
    group.rows.push(row)
    groups.set(row.course.id, group)
  }
  return [...groups.values()]
}

function Refused({ title, problems }: { title: string, problems: LineProblem[] }) {
  return (
    <div role="alert" className="panel mt-4 border-l-4 border-red-700 dark:border-red-300">
      <p className="mt-0 font-semibold">{title} wasn't uploaded. The file needs fixing:</p>
      <ul className="mt-2 list-disc pl-6">
        {problems.map((problem, i) => <li key={i}>{problem.line ? `Line ${problem.line}: ` : ''}{problem.message}</li>)}
      </ul>
    </div>
  )
}

export default function Tests() {
  const tests = useLoad(getTests, [])
  const [said, setSaid] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  const [refused, setRefused] = useState<{ title: string, problems: LineProblem[] } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  async function upload(row: TestRow, event: ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return
    setBusy(row.item_id)
    setSaid('')
    setProblem(null)
    setRefused(null)
    try {
      const saved = await uploadTest(row.item_id, await file.text())
      setSaid(`${row.title} uploaded (version ${saved.version}).`)
      await tests.reload()
    } catch (failure) {
      if (failure instanceof ApiError && failure.problems.length) setRefused({ title: row.title, problems: failure.problems })
      else setProblem(`${row.title} wasn't uploaded: ${problemWords(failure, 'please try again.')}`)
    } finally {
      // The same file can be chosen again once it is fixed
      input.value = ''
      setBusy(null)
    }
  }

  async function download(row: TestRow) {
    setProblem(null)
    try {
      await saveFile(testSourcePath(row.item_id), `${row.item_id}.md`)
    } catch (failure) {
      setProblem(problemWords(failure, `Couldn't download ${row.title}. Please try again.`))
    }
  }

  return (
    <>
      <ViewHeading>Tests</ViewHeading>
      <p className="mt-2 max-w-prose">
        Each test is a file kept only in the hub, so students never see the answers. Download one to change it, then
        upload it again; attempts already started keep the questions they began with.
      </p>
      <details className="mt-3 max-w-prose">
        <summary className="cursor-pointer font-semibold">How a test file is written</summary>
        <p>
          A title, then numbered questions: <code>[mc]</code> one answer, <code>[multi]</code> several,{' '}
          <code>[tf]</code> true or false, <code>[match]</code> pairs, <code>[short]</code> with <code>accept:</code>{' '}
          answers marked on the spot, and <code>[short]</code>, <code>[written]</code> or <code>[code]</code> without
          them for you to mark. A <code>*</code> marks a right choice, <code>&gt;</code> lines explain the answer, and a
          file with a <code>check:</code> line is refused until you confirm it.
        </p>
        <pre className="overflow-x-auto text-sm"><code>{EXAMPLE}</code></pre>
      </details>
      <StatusLine>{said}</StatusLine>
      <ErrorLine>{problem}</ErrorLine>
      {refused && <Refused {...refused} />}
      {tests.status === 'loading' && <Loading />}
      {tests.status === 'error' && <LoadError onRetry={() => void tests.reload()} />}
      {tests.status === 'ready' && byCourse(tests.value).map(({ course, rows }) => (
        <section key={course.id} className="mt-8" aria-labelledby={`tests-${course.id}`}>
          <h2 id={`tests-${course.id}`} className="mt-0 text-xl">{course.title}</h2>
          <DataTable caption={`Tests in ${course.title}`} head={['Test', 'Uploaded', 'Questions', 'Handed in', '']} minWidth="44rem">
            {rows.map(row => (
              <tr key={row.item_id} className="border-t border-(--border) align-top">
                <td className={CELL}>
                  <span className="font-semibold">{row.title}</span>
                  {row.uploaded && (
                    <a href={routeHash({ view: 'test', id: row.item_id })} aria-label={`Preview ${row.title}`}
                      className="block text-sm font-semibold">Preview</a>
                  )}
                </td>
                <td className={CELL}>
                  {row.uploaded
                    ? (
                        <>
                          Version {row.version}
                          <p className="mt-0 text-sm text-(--muted)">{formatDate(row.uploaded_at)}{row.uploaded_by ? ` by ${row.uploaded_by}` : ''}</p>
                        </>
                      )
                    : <span className="text-(--muted)">Not uploaded</span>}
                </td>
                <td className={CELL}>
                  {row.uploaded
                    ? (
                        <>
                          {countWords(row.questions, 'question')}, {countWords(row.total_points, 'point')}
                          {row.coach_points > 0 && <p className="mt-0 text-sm text-(--muted)">{countWords(row.coach_points, 'point')} for you to mark</p>}
                        </>
                      )
                    : null}
                </td>
                <td className={CELL}>{row.handed_in}</td>
                <td className={CELL}>
                  <span className="flex flex-wrap justify-end gap-2">
                    <label className="btn-quiet cursor-pointer focus-within:outline-2 focus-within:outline-offset-2">
                      {busy === row.item_id ? 'Uploading…' : 'Upload'}
                      <input type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" className="sr-only"
                        aria-label={`Upload a file for ${row.title}`} disabled={busy !== null}
                        onChange={event => void upload(row, event)} />
                    </label>
                    {row.uploaded && (
                      <button type="button" className="btn-quiet" aria-label={`Download ${row.title}`} onClick={() => void download(row)}>
                        Download
                      </button>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </DataTable>
        </section>
      ))}
    </>
  )
}

export function TestPreview({ id }: { id: string }) {
  const test = useLoad(() => getTestPreview(id), [id])
  const back = <a href={routeHash({ view: 'tests' })}>All tests</a>
  if (test.status === 'loading') return <><ViewHeading eyebrow={back}>Preview</ViewHeading><Loading /></>
  if (test.status === 'error') {
    const missing = test.failure instanceof ApiError && test.failure.status === 404 ? test.failure.message : null
    return (
      <>
        <ViewHeading eyebrow={back}>Preview</ViewHeading>
        {missing ? <p className="panel mt-6">{missing}</p> : <LoadError onRetry={() => void test.reload()} />}
      </>
    )
  }
  const view = test.value
  return (
    <>
      <ViewHeading eyebrow={back}>{view.title}</ViewHeading>
      <p className="mt-2 font-semibold">
        Pass mark {view.pass_percent}% · {countWords(view.attempts_allowed, 'attempt')} · {countWords(view.total_points, 'point')}
      </p>
      <p className="mt-1 text-(--muted)">What a student sees, with the answers switched off.</p>
      {view.instructions_html && <div className="lesson mt-4" dangerouslySetInnerHTML={{ __html: view.instructions_html }} />}
      {view.questions.map(question => <Question key={question.number} question={question} disabled />)}
    </>
  )
}
