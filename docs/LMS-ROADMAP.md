# NeuroDev Tech Class LMS Roadmap

Status: planning approved Sep 8 2026. **Phase 0 (Foundations) done Sep 10 2026. Phase 1 (Submissions and Grading Queue) done Sep 10 2026. Phase 2 (Notifications and Activity) done Sep 14 2026**; see the decisions log and the "as delivered" notes under section 9. Phases 3 to 8 are not started.
Companion document: [CHECKPOINT-DELIVERABLES.md](CHECKPOINT-DELIVERABLES.md) lists every checkpoint and the form fields it gets.

Vocabulary: Topher says "certificate" for what the code calls a course. This document says **certificate (course)** where it matters; identifiers in code stay `courseId`.

## Why

Today the coach grades from three disconnected places: Google Forms results land in an unauthenticated `testResults` collection, checkpoints arrive as emailed Word documents, and code arrives through GitHub Classroom, which is going away. The admin dashboard (`assets/js/admin.js`, 1222 lines in one module) has no search, no notifications and no live updates. Students can never see a score or download their own certificate. Course structure lives as inline JSON in 15 `courses/*.html` files with positional progress keys that break when an item is reordered, and the 155 lesson pages are static HTML editable only through git.

We want one system: admins are notified when students finish things, progress is easy to read, checkpoints and tests are taken and graded inside the site, and admins can create and edit certificates (courses), units, lessons, checkpoints and tests without touching code.

## Decisions made (Sep 8 2026)

| Decision | Choice |
|---|---|
| Firebase plan | **Blaze**, already upgraded. Storage and Cloud Functions are available. |
| Editor scope | **Structure plus lesson text.** Courses, units, items, checkpoints, tests AND the 155 lesson pages become editable in-app and live in Firestore. |
| Test question types | **Auto + manual mix.** Multiple choice, true/false and multi-select are auto-graded; short-answer and code are graded by an admin; the score is provisional until then. |
| Notifications | **In-app only.** Live feed and badges. No new email. The existing approval and certificate emails stay. |
| Checkpoints | Replace Google Docs and Forms with in-site forms: a text area per question plus URL, file, image, code, checklist and mentor sign-off field types. |

### Decisions log

| Date | Decision | Choice |
|---|---|---|
| Sep 8 2026 | Google Forms results after the `testResults` write hole closed | **Not preserved.** Rules deny all client writes; no quizzes are taken until Phase 4 replaces the Forms. Existing rows stay readable and gradable by admins until Phase 1 migrates them. |
| Sep 8 2026 | Where rules, indexes, storage rules and functions deploy from | **GitHub Actions on push to `main`** (`.github/workflows/ci.yml`), authenticated with the `FIREBASE_SERVICE_ACCOUNT` secret. Manual `firebase deploy` only for first-time API enablement. |
| Sep 8 2026 | Rules tests | **Local and CI**, against the Firestore emulator (Java 21). |
| Sep 8 2026 | Branching for Phase 0 | All work on `ui`, one commit per step, PR to `main` at the end. |
| Sep 10 2026 | Role checks | **Custom claims** (`role`, `status`) synced by `onUserWrite`; rules read `request.auth.token`, never a `users` document. The client forces a token refresh when its document is ahead of its token. |
| Sep 10 2026 | Admin shell for Phase 1 | Sidebar with **Today** (landing), **Grading Queue [n]** and **Students** now; later phases append entries. Today has three tiles and one "Needs your attention" list. |
| Sep 10 2026 | Per-course results screen (`#/students/:uid/results/:courseId`) | **Retired.** Student detail gets a Submissions table whose rows open the Grade view, and each course card gets a "Show checklist" toggle. Old links redirect to the student. |
| Sep 10 2026 | Firebase client SDK | **Upgraded 10.8.0 to 12.18.0** as the first step of Phase 1, matching the `firebase` devDependency. |
| Sep 10 2026 | Queue data | **Live** `onSnapshot`, one listener held in the page store, `limit(200)`, disposed on sign-out. Course and student filters run client-side over that bounded list. |
| Sep 10 2026 | Feedback storage | Plain text in `feedback`, rendered escaped. `feedbackHtml` waits for the rich editor in Phase 7. |
| Sep 10 2026 | Grade screen actions | One primary button, **Mark graded** (**Update grade** on a graded submission). "Return for revision" and "Save draft" arrive with checkpoints in Phase 3. **Grade next (n left)** is a button shown after a save, not an automatic advance. |
| Sep 10 2026 | Today's third tile | **Certificates this month.** "Active this week" needs `lastActiveAt`, which does not exist until Phase 5. |
| Sep 10 2026 | Legacy rows with no `total` | Migrated with `totalMax: null` and `passed: null`; the score shows as points. The grade screen forces an "out of" value when an admin grades or re-grades such a row. |
| Sep 10 2026 | Migrated item ids | `legacyKey` is the `itemId` until Phase 5 remaps it; the document id `{uid}__{legacyKey}__1` never changes. |
| Sep 10 2026 | `testResults` after migration | **Deny-all** in rules. Dead data kept until Phase 8. Unmatched emails live in `legacyOrphans/{email}`. |
| Sep 11 2026 | Which events notify in Phase 2 | **All four that exist**: work graded, account approved and certificate awarded go to the student; new registration goes to every admin. Submission received is built and tested but dormant until Phase 3 creates submissions. |
| Sep 11 2026 | Counters document | **`unread` only.** The sidebar's Grading Queue badge keeps deriving its number from the live queue listener; no `pendingGrading` field until something needs it stored. |
| Sep 11 2026 | Bell UX | **Dropdown panel** in the site header on every page: newest ten, click marks read and follows the link, Mark all read. No separate notifications page. |
| Sep 11 2026 | Activity feed | **Filters included**: a type select and a student search, reflected in the query string, filtering client-side over the newest 100 exactly as the queue does. |

