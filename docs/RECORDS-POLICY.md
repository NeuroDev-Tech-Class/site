# Student records: retention, backup, access and closure

**Draft for Topher's approval (2026-10-01).** Covers the Tech Class site (`tech.neurodevmentoring.com`) and its data in
the hub. Written against Utah Code 13-34-203 (record keeping, Postsecondary School and State Authorization Act),
Utah Admin. Code R152-34, 13-34a-207 (closure), the common standards of vocational accreditors (ACCSC, COE, ACCET,
DEAC) and FERPA as good practice. Items marked **(confirm)** need Topher or Mandy.

## What we keep

| Record | Where | Kept |
|---|---|---|
| Student account: name, email, sign-up, approval (who, when), current/old, deactivation | hub Postgres, `tech.accounts` | permanently; an account that was ever approved is deactivated, never deleted |
| Progress: every open, completion, undo, submission and return, with time and who did it | `tech.progress`, `tech.progress_events` (append-only) | permanently |
| Video watching per student and video | `tech.media_views` | permanently |
| Handed-in work, test attempts, scores, feedback, grader and times; old Google Form scores (attempt 0, from 2023) | `tech.submissions` | permanently |
| Uploaded files | Cloudflare R2, `tech-class-uploads` | permanently; a superadmin removal keeps the record of the file and a log line |
| Certificates: the PDF as printed, who created it and when, access given, revoked (kept) | `tech.certificates` + R2 | permanently |
| Activity record (approvals, grading, certificates, removals), with CSV export | `tech.activity` (append-only) | permanently |
| The old Firebase site's data as exported at cutover | R2 `archive/firebase-export-<date>.json` | permanently |

Utah requires transcripts, diplomas and certificates kept at least 60 years and other educational records at least 10;
keeping everything permanently meets both. The class charges no tuition, so there are no enrollment agreements or
payment records to keep. If that changes, they must be kept 10 years and this document updated.

## Backups

- Render keeps point-in-time recovery for the hub database for 7 days and its logical backups for 7 days. That covers
  mistakes, not the retention periods above.
- **Monthly (Topher, first working day):** Render > hub database > Recovery > create a logical backup, download it, and
  upload it to R2 `archive/db/<yyyy-mm>.dir.tar.gz`. **(confirm)** who does this when Topher is away.
- R2 holds uploads, certificates and the archives; nothing in it is deleted by the site.

## A student asking for their record

- Answer within **5 business days** (Utah), free or at copying cost.
- Until the "My record" PDF ships (planned right after cutover), a coach puts it together from the dashboard: the
  student's page (courses, handed-in work, scores, certificates) and the Activity CSV filtered to the student.
- Only the student (or a parent of a minor) gets it. Check who is asking from the email on the account.

## Sharing a record with anyone else

- Only with the student's written consent, or when the law requires it.
- Note every disclosure (date, who received what, why, the consent) in the student's file. **(confirm)** where: a
  shared folder per student, or a log the coach keeps.

## If the school closes

- Tell the Utah Division of Consumer Protection in writing at least 30 days before (13-34a-207), with the plan below.
- Records go to: **(confirm)** a named custodian or successor organisation, who receives a final logical backup, the R2
  archives and uploads, and this document.
- Students are told where to ask for their records.

## Open questions for Mandy

- Whether NeuroDev must register with Utah's Division of Consumer Protection or is exempt for this program.
- Whether an accreditor would want attendance (time on task) beyond the progress log and video watching kept now.
- Anything a certificate must state beyond the name, course, date and school it carries now.
