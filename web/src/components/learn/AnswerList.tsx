import type { Answers, CheckpointField, UploadedFile } from '../../lib/api'
import { answerable, filled } from '../../lib/checkpoint'
import { FileRow } from './FileField'

function Answer({ field, value, files }: { field: CheckpointField, value: string | string[] | undefined, files: Map<string, UploadedFile> }) {
  if (!value || !filled(value)) return <span className="text-(--muted)">Not answered</span>
  if (field.type === 'file' || field.type === 'image') {
    return (
      <ul className="flex list-none flex-col gap-2 pl-0">
        {(value as string[]).map(fileId => files.get(fileId)).filter(file => file !== undefined).map(file => (
          <FileRow key={file.id} file={file} />
        ))}
      </ul>
    )
  }
  if (Array.isArray(value)) {
    return <ul className="list-disc pl-6">{value.map(item => <li key={item} className="mt-0">{item}</li>)}</ul>
  }
  if (field.type === 'url') return <a href={value} target="_blank" rel="noopener noreferrer" className="break-all">{value}</a>
  if (field.type === 'code') return <pre className="overflow-x-auto text-sm"><code>{value}</code></pre>
  return <span className="whitespace-pre-line">{value}</span>
}

/** Every question with the student's answer, as the Review step and the receipt show them */
export default function AnswerList({ fields, answers, files }: { fields: CheckpointField[], answers: Answers, files: UploadedFile[] | Map<string, UploadedFile> }) {
  const known = files instanceof Map ? files : new Map(files.map(file => [file.id, file]))
  return (
    <dl className="mt-4">
      {answerable(fields).map(field => (
        <div key={field.id} className="border-t border-(--border) py-3">
          <dt className="font-semibold">{field.label}</dt>
          <dd className="mt-1 ml-0"><Answer field={field} value={answers[field.id]} files={known} /></dd>
        </div>
      ))}
    </dl>
  )
}