## Facts from the audit that shape the plan

- All 13 quizzes are Google Forms. Their question banks exist only inside Google Forms and must be re-authored (owner task; an import format is provided below).
- 36 checkpoint-style lesson pages: 7 fit plain text, 10 need a file upload, 5 an image upload, 4 a URL field, 8 a live mentor sign-off, 2 a code field. Many are a mix. See the companion document.
- 58 GitHub Classroom links (python-1: 21, python-2: 14, web-dev-2: 17, web-dev-3: 6). Their content is recoverable: `NeuroDev/tech-class-courses/` holds local clones with `lesson.md`, `exercise.py` and `tests/` for Python I (20/18/16) and Python II (14/15/14), and `README.md` plus starter files for Web Dev I, II and III.
- Lesson HTML uses a small fixed vocabulary: classes `tip warning activity card grid-2 img-row img-side img-small video-embed subtitle`, plus tables (106), `pre` (157), `code` (1041) and YouTube iframes (21). The largest file is 58 KB, under Firestore's 1 MB document limit.
- Security hole found in the audit: `testResults` had `allow write: if true`, and admin.js rendered those answers into innerHTML unescaped, a stored-XSS path into the admin session. **Closed Sep 8 2026** (Phase 0 step 1): client writes denied, every admin renderer escapes.
- Content bugs found: `identifying_computer_hardware.html` is a byte-for-byte copy of `navigating_the_bios_uefi.html`; lesson text uses two different submission emails; two Web Dev II instruction PDFs are referenced but missing; `web-dev-1.html` has six `https://url` placeholders and a visible `TODO:` line.

## 1. Goals

1. Admins see, in one place, everything that needs them: registrations to approve, submissions to grade, sign-offs to confirm. They are notified live when a student finishes something.
2. Student progress is readable at a glance and drillable to the item.
3. Checkpoints and tests are taken in the site, stored in Firestore and graded in the site. Google Forms, emailed Word documents and GitHub Classroom go away.
4. Admins create and edit certificates (courses): units, items, lesson text, checkpoints, tests and the certificate document itself, without code changes.
5. Students see their scores and feedback and can download their own certificates.

## 2. Guidelines going forward

- **Stay a static site.** Plain ES modules, no bundler, hosted on GitHub Pages. Cloud Functions are the only server code. Vendored libraries only (no runtime CDN except gstatic Firebase). Each vendored file carries name, version, license, source URL and hash.
- **Test-first.** Phase 0 adds the harness. Every later phase writes failing tests before code. Pure logic lives in `assets/js/lib/` with no Firebase or DOM imports so it is testable with `node --test`.
- **Escape by default.** All rendering goes through an `html` tagged template that escapes interpolations. `raw()` is opt-in and only for sanitized lesson HTML. No `window.*` globals for click handlers; use `data-action` delegation.
- **One grading spine.** Tests and checkpoints are both `submissions`. One queue, one grade view, one notification path.
- **Stable IDs, never positions.** Every unit, item, lesson, test and checkpoint has an ID that survives reordering. Migrated documents keep `legacyKey` forever.
- **Rules and indexes live in the repo** (`firestore.rules`, `storage.rules`, `firestore.indexes.json`, `functions/`) and deploy from CI. No console-only edits. Pasting rules by hand ends in Phase 0.
- **UX for a neurodivergent audience.** One primary action per screen. Status is a word, not only a colour. No modal stacking. Autosave with a visible "Saved" receipt. Errors persist until dismissed. Sidebar order never changes. 44 px targets, 16 px body text. Respect `prefers-reduced-motion`. Plain language.
- **Content is backed up to git.** A nightly `tools/export-backup.mjs` dumps all Firestore content to JSON in the repo. The 155 lesson files are never deleted, only turned into redirect stubs after migration is verified.
- **Ship in phases.** Each phase is independently deployable and useful. The grading queue, notifications and checkpoints land before the content editor.

