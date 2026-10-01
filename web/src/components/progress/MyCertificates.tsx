import { useState } from 'react'
import { openCertificate, type MyCertificate } from '../../lib/api'
import { calendarDate } from '../../lib/format'
import { useMyCertificates } from '../../lib/myWork'
import Icon from '../Icon'

function Row({ certificate }: { certificate: MyCertificate }) {
  const [problem, setProblem] = useState<string | null>(null)
  async function view() {
    setProblem(null)
    try {
      await openCertificate(certificate.id)
    } catch {
      setProblem("Couldn't open it. Please try again.")
    }
  }
  return (
    <li className="panel mt-0 flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="flex items-start gap-2 font-semibold text-(--heading)">
        <Icon name="award" size={18} className="mt-1 shrink-0" />{certificate.course_name}
      </span>
      <span className="text-sm text-(--muted)">Awarded {calendarDate(certificate.awarded_on, 'long')}</span>
      <button type="button" className="btn-quiet sm:ml-auto" aria-label={`View the ${certificate.course_name} certificate`}
        onClick={() => void view()}>
        View
      </button>
      {problem && <p role="alert" className="mt-0 w-full text-sm font-semibold">{problem}</p>}
    </li>
  )
}

/** The certificates the coach has let the student view; nothing at all until there is one */
export default function MyCertificates() {
  const state = useMyCertificates()
  if (state.status === 'error') return <p className="mt-10">Couldn't load your certificates. Reload the page to try again.</p>
  if (state.status !== 'ready' || !state.value.length) return null
  return (
    <section className="mt-10" aria-labelledby="my-certificates">
      <h2 id="my-certificates" className="text-2xl">Certificates</h2>
      <ul className="mt-4 flex list-none flex-col gap-3 pl-0">
        {state.value.map(certificate => <Row key={certificate.id} certificate={certificate} />)}
      </ul>
    </section>
  )
}
