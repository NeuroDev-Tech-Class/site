import { useCallback, useState, type MouseEvent } from 'react'
import {
  addAdmin,
  approveAccount,
  deleteAccount,
  getStaff,
  getStudents,
  removeAdmin,
  updateAccount,
  type AdminAccount,
  type StudentRow,
} from '../../lib/adminApi'
import { routeHash, type AdminRoute, type StudentsTab } from '../../lib/adminRoute'
import { countWords, formatDate, fullName, timeAgo } from '../../lib/format'
import { useLoad } from '../../lib/useLoad'
import { CELL, ConfirmButton, DataTable, ErrorLine, LoadError, Loading, problemWords, REFRESH_MS, SearchField, showRoute, StatusLine, useAdmin, ViewHeading, waitingOnCoach } from './shared'

type StudentsRoute = Extract<AdminRoute, { view: 'students' }>

const TAB_NAMES: Record<StudentsTab, string> = { pending: 'Pending', current: 'Current', old: 'Old', admins: 'Admins' }

function groupOf(student: StudentRow): Exclude<StudentsTab, 'admins'> {
  if (student.status === 'pending' || student.status === 'declined') return 'pending'
  return student.student_type === 'old' ? 'old' : 'current'
}

/** A row that opens the student wherever it is clicked, except on its own links and buttons */
function openRow(id: string) {
  return (event: MouseEvent) => {
    if (!(event.target as Element).closest('a, button, input')) showRoute({ view: 'student', id })
  }
}

const ROW = 'cursor-pointer border-t border-(--border) hover:bg-(--panel)'

function StudentLink({ student }: { student: StudentRow }) {
  return <a href={routeHash({ view: 'student', id: student.id })} className="font-semibold">{student.name}</a>
}

function Admins({ say }: { say: (words: string) => void }) {
  const staff = useLoad(getStaff, [])
  const [email, setEmail] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function add() {
    setBusy(true)
    setProblem(null)
    try {
      await addAdmin(email.trim())
      say(`${email.trim()} is now an admin.`)
      setEmail('')
      await staff.reload()
    } catch (failure) {
      setProblem(problemWords(failure, "Couldn't add them. Please try again."))
    } finally {
      setBusy(false)
    }
  }

  async function remove(member: AdminAccount) {
    setProblem(null)
    try {
      await removeAdmin(member.id)
      say(`${fullName(member) || member.email} is no longer an admin.`)
      await staff.reload()
    } catch (failure) {
      setProblem(problemWords(failure, "Couldn't remove them. Please try again."))
    }
  }

  return (
    <>
      <form className="mt-6 flex flex-wrap items-end gap-3" onSubmit={event => { event.preventDefault(); void add() }}>
        <label className="flex max-w-sm flex-1 basis-60 flex-col gap-1 font-semibold">
          Email
          <input type="email" className="field" required value={email} onChange={event => setEmail(event.target.value)} />
        </label>
        <button type="submit" className="btn-primary" disabled={busy || !email.trim()}>Add admin</button>
      </form>
      <p className="mt-2 text-sm text-(--muted)">
        A student with that email becomes an admin; anyone new gets an email to set their password.
      </p>
      <ErrorLine>{problem}</ErrorLine>
      {staff.status === 'loading' && <Loading />}
      {staff.status === 'error' && <LoadError onRetry={() => void staff.reload()} />}
      {staff.status === 'ready' && (
        <DataTable caption="Admins" head={['Name', 'Email', 'Role', '']}>
          {staff.value.map(member => {
            const name = fullName(member) || member.email
            return (
              <tr key={member.id} className="border-t border-(--border)">
                <td className={`${CELL} font-semibold`}>{fullName(member) || <span className="font-normal text-(--muted)">No name yet</span>}</td>
                <td className={CELL}>{member.email}</td>
                <td className={CELL}>{member.role === 'superadmin' ? 'Superadmin' : 'Admin'}</td>
                <td className={CELL}>
                  {member.staff_source === 'hub'
                    ? <span className="text-sm text-(--muted)">Managed in the hub</span>
                    : <ConfirmButton label="Remove" name={`Remove ${name} as an admin`} confirm="Yes, remove" onConfirm={() => void remove(member)} />}
                </td>
              </tr>
            )
          })}
        </DataTable>
      )}
    </>
  )
}