## 3. Target data model

IDs: courses keep their slug (`python-1`). Units are `u_` plus 10 hex of sha1(course|unitIndex|title). Items are `i_` plus 10 hex of sha1(course|unitIndex|itemIndex|url-or-html). Lessons are `l_` plus 10 hex of sha1(path under assets/pdfs). Submissions are `${uid}__${itemId}__${attempt}`. Certificates are `${uid}__${courseId}`. Deterministic IDs make the migration re-runnable.

```
courses/{courseId}                 title, category, summaryHtml, objectives[], requirementsHtml,
                                   status draft|published, order, counts, certificateTemplateId,
                                   certificateName, version, updatedAt, updatedBy
courses/{courseId}/units/{unitId}  title, descriptionHtml, order (gaps of 100), legacyKey
courses/{courseId}/items/{itemId}  unitId, order, legacyKey, type lesson|video|slides|link|note|
                                   checkpoint|test|download, title, countsForProgress, required,
                                   status ok|broken|needsContent, plus one payload field
                                   (lessonId | videoUrl | slidesUrl | linkUrl | noteHtml |
                                    checkpointId | testId | filePath)
courses/{courseId}/published/current   denormalized unit and item tree minus lesson bodies;
                                   written only by the publishCourse function; students read this
lessons/{lessonId}                 courseId, title, subtitle, courseTag, format 'html-v1',
                                   html (sanitized), images[], status, legacyPath
tests/{testId}                     courseId, unitId, itemId, title, instructionsHtml,
                                   passThreshold, attemptsAllowed, showAnswersAfter, shuffle,
                                   questionCount, totalPoints, autoPoints, manualPoints
tests/{testId}/questions/{qId}     order, type mc|tf|multi|short|code, promptHtml,
                                   options[{id,text}] (no answer flags), points, language
tests/{testId}/answerKeys/{qId}    correct, explanation, rubricHtml   (students can never read)
checkpoints/{cpId}                 courseId, unitId, itemId, title, instructionsHtml,
                                   requiresMentorSignOff, fields[{id, type, label, helpText,
                                   required, ...opts}]
                                   field types: longText shortText url file image code
                                                checklist mentorSignOff
submissions/{uid__itemId__attempt} kind test|checkpoint, student, course and item denormalized,
                                   refId, status draft|submitted|auto_graded|needs_grading|
                                   graded|returned, answers{}, perItem{}, autoScore, manualScore,
                                   totalScore, totalMax, provisional, passed, feedback (plain
                                   text until Phase 7; then feedbackHtml),
                                   gradedBy, gradedAt, mentorSignOff{}, legacy
users/{uid}                        existing fields plus summary{overallPercent, coursesStarted,
                                   coursesCompleted, certCount, pendingSubmissions, lastActiveAt}
                                   (summary written only by a function)
users/{uid}/progress/{courseId}    items{ [itemId]: {done, at, via} }, doneCount, totalCount,
                                   courseVersion, startedAt, lastActivityAt
users/{uid}/inbox/{notifId}        type, title, body, link, actorName, read, createdAt (Phase 2)
users/{uid}/meta/counters          unread only, written by onInboxWrite; pendingGrading stays derived
                                   from the queue listener until something needs it stored
activity/{eventId}                 append-only audit feed, admin read (Phase 2): type, summary,
                                   actorUid, actorName, subjectUid, subjectName, courseId,
                                   courseName, link, createdAt
certificates/{uid__courseId}       studentUid, courseId, courseTitle, awardedAt, awardedBy,
                                   templateId, storagePath, revoked
certificateTemplates/{templateId}  name, storagePath, placeholders[{token, source}], active
settings/site                      passThresholdDefault, maxUploadBytes, allowedMimeTypes,
                                   retakePolicy, showScoresImmediately, contentEditorRole
mail/{id}                          unchanged (Trigger Email extension)
```

Storage layout: `submissions/{courseId}/{uid}/{submissionId}/{fieldId}__{name}`, `lesson-images/{lessonId}/`, `certificates/{uid__courseId}.docx`, `certificate-templates/{id}.docx`. Existing `assets/images/**/*.webp` stay repo-hosted. Only new images go to Storage.

Roles move to **custom auth claims** (`request.auth.token.role`, `request.auth.token.status`) so rules stop doing a billed `get()` on every evaluation.

Rules matrix:

