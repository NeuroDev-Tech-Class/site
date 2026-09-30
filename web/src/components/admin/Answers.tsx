import { useEffect, useState } from 'react'
import type { CheckpointForm } from '../../lib/adminApi'
import { fileLink, type Answers as AnswerSet, type CheckpointField, type UploadedFile } from '../../lib/api'
import { filled, sizeWords } from '../../lib/checkpoint'
import Icon from '../Icon'

/** Links last minutes, so a file asks for its own when it is shown; downloads ask when clicked */
function useLink(file: UploadedFile, wanted: boolean): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!wanted) return
    let current = true
    fileLink(file.id).then(link => current && setUrl(link.url), () => undefined)
    return () => { current = false }
  }, [file.id, wanted])
  return url
}

async function download(file: UploadedFile) {
  const { url } = await fileLink(file.id, true)
  window.open(url, '_blank', 'noopener')
}

function FileAnswer({ file }: { file: UploadedFile }) {
  const kind = file.content_type.split('/')[0]
  const shown = file.status === 'ready' && (kind === 'image' || kind === 'audio')
  const url = useLink(file, shown)
  if (file.status === 'removed') {
    return <p className="mt-2 text-(--muted)">{file.name} ({sizeWords(file.bytes)}) was removed to free space.</p>
  }
  return (
    <div className="mt-2 flex flex-col items-start gap-2">
      {kind === 'image' && url && (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img src={url} alt={file.name} className="max-h-96 max-w-full rounded-lg border border-(--border)" />
        </a>
      )}
      {kind === 'audio' && url && <audio controls src={url} className="w-full max-w-md" />}
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-semibold break-all">{file.name}</span>
        <span className="text-sm text-(--muted)">{sizeWords(file.bytes)}</span>
        <button type="button" className="btn-quiet" aria-label={`Download ${file.name}`} onClick={() => void download(file)}>
          <Icon name="download" size={16} /> Download
        </button>
      </div>
    </div>
  )
}

function Answer({ field, value, files }: { field: CheckpointField, value: string | string[] | undefined, files: UploadedFile[] }) {
  if (field.type === 'mentorSignOff') {
    return <p className="mt-1">You confirm this in person when you mark it complete.</p>
  }
  if (field.type === 'checklist') {
    const ticked = Array.isArray(value) ? value : []
    return (
      <ul className="mt-1 flex list-none flex-col gap-1 pl-0">
        {(field.items ?? []).map(item => {
          const on = ticked.includes(item)
          return (
            <li key={item} className={`mt-0 flex items-center gap-2 ${on ? '' : 'text-(--muted)'}`}>
              <span className="sr-only">{on ? 'Ticked: ' : 'Not ticked: '}</span>
              <Icon name={on ? 'check' : 'note'} size={16} className={on ? 'text-(--check)' : 'opacity-40'} />
              {item}
            </li>
          )
        })}
      </ul>
    )
  }
  if (!value || !filled(value)) return <p className="mt-1 text-(--muted)">Not answered</p>
  if (field.type === 'file' || field.type === 'image') {
    const byId = new Map(files.map(file => [file.id, file]))
    return <>{(value as string[]).map(id => byId.get(id)).filter(file => file !== undefined).map(file => <FileAnswer key={file.id} file={file} />)}</>
  }
  const text = String(value)
  if (field.type === 'url') {
    return <p className="mt-1 break-all"><a href={text} target="_blank" rel="noopener noreferrer">{text}</a></p>
  }
  if (field.type === 'code') return <pre className="mt-1 overflow-x-auto rounded-lg bg-(--page) p-3 text-sm"><code>{text}</code></pre>
  return <p className="mt-1 whitespace-pre-line">{text}</p>
}

/** A checkpoint's answers question by question; anything else (an imported test) as question and answer */
export default function Answers({ form, answers, files }: { form: CheckpointForm | null, answers: AnswerSet, files: UploadedFile[] }) {
  if (!form) {
    const entries = Object.entries(answers)
    if (!entries.length) return <p className="text-(--muted)">No answers were kept for this.</p>
    return (
      <dl>
        {entries.map(([question, value]) => (
          <div key={question} className="border-t border-(--border) py-3">
            <dt className="font-semibold">{question}</dt>
            <dd className="mt-1 ml-0 whitespace-pre-line">{Array.isArray(value) ? value.join(', ') : String(value)}</dd>
          </div>
        ))}
      </dl>
    )
  }
  return (
    <div>
      {form.fields.map(field => (
        <div key={field.id} role="group" aria-labelledby={`answer-${field.id}`} className="border-t border-(--border) py-4">
          <h3 id={`answer-${field.id}`} className="mt-0 text-base">{field.label}</h3>
          <Answer field={field} value={answers[field.id]} files={files.filter(file => file.field_id === field.id)} />
        </div>
      ))}
    </div>
  )
}
