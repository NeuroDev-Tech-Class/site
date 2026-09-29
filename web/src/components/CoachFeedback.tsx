/** The coach's words on a piece of work, as plain text with their line breaks kept */
export default function CoachFeedback({ text }: { text: string }) {
  return (
    <div className="rounded-lg border-l-4 border-(--callout-note) bg-(--page) px-4 py-3">
      <p className="mt-0 text-sm font-semibold">Your coach's feedback:</p>
      <p className="mt-1 whitespace-pre-line">{text}</p>
    </div>
  )
}