- Students read published content and their own progress, inbox, submissions and certificates. They write their own progress and their own draft or returned submissions, never score fields.
- Admins read everything, grade, approve, and edit content when `settings.contentEditorRole` allows.
- Superadmin changes roles only through the `setUserRole` function.
- `answerKeys` denies read to everyone except functions.
- `testResults` is deny-all (since Phase 1).
- Storage: students write only under their own uid with size and MIME caps; admins read all.

Realtime listener budget for an open admin tab: inbox and counters (the header bell, on every page), the queue (page store), and activity only while its view is open. All are `limit()`-bounded and all are disposed on navigation or sign-out.

## 4. Cloud Functions (Node 22, `functions/`)

| Function | Trigger | Does |
|---|---|---|
| `onSubmissionWrite` | `submissions/*` write | **Deployed (Phase 1; fan-out Phase 2).** Moves `submitted` to `needs_grading` and derives totals on grade. Notifies the student of a grade and every admin of a new submission, logs activity. Later: auto-grades mc/tf/multi from `answerKeys`, sets the provisional flag, marks the progress item done. |
| `onUserWrite` | `users/*` write | **Deployed (Phase 0; fan-out Phase 2).** Syncs role and status into custom claims. On approval queues the approval `mail` document and notifies the student. Notifies every admin of a registration and the student of each new certificate, logs activity. Stamps `claimsUpdatedAt`. |
| `onInboxWrite` | `users/*/inbox/*` write | **Deployed (Phase 2).** Keeps `users/{uid}/meta/counters.unread` in step with the inbox by delta; writes nothing when the delta is zero. |
| `onProgressWrite` | `users/*/progress/*` write | Recomputes `users.summary`, debounced 60 seconds. |
| `publishCourse` | callable (admin) | Validates the course tree, writes `published/current`, bumps version. |
| `awardCertificate` | callable (admin) | Renders the DOCX server-side (port of `admin/certificate-docx.js`), stores it, creates the certificate document, queues the mail, notifies the student. |
| `setUserRole` | callable (superadmin) | The only path to role changes. |
| `cleanupOrphans` | scheduled weekly, optional | Deletes Storage objects with no owning document, trims old activity. |

Grading logic is one pure module, `assets/js/lib/grade.js`, copied to `functions/lib/grade.js` by `tools/sync-shared.mjs` with a CI drift check.

## 5. Admin redesign

Single `admin.html` shell with **hash routing**. GitHub Pages has no rewrites, and one shell means one auth check and one set of listeners. Per-view `import()` gives code splitting with no bundler.

Sidebar, always icon plus label, fixed order: **Today, Grading Queue [n], Students, Content, Certificates, Activity, Settings**. Today, Grading Queue and Students exist since Phase 1; the rest append as their phases land.

- **Today**: four stat tiles (awaiting grading, pending approvals, active this week, certificates this month) and one "Needs your attention" list merging approvals and the oldest submissions, one button each.
- **Grading Queue**: table of Student, Certificate, Item, Type, Waiting (days, as text), Auto score. Filters by course, type, student, needs-sign-off. Oldest first. A **Grade next** button opens the oldest and advances on save. Bulk "mark complete" for sign-off-only items.
- **Grade view**: two panes. Left: the student's answers with a score stepper, correct toggle and feedback box per item, inline previews for images and PDFs, download chips for other files. Right: prompt, answer key or rubric, previous attempt. Sticky footer: running total and **Save draft, Return for revision, Mark graded**.
- **Students**: search box (new), tabs Pending / Current / Old / Admins, columns from `users.summary`, inline Approve and Deny on pending rows.
- **Student detail**: tabs Progress (rings per certificate, expandable to the item checklist already prototyped in `renderCourseChecklist`), Submissions, Certificates (award, revoke, download), Notes.
- **Content**: certificate cards with status and counts. **Course builder**: unit accordions, drag reorder within and across units, "Add item" type picker, Draft/Published state, Publish button with inline validation errors (broken URLs, empty tests).
- **Lesson editor**: title, subtitle and tag fields, constrained rich editor, Preview rendered inside `document.css` so it matches the student view, image upload.
- **Test builder**: question list, type picker, per-type option editors, points, a visually separated red-bordered "Answer key: students never see this" panel, live totals, Import from markdown.
- **Checkpoint builder**: field list, drag reorder, type picker, help text, "Requires mentor sign-off" toggle, live student preview. Presets: `github-exercise` (repo URL, code, notes), `text-only`, `file-with-reflection`.
- **Certificates**: issued log, revoke, templates. The template editor uploads a `.docx`, auto-detects `[TOKENS]` in `word/document.xml`, maps each to a data source and previews with sample data.
- **Settings**: pass threshold, retakes, upload limits, who may edit content, email text, maintenance mode.

