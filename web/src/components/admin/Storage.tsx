import { getUsage } from '../../lib/adminApi'
import { routeHash } from '../../lib/adminRoute'
import { sizeWords } from '../../lib/checkpoint'
import { timeAgo } from '../../lib/format'
import { useLoad } from '../../lib/useLoad'
import { LoadError, Loading, useAdmin, ViewHeading } from './shared'

const CELL = 'px-4 py-3'

function Usage() {
  const usage = useLoad(getUsage, [])
  if (usage.status === 'loading') return <Loading />
  if (usage.status === 'error') return <LoadError />
  const { total_bytes: total, students } = usage.value
  if (!students.length) return <p className="mt-6">No uploads are stored.</p>
  return (
    <>
      <p className="mt-4 text-lg font-semibold">Uploads use {sizeWords(total)} in all.</p>
      <p className="mt-1 text-(--muted)">Open a student to see their files and remove the ones they no longer need.</p>
      <div className="mt-4 overflow-x-auto rounded-lg border border-(--border)">
        <table className="w-full min-w-[32rem] border-collapse text-left">
          <caption className="sr-only">Space used by each student</caption>
          <thead className="bg-(--panel) text-sm text-(--muted)">
            <tr>{['Student', 'Space', 'Files', 'Last upload'].map(t => <th key={t} scope="col" className={CELL}>{t}</th>)}</tr>
          </thead>
          <tbody>
            {students.map(row => (
              <tr key={row.student.id} className="border-t border-(--border)">
                <td className={CELL}>
                  <a href={routeHash({ view: 'student', id: row.student.id })} className="font-semibold">{row.student.name}</a>
                  <p className="mt-0 text-sm text-(--muted)">{row.student.email}</p>
                </td>
                <td className={CELL}>{sizeWords(row.bytes)}</td>
                <td className={CELL}>{row.files} file{row.files === 1 ? '' : 's'}</td>
                <td className={CELL}>{timeAgo(row.last_upload_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default function Storage() {
  const { account } = useAdmin()
  return (
    <>
      <ViewHeading>Storage</ViewHeading>
      {account.role === 'superadmin' ? <Usage /> : <p className="panel mt-6">Storage is for the superadmin.</p>}
    </>
  )
}
