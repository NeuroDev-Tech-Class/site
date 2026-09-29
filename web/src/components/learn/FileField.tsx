import { useState } from 'react'
import { ApiError, discardUpload, fileLink, finishUpload, startUpload, type CheckpointField, type UploadedFile } from '../../lib/api'
import { acceptFor, sizeWords } from '../../lib/checkpoint'
import { putFile } from '../../lib/upload'

/** Links to files are short-lived, so one is asked for only when the student wants to look */
async function openFile(fileId: string) {
  const { url } = await fileLink(fileId)
  window.open(url, '_blank', 'noopener')
}

// The space sits outside the span, or it drops out of the field's accessible name
export const Required = ({ field }: { field: CheckpointField }) =>
  field.required ? <>{' '}<span className="font-normal text-(--muted)">(required)</span></> : null

export function FileRow({ file, onRemove }: { file: UploadedFile, onRemove?: () => void }) {
  return (
    <li className="mt-0 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-(--border) px-3 py-2">
      <span className="font-semibold break-all">{file.name}</span>
      <span className="text-sm text-(--muted)">{sizeWords(file.bytes)}</span>
      {file.status === 'removed'
        ? <span className="text-sm text-(--muted)">Removed</span>
        : (
            <span className="ml-auto flex gap-2">
              <button type="button" className="btn-quiet" aria-label={`View ${file.name}`} onClick={() => void openFile(file.id)}>View</button>
              {onRemove && (
                <button type="button" className="btn-quiet" aria-label={`Remove ${file.name}`} onClick={onRemove}>Remove</button>
              )}
            </span>
          )}
    </li>
  )
}

interface Props {
  itemId: string
  field: CheckpointField
  chosen: string[]
  files: Map<string, UploadedFile>
  // The hub's objection to the answer, from a save or from handing in
  error?: string
  onUploaded: (file: UploadedFile) => void
  onChange: (ids: string[]) => void
}

export default function FileField({ itemId, field, chosen, files, error, onUploaded, onChange }: Props) {
  const [progress, setProgress] = useState<{ name: string, percent: number } | null>(null)
  const [refused, setRefused] = useState<string | null>(null)
  const id = `field-${field.id}`
  const message = refused ?? error
  const describedBy = [field.help && `${id}-help`, message && `${id}-error`].filter(Boolean).join(' ') || undefined

  async function upload(file: File): Promise<string | null> {
    setProgress({ name: file.name, percent: 0 })
    try {
      const ticket = await startUpload(itemId, field.id, file.name, file.size)
      await putFile(ticket.upload.url, ticket.upload.headers, file, percent => setProgress({ name: file.name, percent }))
      const ready = await finishUpload(ticket.file.id)
      onUploaded(ready)
      return ready.id
    } catch (failure) {
      setRefused(failure instanceof ApiError ? failure.message : "The upload didn't finish. Check your connection and try again.")
      return null
    } finally {
      setProgress(null)
    }
  }

  async function choose(picked: File[]) {
    setRefused(null)
    let ids = [...chosen]
    for (const file of picked) {
      const uploaded = await upload(file)
      if (uploaded) ids = field.multiple ? [...ids, uploaded] : [uploaded]
    }
    // A single-file question keeps only its newest upload
    for (const replaced of chosen.filter(old => !ids.includes(old))) void discardUpload(replaced).catch(() => undefined)
    onChange(ids)
  }

  async function remove(fileId: string) {
    setRefused(null)
    try {
      await discardUpload(fileId)
    } catch (failure) {
      // Part of work already handed in: it stays for the record, and only leaves this attempt
      if (!(failure instanceof ApiError && failure.status === 409)) {
        setRefused("Couldn't remove that file. Please try again.")
        return
      }
    }
    onChange(chosen.filter(kept => kept !== fileId))
  }

  return (
    <div className="mt-8">
      <label htmlFor={id} className="block font-semibold">
        {field.label}<Required field={field} />
      </label>
      {field.help && <p id={`${id}-help`} className="mt-1 text-sm text-(--muted)">{field.help}</p>}
      {message && <p id={`${id}-error`} className="mt-1 text-sm font-semibold text-red-700 dark:text-red-300">{message}</p>}
      <input
        id={id}
        type="file"
        accept={acceptFor(field)}
        multiple={field.multiple ?? false}
        disabled={progress !== null}
        aria-describedby={describedBy}
        className="mt-2 block w-full text-sm file:btn-quiet file:mr-3"
        onChange={event => {
          const picked = [...(event.target.files ?? [])]
          event.target.value = ''
          if (picked.length) void choose(picked)
        }}
      />
      {progress && (
        <div className="mt-3 flex items-center gap-3">
          <progress className="h-2 flex-1" aria-label={`Uploading ${progress.name}`} value={progress.percent} max={100} />
          <span className="text-sm text-(--muted)">{progress.percent}%</span>
        </div>
      )}
      {chosen.length > 0 && (
        <ul className="mt-3 flex list-none flex-col gap-2 pl-0">
          {chosen.map(fileId => files.get(fileId)).filter(file => file !== undefined).map(file => (
            <FileRow key={file.id} file={file} onRemove={() => void remove(file.id)} />
          ))}
        </ul>
      )}
    </div>
  )
}