## 6. Student-facing changes

- `courses/*.html` stay at their URLs as short shells. New `assets/js/student/course-view.js` reads `published/current` plus the student's progress document (two reads) and renders items with status chips: not started, done, Submitted, Needs revision, Graded 18/20. Reuses the auth-gating shape from `link-generator.js`.
- `lesson.html?id=` renders sanitized lesson HTML under `document.css` behind `content-guard.js`. The 155 old files become redirect stubs.
- `checkpoint.html?item=`: one task per page. A draft is created on the first keystroke, autosaved every 5 seconds, uploads are resumable with a progress bar, a "Review your answers" step precedes submit, and a read-only receipt follows. A returned submission reopens with the coach's feedback pinned on top. Mentor sign-off fields show as "Your coach will confirm this in person".
- `test.html?item=`: all questions on one page, sticky "4 of 12 answered", no timer, autosave, submit confirmation naming the unanswered count, result screen with the auto score and a provisional banner when written answers are pending.
- `profile.js` gains Recent work, per-certificate results and a certificate Download button. The header gets a notification bell for every signed-in user.

## 7. Code architecture

```
assets/js/core/     firebase.js (adds Storage, Functions, onSnapshot, increment, writeBatch),
                    session.js (one onAuthStateChanged for everyone), guard.js
assets/js/lib/      escape-html, html (tagged template), sanitize-html, format (formatName,
                    fullName, formatDate deduped), ids, grade, progress, docx, legacy-keys
assets/js/ui/       modal, confirm, toast, table, tabs, drag-list, form-fields, file-upload,
                    rich-editor, progress-ring, empty-state, spinner, badge
assets/js/data/     one repo module per collection; only these touch Firestore; take db as arg
assets/js/admin/    main, router, store (disposables registry), nav, views/*
assets/js/student/  course-view, lesson-view, checkpoint-form, test-runner, results, profile
functions/          index.js, lib/grade.js, lib/docx.js, lib/notify.js
tools/              extract-courses, extract-lessons, import-classroom, import, import-test,
                    migrate-progress, migrate-test-results, export-backup, sync-shared
tests/              node --test suites, helpers/fake-firestore.js, helpers/dom.js
```

Reuse: `lib/format.js` (formatName, fullName, isAdmin, formatDate; `utils.js` re-exports it), `content-guard.js` `requireApproval`, `dashboard.css` stat cards, progress rings and modal styles, `document.css`, the DOCX generator and date-phrase helpers in `admin/certificate-docx.js`, the checklist renderer in `admin/views/test-results.js`, the progress maths in `admin/progress.js`, and the `auth.js` globals `openAuthModal` and `showPendingMessage`.

Rich editor (recommended): vendor **TinyMCE 6.8 (MIT)** for the admin-only lesson editor. It supports tables, code samples, custom block formats for `div.tip`, `div.warning`, `div.activity` and `div.card`, an image upload hook, and a `valid_elements` allowlist that mirrors `sanitize-html.js`. The sanitizer still runs on save and on render. Alternative if size matters: Toast UI Editor (markdown-based). Do not build a general contenteditable editor from scratch.

Test harness: root `package.json` with `"test": "node --test tests/"`, devDependencies `jsdom` and `@firebase/rules-unit-testing`, run from WSL. Tiers: pure lib (sanitizer against the real 58 KB `building_a_pc.html`, grade for every type, legacy-key remap, markdown test parser, docx against the real template), DOM components in jsdom with an XSS regression, data repos against the fake Firestore, and the rules matrix against the emulator. CI runs all four plus a dead-link sweep and the grade.js drift check.

## 8. Migration

1. `extract-courses.mjs`: parse the 15 `unit-data` blocks and `course-metadata.js`, emit `courses.json` with deterministic IDs and `legacyKey` on every node. Classify items: Forms URL to `test` stub (`needsAuthoring`); Slides to `slides`; Classroom to `checkpoint` from the `github-exercise` preset; lesson path with a checkpoint-like filename to `checkpoint` with the lesson body as instructions and fields per the companion document; other lesson path to `lesson`; `video` to `video`; `html` to `note` (tagged `exercise` when it matches `Exercise N.N`); `https://url` to `link` with `status: broken`.
2. `extract-lessons.mjs`: for each of the 155 files take `main` minus back-link, doc-header and doc-footer, run it through the same `sanitize-html.js` the browser uses, and emit a strip-diff report.
3. `import-classroom.mjs`: for each repo in `tech-class-courses/`, convert `lesson.md` (or `README.md`) to HTML as the checkpoint's `instructionsHtml`, use `exercise.py` or the starter files as the code field's template, and keep `tests/` as a rubric hint for the grader. Covers all 58 Classroom items.
4. `import.mjs [--dry-run] [--course=]`: batched idempotent writes, then `publishCourse` per course.
5. `migrate-progress.mjs [--dry-run] [--purge]`: map each `courses[courseId]["u-i"]` key to an itemId via `legacyKey`, write `users/{uid}/progress/{courseId}`, emit an unmapped-key report. `users.courses` is kept until Phase 8.
6. `migrate-test-results.mjs`: `testResults/{email}` rows become `submissions` with `legacy: true`. Email is matched to uid; unmatched rows are kept in `legacyOrphans/`. Then `testResults` rules flip to deny-all and the Apps Script is disconnected.
7. Re-author the 13 Google Forms as native tests (owner task) via the Test Builder or the markdown import format:

```markdown
# Unit 1 Test
course: python-1
pass: 70
attempts: 2

1. [mc] (1pt) What does `len()` return?
   - The number of items in a sequence *
   - The last item
   > `len()` counts the items in a sequence.

2. [multi] (2pt) Which are valid variable names?
   - my_var *
   - _total *
   - 2fast

3. [tf] (1pt) Python is a compiled language.
   answer: false

4. [short] (3pt) In your own words, what is a variable?
   rubric: 3 = storage + value can change; 2 = one of the two; 1 = attempts.

5. [code] (5pt) python -- Ask for a name and greet the user.
   rubric: input() used; print() used; sensible variable name.
```

   Export each Form's responses CSV first. It preserves the question text and halves the retyping.

8. Retire in order: `link-generator.js` and `course-metadata.js` (Phase 5), `form.html` and the Apps Script (Phase 4), lesson HTML bodies become redirect stubs (Phase 7), `users.courses`, `users.certificates` and `testResults` (Phase 8).

## 9. Phased roadmap

Sizes for one developer: S under a week, M one to two weeks, L two to four, XL four to six.

| # | Phase | Size | Needs | Delivers |
|---|---|---|---|---|
| 0 | Foundations | M | Blaze (done) | **Done Sep 10 2026.** Budget alert. Storage and Functions initialised and deployed from the repo. **`testResults` write hole closed and answers escaped on render (hotfix, first PR).** Custom claims and rules rewrite. Test harness, fake Firestore, rules emulator suite, CI. `lib/` and `ui/` primitives. `admin.js` split into `admin/` with the router and the three current views ported one to one: no visible change, no `window.*` globals, no unescaped innerHTML. |
| 1 | Submissions and Grading Queue | L | 0 | **Done Sep 10 2026.** `submissions`, indexes, `onSubmissionWrite`. Sidebar, Today, Queue and Grade views. Student "Recent work". `migrate-test-results` so the queue opens with history. **First shippable win.** |
| 2 | Notifications and Activity | S/M | 1 | **Done Sep 14 2026.** Inbox, unread counter, activity feed with type and student filters, header bell on every page. The sidebar badge stays derived from the queue listener. |
| 3 | Checkpoints | L | 1, 2 | `checkpoints`, Storage uploads and rules, `checkpoint.html`, grade view field types, all 36 pages and 58 Classroom items converted via `import-classroom`. Ends emailed Word documents. |
| 4 | Tests | L | 1 | `tests`, `questions`, `answerKeys`, auto-grading, `test.html`, provisional scoring, markdown import. Retires `form.html` and the Apps Script. Owner re-authors the 13 Forms. |
| 5 | Course model in Firestore | L | 0 (uses types from 3 and 4) | `courses` tree, `publishCourse`, `onProgressWrite` and `users.summary`, extract, import and progress migration, `course-view.js` replaces `link-generator.js`. Riskiest step: dry run, report, fallback kept. |
| 6 | Content editor | XL | 5 | Course builder, test builder, checkpoint builder, draft/publish validation. The owner can author everything except lesson prose. |
| 7 | Lesson CMS | L | 5, 6 | Vendored editor, `extract-lessons` migration with strip-diff, image upload, `lesson.html`, 155 redirect stubs. |
| 8 | Certificates, settings, cleanup | M | all | Template editor, server-side `awardCertificate`, student download, Settings view, `cleanupOrphans`, drop legacy fields, delete `testResults`. |

Phases 3 and 4 can run in parallel. Phases 0 to 2 are worth shipping even if nothing else happens.

### Phase 0 as delivered (Sep 10 2026)

