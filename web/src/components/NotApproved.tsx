import type { TechStatus } from '../lib/api'

// What a signed-in account that isn't approved sees in place of a page's own content; `then` says what comes next
export default function NotApproved({ status, then }: { status: TechStatus, then: string }) {
  if (status === 'pending') {
    return <p className="mt-0">Your account is waiting for your tech coach to approve it. {then}</p>
  }
  return <p className="mt-0">Your account wasn't approved. Please talk to your tech coach.</p>
}