export default function Students({ route }: { route: StudentsRoute }) {
  const { account, refreshCounts } = useAdmin()
  const roster = useLoad(getStudents, [], { every: REFRESH_MS })
  // What the last action came to, shown only on the tab it happened on
  const [note, setNote] = useState<{ tab: StudentsTab, said: string, problem: string | null }>({ tab: 'current', said: '', problem: null })
  const [busy, setBusy] = useState<string | null>(null)
  const owner = account.role === 'superadmin'
  const tabs: StudentsTab[] = owner ? ['pending', 'current', 'old', 'admins'] : ['pending', 'current', 'old']
  const tab = tabs.includes(route.tab) ? route.tab : 'current'
  const search = useCallback((q: string | undefined) => showRoute({ ...route, q }, { replace: true }), [route])

  async function act(student: StudentRow, action: () => Promise<unknown>, words: string, fallback: string) {
    setBusy(student.id)
    setNote({ tab, said: '', problem: null })
    try {
      await action()
      setNote({ tab, said: words, problem: null })
      refreshCounts()
      await roster.reload()
    } catch (failure) {
      setNote({ tab, said: '', problem: problemWords(failure, fallback) })
    } finally {
      setBusy(null)
    }
  }

  const words = (route.q ?? '').toLowerCase()
  const everyone = roster.status === 'ready' ? roster.value : []
  const found = everyone.filter(s => !words || s.name.toLowerCase().includes(words) || s.email.toLowerCase().includes(words))
  const inTab = (t: StudentsTab) => found.filter(s => groupOf(s) === t)
  // Pending counts those waiting on a coach (as the sidebar badge does); unconfirmed and declined follow them
  const counted = (t: StudentsTab) => (t === 'pending' ? inTab(t).filter(waitingOnCoach) : inTab(t)).length
  const shown = tab === 'admins' ? [] : tab === 'pending'
    ? [...inTab(tab).filter(waitingOnCoach), ...inTab(tab).filter(s => !waitingOnCoach(s))]
    : inTab(tab)

  let body
  if (tab === 'admins') body = <Admins say={said => setNote({ tab: 'admins', said, problem: null })} />
  else if (roster.status === 'loading') body = <Loading />
  else if (roster.status === 'error') body = <LoadError />
  else if (!shown.length) {
    body = (
      <p className="mt-6">
        {route.q ? `No ${TAB_NAMES[tab].toLowerCase()} students match "${route.q}".`
          : tab === 'pending' ? 'Nobody is waiting for approval.' : `No ${TAB_NAMES[tab].toLowerCase()} students yet.`}
      </p>
    )
  } else if (tab === 'pending') {
    body = (
      <DataTable caption="Pending students" head={['Name', 'Email', 'Signed up', '']}>
        {shown.map(student => (
          <tr key={student.id} className={ROW} onClick={openRow(student.id)}>
            <td className={CELL}>
              <StudentLink student={student} />
              {student.status === 'declined' && <span className="ml-2 text-sm text-(--muted)">Declined</span>}
              {!student.email_verified && <p className="mt-0 text-sm text-(--muted)">hasn't confirmed their email yet</p>}
            </td>
            <td className={CELL}>{student.email}</td>
            <td className={CELL}>{formatDate(student.created_at, { month: 'long' })}</td>
            <td className={CELL}>
              <span className="flex flex-wrap gap-2">
                <button type="button" className="btn-primary" disabled={busy !== null} aria-label={`Approve ${student.name}`}
                  onClick={() => void act(student, () => approveAccount(student.id), `${student.name} approved.`,
                    `Couldn't approve ${student.name}. Please try again.`)}>
                  Approve
                </button>
                <ConfirmButton label="Deny" name={`Deny ${student.name}`} confirm="Yes, delete this sign-up" disabled={busy !== null}
                  onConfirm={() => void act(student, () => deleteAccount(student.id), `${student.name}'s sign-up was deleted.`,
                    `Couldn't delete ${student.name}'s sign-up. Please try again.`)} />
              </span>
            </td>
          </tr>
        ))}
      </DataTable>
    )
  } else {
    const other = tab === 'current' ? 'old' : 'current'
    body = (
      <DataTable caption={`${TAB_NAMES[tab]} students`} head={['Name', 'Progress', 'Last active', 'Work', '']}>
        {shown.map(student => (
          <tr key={student.id} className={ROW} onClick={openRow(student.id)}>
            <td className={CELL}>
              <StudentLink student={student} />
              {student.status === 'deactivated' && <span className="ml-2 text-sm text-(--muted)">Deactivated</span>}
              <p className="mt-0 text-sm text-(--muted)">{student.email}</p>
            </td>
            <td className={CELL}>
              {student.courses_started
                ? <>{student.percent}% <span className="text-sm text-(--muted)">· {countWords(student.courses_started, 'course')}</span></>
                : <span className="text-(--muted)">Not started</span>}
            </td>
            <td className={CELL}>{student.last_activity_at ? timeAgo(student.last_activity_at) : 'Never'}</td>
            <td className={CELL}>
              {student.waiting > 0 && <span className="done-chip mr-2">{student.waiting} waiting</span>}
              {student.returned > 0 && <span className="text-sm">{student.returned} returned</span>}
            </td>
            <td className={CELL}>
              <button type="button" className="btn-quiet" disabled={busy !== null} aria-label={`Move ${student.name} to ${TAB_NAMES[other]}`}
                onClick={() => void act(student, () => updateAccount(student.id, { student_type: other }),
                  `${student.name} moved to ${TAB_NAMES[other]}.`, `Couldn't move ${student.name}. Please try again.`)}>
                Move to {TAB_NAMES[other]}
              </button>
            </td>
          </tr>
        ))}
      </DataTable>
    )
  }

  return (
    <>
      <ViewHeading>Students</ViewHeading>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <SearchField label="Search students" applied={route.q} onApply={search} placeholder="Name or email" />
      </div>
      <ul aria-label="Student groups" className="mt-6 flex list-none flex-wrap gap-2 border-b border-(--border) pl-0">
        {tabs.map(t => (
          <li key={t} className="mt-0">
            <a
              href={routeHash({ view: 'students', tab: t, q: route.q })}
              aria-current={t === tab ? 'page' : undefined}
              onClick={event => { event.preventDefault(); showRoute({ view: 'students', tab: t, q: route.q }, { replace: true }) }}
              className="-mb-px flex min-h-[44px] items-center gap-2 border-b-2 border-transparent px-3 font-semibold text-(--text) no-underline aria-[current=page]:border-(--brand-accent) aria-[current=page]:text-(--heading)"
            >
              {TAB_NAMES[t]}
              {t !== 'admins' && roster.status === 'ready' && <span className="text-sm text-(--muted)">{counted(t)}</span>}
            </a>
          </li>
        ))}
      </ul>
      <StatusLine>{note.tab === tab ? note.said : ''}</StatusLine>
      <ErrorLine>{note.tab === tab ? note.problem : null}</ErrorLine>
      {body}
    </>
  )
}