- `firestore.rules`, `firestore.indexes.json`, `storage.rules` and `functions/` live in the repo and deploy from CI on push to `main`. Pasting rules into the console is over.
- `onUserWrite` (`functions/lib/user-write.js`) mirrors `role` and `status` into custom claims, queues the approval email and stamps `claimsUpdatedAt`. The claims backfill (`tools/backfill-claims.mjs`) ran once against production.
- Rules read only the token. A catch-all denies anything without a rule. `testResults` is admin read and update only.
- Harness: `tests/` with the fake Firestore, jsdom helpers, the rules matrix against the emulator, function tests and one end-to-end run of the real function. `npm test` is 139 tests; CI runs it plus `test:e2e`.
- `assets/js/lib/` (escape-html, html, format, claims-refresh), `assets/js/data/` (users, test-results, mail), `assets/js/ui/table-row.js`.
- `assets/js/admin.js` is gone. `assets/js/admin/` holds `main.js`, `router.js` (hash routes `#/students`, `#/students/:uid`, `#/students/:uid/results/:courseId`), `store.js`, `progress.js`, `certificate-docx.js`, `course-structure.js`, `icons.js` and `views/`. No `window.*` handlers; every interpolation goes through `html`.
- Not done in Phase 0, carried to Phase 1: Firebase client SDK upgrade from 10.8.0 (needed for `onSnapshot` and Storage imports), `link-generator.js` whole-map overwrite of `courses`.

### Phase 1 as delivered (Sep 10 2026)

Shipped as two merges from one branch. Merge A (steps 1 to 4) was additive: SDK upgrade, `submissions` rules and indexes, the function, the migration tool; then the migration ran against production. Merge B (steps 5 to 8) shipped the UI, retired the old grading screen and flipped `testResults` to deny-all.

- Firebase client SDK 12.18.0; `firebase-config.js` exports `onSnapshot` and `limit`. The fake Firestore supports `orderBy`, `limit` and `onSnapshot` (microtask delivery, `listenerCount()` for dispose checks).
- `assets/js/lib/grade.js` (`PASS_THRESHOLD` 70, `deriveTotals`, `sameDerived`, `percent`; synced into `functions/shared`), `lib/submissions.js` (ids, `parseLegacyKey`, `statusLabel`, `scoreLabel`, `isUngraded`), `lib/legacy-results.js` (pure migration planner), `data/submissions.js` (`subscribeQueue`, `listForStudent`, `get`, `grade`).
- Rules: `submissions` admin read, student read of own rows, admin update restricted to the grading keys with `gradedBy == uid` and `gradedAt == request.time`; `legacyOrphans` admin read; `testResults` deny-all. Indexes `(status, submittedAt asc)` and `(studentUid, submittedAt desc)`.
- `onSubmissionWrite` (`functions/lib/submission-write.js`): `submitted` becomes `needs_grading`; a graded write gets `totalScore`, `passed` and `provisional` derived once, with no timestamp, so the second invocation is a no-op.
- `tools/migrate-test-results.mjs`: `testResults/{email}` rows become `submissions/{uid}__{legacyKey}__1` with `legacy: true`; `create()` so reruns never clobber a grade; orphans to `legacyOrphans`.
- Admin shell: `admin/nav.js` sidebar (Today, Grading Queue with live badge, Students), `views/today.js`, `views/queue.js` (course and student filters in the query string, Grade next), `views/grade.js` (answers escaped, score, optional out-of, feedback, Saved receipt with Grade next (n left)). `store.js` holds the live queue listener. Routes `#/today` (default), `#/queue`, `#/grade/:id`; `#/students/:uid/results/:courseId` redirects to the student.
- Student detail: Submissions table (newest first, rows open the grade screen) and a Show checklist toggle per course (`admin/checklist.js`). `views/test-results.js` and `data/test-results.js` deleted.
- Student profile: "Recent Work" section (`assets/js/student/recent-work.js`: ten newest, status word, score, feedback).
- `npm test` is 234 tests; `test:e2e` covers `onUserWrite` and `onSubmissionWrite`.
- Not in this phase: nothing lets a student create a submission (checkpoints in Phase 3, tests in Phase 4); notifications and counters (Phase 2); `link-generator.js` whole-map overwrite of `courses` (Phase 5).

### Phase 2 as delivered (Sep 14 2026)

Two merges from one branch again. Merge A (steps 1 to 4): harness, the shared text module, rules, the client repos and every function change; the inbox started filling from real events while nothing displayed it. Merge B (steps 5 to 7): the header bell and the Activity view.

- `assets/js/lib/notifications.js` (synced into `functions/shared` along with `lib/submissions.js`): `NOTIFICATION_TYPES`, `TYPE_LABELS`, and one notification builder plus one activity builder per event, each returning its own deterministic id. Every field falls back to readable text ("A student's work") because Firestore rejects `undefined`. `lib/format.js` gained `timeAgo`.
- Rules: `users/{uid}/inbox` owner read, owner update of `read` only (must be a bool), no create or delete from any client; `users/{uid}/meta` owner read only; `activity` admin read only. Admins cannot read another user's inbox; the audit trail is `activity`.
- `data/notifications.js` (`subscribeInbox`, `subscribeUnreadCount` floored at zero, `markRead`, `markAllRead` as one single-key update per id) and `data/activity.js` (`subscribeFeed`, newest 100).
- Functions: `functions/lib/notify.js` (`adminRecipients`, `actorFrom`, `deliver`, `deliverAll`, `logActivity`; every write is `create()` under a deterministic id with `ALREADY_EXISTS` swallowed) and `functions/lib/inbox-write.js` (`onInboxWrite`: unread delta via `FieldValue.increment`, no write on a zero delta). `onSubmissionWrite` fans out after the derived-totals early return, so its own re-trigger notifies nobody, and `legacy` rows notify nobody. `onUserWrite` fans out registration, approval and each new certificate. The graded id is keyed on the stored `gradedAt`: a retry is swallowed, a genuine re-grade notifies again.
- Actor capture: `users.approve(uid, approvedBy)` and `awardedBy` on the certificate object, so the feed reads "Topher approved Jane Doe" rather than "someone did".
- Header bell (`assets/js/ui/notification-bell.js`, mounted by `auth.js` for every signed-in user, pending included): count pill from the counters document, dropdown with the newest ten, click marks read then follows the link, Mark all read. Styles live in `auth.css` because it is the one stylesheet loaded on every page.
- Activity view (`admin/views/activity.js`, `#/activity`): owns its listener, type and student filters in the query string, distinct empty states for "nothing yet" and "nothing matches", an error state instead of loading forever. Sidebar order is Today, Grading Queue, Students, Activity.
- `npm test` is 331 tests; `test:e2e` runs its files one at a time (`--test-concurrency=1`) because two files against one functions emulator dropped events once the fan-out added work per trigger.
- Not in this phase: the `submission_received` fan-out has no producer until Phase 3; inbox and activity retention (Phase 8); email for any of this (in-app only, decided Sep 8).

## 10. Open decisions

Defaults let work start. Confirm or change each one.

| # | Question | Default |
|---|---|---|
| 1 | Pass threshold: one global value or per test? | Global 70% (matches today's `>= 70` in admin.js), per-test override under Advanced. |
| 2 | Retakes: how many attempts, and does the highest or the latest count? | 2 attempts, highest counts. |
| 3 | Do students see auto-graded scores immediately? | Yes, with a provisional banner. |
| 4 | Upload limits per file and per student? | 25 MB per file, 500 MB per student. Office formats, images, PDF, audio, `.blend`, `.xcf`, zip. |
| 5 | Mentor sign-off: any admin or an assigned coach? | Any admin. An assigned coach needs a `coachUid` field and an "assigned to me" filter. |
| 6 | Who edits content: admin or superadmin only? | Admin. This is rules-level; cheap now, painful later. |
| 7 | Inline "Exercise N.N" items in the media and game courses (about 40): stay self-checked boxes or become graded checkpoints with an image upload? | Stay checkboxes, tagged so they can be promoted later. |
| 8 | Certificate eligibility: manual award as today, or gated on 100% of required items and all tests passed? | Manual, with an "eligible" hint in the student view. |
| 9 | Is `web-dev-1` live? It has six placeholder links and no quizzes. | Import as draft, hidden from the catalog until authored. |
| 10 | Retention of file submissions after a student moves to Old? | Indefinite, with a manual purge action. |

## 11. Risks and guardrails

- **Live write hole and stored XSS in `testResults`**: closed in Phase 0 (Sep 8 2026); deny-all since Phase 1. `tests/rules/test-results.test.js` and the jsdom XSS tests in the grade, queue and recent-work suites keep it closed.
- **Progress remap errors**: `legacyKey` on every item, dry-run report, `users.courses` preserved until Phase 8, idempotent re-run.
- **Lesson content loss**: the repo remains the source of truth until Phase 7 is verified. Strip-diff report, nightly export to git, files become stubs and are never deleted.
- **Stored XSS from lesson HTML**: sanitize on save and on render from one allowlist module, fixture tests, CSP meta on lesson pages.
- **Blaze cost**: budget alert first, size caps in Storage rules, every listener bounded, `summary` keeps the dashboard at one read per student.
- **Listener leaks in a long-lived shell**: store disposables drained on every route change.
- **Document size limits**: the published snapshot excludes lesson bodies and asserts under 400 KB; the largest progress map is about 28 KB.
- **Scope creep**: the CMS is Phases 6 and 7 on purpose. Phases 0 to 4 ship first.
- **Claims propagation**: a role or approval change takes effect on token refresh (up to an hour). `setUserRole` and approval force a refresh where possible and the UI tolerates one stale session.
