# Tech Class site: rewrite onto Render + Postgres, with the LMS upgrade folded in

## Context

The tech class site (`NeuroDev/site`, GitHub Pages + Firebase `tech-certificates-af7c3`) moves onto the NeuroDev stack: an **Astro** frontend (React islands) in this repo at `tech.neurodevmentoring.com`, and a **`app/tech` module inside `hub-backend`** (FastAPI, `tech` schema in the shared Postgres, the hub's Alembic). `docs/BRIEF-render-migration.md` is the starting spec, but Topher changed three things on 2026-09-23:

1. **It is not a straight port.** Because it is a fresh start, the LMS roadmap's target model and its next phases are built now instead of porting the Firebase shapes (positional progress keys, `users.courses` maps, the certificates array) and rebuilding them later.
2. **The tech site has its own auth**, separate from the hub, and access runs one way only (details below). The brief's Stage A (adding `kind` and passwords to `core.accounts`) is dropped. That is also safer: it leaves the hub's six-role, campus and approval system (shipped Sep 23) untouched.
3. **Five fixes from `NeuroDevNotes.md` are in scope**: a Complete button on every item, required video watching, progress indicators on the catalog, admins seeing their own progress, and the hands-on exercise rewrite.

The live Firebase site keeps running untouched until a single cutover window.

## Phase tracker

Work the phases in number order. Each phase ends with Topher's review, the manual checks listed under it, and a commit that ticks its box here. Phases 1 and 2 can run in parallel, and so can 3 and 4.

| # | Phase | Repo | Needs | Status |
|---|---|---|---|---|
| 1 | Tech accounts and sign-in (email/password, Google, hub staff access, account admin, email service) | hub | none | [x] 2026-09-24 |
| 2 | Content extractor + content fixes + hands-on rewrites (content JSON committed) | site | none | [x] 2026-09-24 |
| 3 | Astro site shell: theme, header/footer, public pages, sign-in pages | site | 1 | [x] 2026-09-24 |
| 4 | Content in the database + read API (catalog public, lessons behind login) | hub | 2 | [x] 2026-09-25 |
| 5 | Progress + video watch tracking | hub | 4 | [ ] |
| 6 | Student pages: course page, item pages with Mark complete, catalog progress, My Courses | site | 3, 5 | [ ] |
| 7 | Submissions, grading, notifications, activity feed | hub | 5 | [ ] |
| 8 | Checkpoints + file uploads (R2) | hub | 7 | [ ] |
| 9 | Checkpoint form | site | 6, 8 | [ ] |
| 10 | Admin dashboard (Today, Queue, Grade, Students, Activity, Accounts, bell) | site | 7, 9 | [ ] |
| 11 | Native tests (markdown import, runner, auto-grading) | hub + site | 10 | [ ] |
| 12 | Certificates (PDF, R2, email, student download) | hub + site | 10 | [ ] |
| 13 | Accreditation review (Topher talks to Mandy; model adjusted if needed) | Topher | before 14 | [ ] |
| 14 | Firebase export and import (dry runs, progress key mapping, coach account to admin) | hub | 1-12 | [ ] |
| 15 | Delivery and cutover (render.yaml, CI, redirects, CUTOVER.md) | site | 14 | [ ] |
| after | Course/test/checkpoint builders, lesson editor, Settings, cleanup | both | 15 | |

Each phase is detailed under "Work breakdown" below; phases are planned in full detail just before they start.

## Decisions (2026-09-23)

| Topic | Decision |
|---|---|
| Scope before cutover | Roadmap target model (stable IDs, content in Postgres, item-level progress) + **checkpoints** (36 pages + **all 58 GitHub Classroom exercises**) + **native tests** (replacing the 13 Google Forms, whose results have been going nowhere since Sep 8) + certificates + the 5 notes items. **After cutover:** course/test/checkpoint builders (roadmap phase 6), lesson CMS editor (phase 7), Settings view, cleanup. |
| Content | **Postgres is the source of truth, served by the API behind a real login check.** Home, catalog, resources and course overviews stay public; lessons, videos, slides, checkpoints and tests need an approved account (today a static file is readable by anyone with the URL). The extractor's JSON output is committed to this repo: it is the import input, the build-time catalog source, and the backup. |
| Tech auth | Own `tech.accounts` / `tech.sessions`, own refresh cookie, own token type. **Google + email/password** (IDEA's password, verification-code and reset flows ported). Tech tokens are rejected by every hub route and hub tokens by every tech route, tested both ways. |
| Hub staff access (one way) | Google sign-in on the tech site: if the email is an **active** hub account with role Super Admin → tech **superadmin**; Admin or Tech Coach → tech **admin**. Re-checked on every sign-in and refresh (read-only query of `core.accounts`; tech never writes to `core`). Losing the hub role removes the access. **Only tech superadmins add or remove tech-only admins** on the tech site. |
| File storage | **Cloudflare R2**, behind `app/tech/storage.py` with a local-filesystem implementation for dev and tests. Uploads and downloads use short-lived presigned URLs. |
| Media | **Videos are required**: the Complete button is disabled until every YouTube video on the item has been watched to about 90%, with a plain message saying why. The server enforces it too, not just the button. Admins see percent watched per student. Slides and links record "opened" only. |
| Completion | Readings, videos, slides: **Mark complete** checks the item and returns to the course page scrolled to its unit with the item ticked. Checkpoints and tests: **Submit**; the course page shows "Submitted". A checkpoint counts as done when graded **Complete**; **Returned** reopens it. A test counts as done when submitted. |
| Checkpoint grading | **Complete / Return**, no points. Tests keep points and the 70% pass. |
| Email | Resend from a new **`mail.neurodevmentoring.com`** sending domain (Topher adds the DNS records; add-only in that zone). Mailpit locally; never Resend in dev. |
| Hands-on exercises | All 5 rewritten in the student's voice **and** turned into checkpoints (fields per `CHECKPOINT-DELIVERABLES.md`). Claude drafts; Topher approves each one. |
| Certificates | **Server-generated PDF**, stored in R2, emailed, downloadable by the student from their profile. The design is recreated from `Certificate-Template.docx` for Topher's approval. |
| Accreditation | Not yet discussed with Mandy; **not a blocker**. The model keeps a timestamped record of every progress event, submission and grade, plus an append-only activity log with CSV export. **Checkpoint:** revisit after the Mandy conversation, before the production import. |
| Timeline | No deadline. Staged behind the scenes; one freeze window at cutover; Firebase read-only for 30 days after. |
| Live updates | **Polling** (brief's default): bell and queue badge every 30 s while the tab is visible, paused when hidden. No SSE. |
| Unread count | `SELECT count(*)` on a partial index `(account_id) WHERE NOT read` rather than a delta-maintained counters table. It is one query and cannot drift, so `tech.counters` from the brief is dropped. |

### Defaults carried from the roadmap's open decisions (change any of them at review)

1. Pass threshold 70%, global, with a per-test override. 2. Two test attempts, highest counts. 3. Auto-graded scores shown immediately with a "provisional" banner while written answers wait. 4. Uploads: 25 MB per file, 500 MB per student; Office formats, images, PDF, audio, `.blend`, `.xcf`, zip. 5. Mentor sign-off: any tech admin. 6. The ~40 inline "Exercise N.N" items in the media and game courses stay self-checked boxes, tagged so they can be promoted to checkpoints later. 7. Certificate award stays manual, with an "eligible" hint when every required item is done. 8. `web-dev-1` is imported as a draft and hidden from the catalog until authored (six `https://url` placeholders, visible `TODO:`). 9. Uploaded files are kept indefinitely, with a manual purge action. 10. Staff (tech admins) are left out of student lists and stats but have their own My Courses progress like anyone else.

## Architecture

```
tech.neurodevmentoring.com (Astro static, this repo web/)      hub-api.neurodevmentoring.com (hub-backend)
  public: /, /catalog, /resources, /courses/:id (overview)       /api/v1/tech/auth/*     own sessions + cookie nd_tech_refresh
  islands: auth, course status, item pages, checkpoint,          /api/v1/tech/*          content, progress, submissions, admin
           test runner, profile, bell, admin (hash routes)        app/tech/storage.py  -> Cloudflare R2 (presigned)
                                                                  app/email.py         -> Resend / Mailpit
                                                                  Postgres schema tech  (reads core.accounts only for staff mapping)
```

### `tech` schema (hub migrations from 0012; 0013 was a drift fix, so later numbers are assigned when written)

```
accounts          id uuid, email unique (lowercased), password_hash null, google_sub null, first/last name,
                  role student|admin|superadmin, status pending|approved|declined|deactivated,
                  student_type current|old, staff_source null|hub (derived admin), email_verified_at,
                  approved_by/at, legacy_uid (Firebase), created_at, last_login_at
sessions          refresh_token_hash, account_id, expires_at, revoked_at, user_agent, ip
email_codes       account_id, purpose verify|reset|set_password, code_hash, expires_at, attempts, used_at
courses           id slug, title, category, summary_html, objectives, status draft|published, sort, version
units             id u_<hash>, course_id, title, description_html, sort, legacy_key
items             id i_<hash>, course_id, unit_id, sort, type lesson|video|slides|link|note|checkpoint|test|download,
                  title, counts_for_progress, required, status ok|broken|needs_content, legacy_key,
                  payload: lesson_id | video_url | slides_url | link_url | note_html | checkpoint_id | test_id
lessons           id l_<hash>, course_id, title, subtitle, course_tag, html (sanitised), legacy_path, media jsonb
checkpoints       id, item_id, instructions_html, requires_sign_off, fields jsonb [{id,type,label,help,required,opts}]
tests             id, item_id, instructions_html, pass_threshold, attempts_allowed, shuffle, totals
test_questions    id, test_id, sort, type mc|tf|multi|short|code, prompt_html, options jsonb (no answer flags), points
test_answer_keys  question_id, correct jsonb, explanation, rubric_html   (never serialised to a student)
submissions       id, legacy_id, account_id, item_id, kind, attempt, status draft|submitted|needs_grading|
                  graded|returned, answers jsonb, per_item jsonb, auto/manual/total score, total_max, passed,
                  provisional, feedback, sign_off jsonb, graded_by/at, submitted_at, legacy bool
submission_files  id, submission_id, field_id, storage_key, name, mime, bytes, uploaded_at
progress          account_id, item_id, status done|submitted|returned, done_at, via button|grade|admin|legacy
media_views       account_id, item_id, video_id, duration_s, max_position_s, watched_s, percent, updated_at
certificates      id, account_id, course_id, awarded_at, awarded_by, storage_key, revoked_at
inbox             id deterministic, account_id, type, title, body, link, actor_name, read, created_at
activity          id deterministic, type, summary, actor/subject ids+names, course, link, created_at
mail_log          id, to, template, subject, provider_id, status, created_at
legacy_orphans    email, payload jsonb
```

Deterministic IDs (the roadmap's sha1 scheme for units, items and lessons; `{account}__{item}__{attempt}` for submissions) keep the extractor, import and migration re-runnable. Notification and activity ids follow the LMS roadmap's Phase 2 table and are written with `ON CONFLICT DO NOTHING`.

## Work breakdown

Two repos. Hub work goes on the existing `tech-class` branch (currently equal to `main`). Site work goes on a new `render-migration` branch; the Astro app lives in `web/`, and nothing existing is moved or deleted. Every step is test-first (write tests, confirm red, build, run the full suite), ends with manual checks, and is committed by Topher. Sizes: S < 1 week, M 1-2, L 2-4.

### Milestone 1: foundations (auth end-to-end, content extracted)

**Phase 1. Hub: tech accounts and sign-in (L)**, branch `tech-class` in `neurodev-hub`

*As delivered (2026-09-24)*: built as planned in six steps; 408 hub tests green (101 of them tech). Differences from the plan below:
- Migration `0013_timestamps_not_null` was added between steps: a schema-drift fix for existing hub tables, plus `tests/test_schema_drift.py` so models and migrations can't drift again. `alembic/env.py` pins `search_path=public` (the local role is named `hub`, which made autogenerate misread the hub schema).
- The email sender lives at `app/services/email.py` (next to the hub's other services), not `app/email.py`.
- A superadmin adding a brand-new tech admin sends them a 7-day set-password invitation.
- Delete is allowed only for sign-ups that were never approved (Topher, 2026-09-24): spam and mistakes go, while anyone approved even once can only be deactivated, so their progress and submissions survive.
- Refused refreshes return their 401 as a response so the dead cookie is really cleared. The hub's own `/auth/refresh` had the same flaw (it cleared then raised, which dropped the clearing) and was fixed at the same time.

*Rules*
- Students: register (name, email, password), get a 6-digit code by email, verify, then `pending` (can sign in and see "waiting for approval"); an admin approves (approval email sent) and the account is `approved`. A Google sign-up skips the code and lands in `pending`. `declined` can sign in only to see that message. `deactivated` is refused everywhere at once.
- Hub staff: on every sign-in and every refresh, look up `core.accounts` by email, read-only. Active Super Admin gives tech `superadmin`; active Admin or Tech Coach gives tech `admin`; either way `approved`, `staff_source='hub'`. If they no longer qualify, the account is `deactivated` and sessions end; a tech superadmin can reactivate it as a student or tech admin. Superadmin comes **only** from the hub (Topher); `neurodevtechcoach@gmail.com` becomes an ordinary tech admin at import (Phase 14).
- Tech admins: only a superadmin adds one (by email) or removes one (back to student); nobody changes their own role; hub-derived roles can't be edited here (409 "Managed by the hub"); tech-managed roles top out at `admin`.
- Tokens: `type: "tech_access"`, 15 min. The hub's `decode_access_token` already rejects any non-`access` type, and the tech decoder rejects `access`. Cookie `nd_tech_refresh`, path `/api/v1/tech/auth`, HttpOnly, SameSite Lax, Secure except local. Google redirects go only to `TECH_APP_BASE_URL` plus a safe relative path.
- Ported from IDEA: bcrypt cost 12 with a dummy hash for uniform timing; keyed 6-digit codes (10 min, 5 attempts, 60 s resend cooldown); 10 failed logins give a 15-minute lockout; 30-minute single-use reset links; refresh reuse detection (60 s grace) and a 90-day absolute session life; responses that never reveal whether an account exists; IDEA's rate limits.

*Data* (migration `0012_tech_accounts`, schema `tech`): `accounts` (email, password_hash, google_sub, names, role, status, student_type, staff_source, email_verified_at, failed_login_count, locked_until, approved_by/at, legacy_uid, created_at, last_login_at), `sessions` (IDEA's `auth_sessions` shape), `email_codes` (IDEA's `email_tokens` shape), `mail_log`.

*Endpoints*: `/api/v1/tech/auth`: register, verify-email, resend-code, login, refresh, logout, change-password, forgot-password, reset-password, me, google/start, google/callback. `/api/v1/tech/accounts` (admin): list, badge, approve, decline, patch (student type, deactivate/reactivate), add/remove admins (superadmin only).

*Email*: `app/email.py`, selected by `EMAIL_BACKEND`: `none` (tests), `smtp` (Mailpit in docker-compose on host ports 1026/8026), or `resend` (production). Never Resend when `APP_ENV=local`. Sent as `NeuroDev Tech Class <notifications@mail.neurodevmentoring.com>`, Reply-To `neurodevtechcoach@gmail.com`.

*Hub bug fixed here*: no proxy-headers middleware, so behind Render every request shares one rate-limit bucket. Add uvicorn's `ProxyHeadersMiddleware` and port IDEA's `test_proxy_client_ip.py`.

*Steps* (each: tests first, confirm red, build, full suite green, Topher reviews and commits)
1. Schema and primitives: `TECH_SCHEMA`, migration 0012, models, conftest truncation and fixtures, passwords, tech tokens and OTP helpers, proxy fix. Tests prove a hub token fails the tech decoder and vice versa.
2. Email service + Mailpit (none/smtp/resend, local never uses Resend, failures in `mail_log`).
3. Password flows (IDEA's `test_auth_flows.py` ported: register/verify, lockout, sessions, reset/change).
4. Google + hub staff access + isolation (each hub role and status; losing the role deactivates; `core.accounts` never written; tech and hub bearers and cookies refused by the other side).
5. Account administration (the site's `tests/rules/users` matrix as API tests; approval email).
6. Docs: hub README, `.env.example`, `render.yaml` env; this tracker ticked; brief decisions; memory.

*Manual checks*
1. `docker compose up --build` in `neurodev-hub`; open `http://localhost:8001/docs` and Mailpit at `http://localhost:8026`.
2. `POST /api/v1/tech/auth/register` with a test email. The code arrives in Mailpit from "NeuroDev Tech Class", reply-to the coach gmail.
3. `verify-email` with the code, then `GET me` with the token shows `status: pending`.
4. Wrong password 10 times gives "Too many failed attempts"; `forgot-password` for an unknown email still says ok, with nothing in Mailpit.
5. Browser: `http://localhost:8001/api/v1/tech/auth/google/start` as `topher@neurodevmentoring.com`. It redirects to `localhost:4321` (a blank page until Phase 3). Then `me` shows `superadmin`, `staff_source: hub`.
6. As superadmin: approve the test student (the email lands in Mailpit), add a tech admin, and confirm a tech admin can't add another.
7. The hub still works: sign in at `http://localhost:5174` and open the schedule.

*Before merging to `main`* (Topher): set `EMAIL_BACKEND=resend`, `RESEND_API_KEY`, `TECH_APP_BASE_URL`, `TECH_GOOGLE_REDIRECT_URI` and the tech CORS origin on hub-backend in Render. The merge is additive: new routes that nothing calls yet.

**Phase 2. Site: content extractor (M, parallel with Phase 1)** in `tools/extract/` (Node, `node --test`, next to the existing harness)

*As delivered (2026-09-24)*: `npm run extract` writes `content/` (234 files) from the live site and `exercises/`; `npm run test:extract` is 78 tests; `npm run test:exercises` runs all 42 exercises with tests in Docker (all run cleanly). What Phase 4 imports, per `content/report.md`:
- 15 courses (web-dev-1 draft), 406 items: 119 lesson items over 120 extracted lesson pages (a few pages are shared or reached only from an intro or note, such as Building a PC; 2 are exercise readings), 94 checkpoints (38 from lesson pages and notes via `tools/extract/checkpoints.json`, 56 GitHub-repo exercises), 29 videos, 9 slides, 13 tests (`needs_content` until Phase 11), 129 notes (68 tagged `exercise`), 13 links. `legacy-map.json` maps every old progress key and old URL.
- **One allowlist:** Phase 4's nh3 sanitiser loads `content/vocabulary.json` (tags, attributes, classes, `language-` class prefix, YouTube-only iframes). Only finding left: three `style` colours on Blender's X/Y/Z labels (text still names the colour).
- **Exercises moved into this repo** (decided 2026-09-24): the 58 Classroom repos are now `exercises/<course>/<number-slug>/` (exercise.json, lesson.md, assignment.md, starter/ with tests and a GitHub Actions test workflow). Students download the starter, push to their own repo and submit its link; checkpoints carry `starter_path` (Phase 8 zips it) and a `grading_hint`. Clean-up: Classroom workflows and private-repo links removed; Web Dev II unit projects start from `quiz.js` with `prompt-sync`; every Web Dev III page loads its own CSS and JS; Web Dev III 1.2's Puppeteer tests dropped (too heavy for students and CI); GitHub Basics rewritten to teach the new hand-in; PEP-8 and Terminal Commands are readings (lessons).
- **Fixes live only in the extracted copy** (`tools/extract/overrides/`): 7 page bodies (5 hands-on exercises, Responsible AI Use, the new IT hardware exercise replacing the BIOS duplicate) and one course patch (Web Dev I's `TODO:`). Email-your-work sentences are swapped sentence by sentence for "Submit your work with the form below" and listed in the report; the Email Account exercise keeps the address because emailing the coach is the task.
- Differences from the plan above: lessons are stored flat (`content/lessons/<id>.html` + `lessons.json`) because some are shared between courses; 154 lesson files are reachable (one true orphan, the Python I PEP-8 HTML page, superseded by its repo); the extractor reports rather than strips markup; starters are not copied into `content/`; Web Dev II's broken course links needed no patch (they sit in the overview, which becomes plain-text summary); the two "missing" Web Dev II PDFs were the unit-project briefs, now the lessons of those exercises.
- Parse the 15 `unit-data` blocks + `course-metadata.js` into `content/courses/*.json` with deterministic IDs and `legacy_key`; classify items per roadmap section 8 step 1.
- Lessons: take `main` minus back-link, header and footer; rewrite links (strip `/site/`, resolve `<base>`-relative paths, map lesson-to-lesson links to new routes); sanitise against the fixed vocabulary; emit a strip-diff report; record each lesson's embedded YouTube ids in `media`.
- Checkpoints: the 36 pages per `CHECKPOINT-DELIVERABLES.md` plus `import-classroom` for the 58 repos in `../tech-class-courses/` (instructions from `lesson.md`/`README.md`, starter code, tests kept as a grading hint).
- Content fixes, listed in the PR: flag the duplicate `identifying_computer_hardware.html` (needs real content from Topher); replace both submission emails with "submit below" text, since checkpoints make them obsolete; `web-dev-1` as a draft; the two missing Web Dev II PDFs flagged, not invented; the `python1.html` / `web-dev-1` broken links fixed.
- Hands-on exercises: student-voice rewrites of all 5 as checkpoint drafts in `content/`; **Topher approves each one**.
- Output `content/legacy-map.json` (old path to new route) for redirects and the progress migration.
- Tests: a fixture per item type, the real 58 KB `building_a_pc.html` through the sanitiser, a `<script>`/`onerror` strip, link rewriting (`<base>`, absolute `/site/...`, relative), ID stability across reruns.

**Phase 3. Site: Astro scaffold + auth pages (M, needs Phase 1 locally)**
- `web/`: Astro + React 19 + TS 5.9 + Tailwind 4 (`@theme` tokens copied from the hub's `index.css`, plus a **dark theme** since the hub has none; defaults to dark, stored in `localStorage` like today's toggle, applied before paint). Vitest 5 + Testing Library + jsdom for islands (the hub has no component tests; this adds them). ESLint 10. A Docker dev service; npm never runs from WSL against `/mnt/c`.
- `src/lib/api.ts`: the hub's `client.ts` pattern (in-memory access token, refresh on 401, `credentials: 'include'`) pointed at `/api/v1/tech/auth/*`.
- Layout, header, footer, theme toggle; static Home, Catalog (from `content/`), Resources; auth island (sign in, register, verify code, forgot/reset, pending, declined).
- Pure modules from `assets/js/lib/` (escape-html, html, format, grade, submissions, notifications) converted to TypeScript **with their tests**.
- A build test that fails if `/site/` appears anywhere in `dist/`.

*As delivered (2026-09-24)*: `web/` is Astro 7.3 (static) + React 19.3 + Tailwind 4.3 + TS 5.9, run through the `web` service in `docker-compose.yml`; 105 unit/component tests and 59 checks on the built pages, all in the `Migration` CI job.
- **Look**: the old layout (big logo, Home / Course Catalog / Resources) in the hub's colours; dark by default with a "Switch to light theme" button; skip link, 44px targets, visible focus, reduced motion. `<ClientRouter />` keeps the session in memory between pages, so the hub is asked once per full page load.
- **Public pages** from `content/`: Home (copy approved by Topher: accounts instead of a password, Mark complete, tests and grading in the site), Catalog (six categories, a card per published course; `web-dev-1` hidden as a draft), Resources (Krita corrected to GIMP), a page per published course (overview, objectives, sanitised intro, units with a type label per item; a title prefix that repeats the label is dropped; notes shown in place), 404. Items are not links until Phase 6. `scripts/sync-assets.mjs` copies `assets/images` into `public/images` before dev and build.
- **Sign-in**: `lib/api.ts` (port of the hub client), `lib/session.ts`, the header account menu (Sign in / Register; signed in: name, email, status, My courses, Dashboard for tech admins, Sign out) and six pages: `/sign-in`, `/register`, `/verify`, `/forgot-password`, `/reset-password` (also the admin invite's "set your password"), `/waiting`. Google sign-in returns through `/waiting?next=`, which forwards approved accounts on. Remember me dropped.
- **Hub** (`tech-class`): tech auth limits sized for a classroom on one IP (login and verify 60/min, refresh 300/min, Google 60/min, register, resend, forgot, reset and change password 30/hour), with `tests/tech/test_rate_limits.py`.
- **Look revamp (2026-09-25, Topher chose "Night Arcade" from three mockups)**: deep navy page with a faint dot grid, a cyan-pink-gold line under the header, cyan buttons that glow in dark mode; dark stays the default and light is a daylight version. Every category has a colour and icon (`--cat-*`, `categoryKey()`), every item type too (`--type-*`), both tuned to 4.5:1 in each theme; shared utilities in `global.css` (`panel`, `card-glow`, `icon-tile`, `unit-pill`, `eyebrow`, `neon-rule`) and line icons in `components/Icon.astro`. Home gained an opening with Start with Digital Literacy and a three-step How it works row; catalog cards show three summary lines plus unit and item counts; Resources is cards. Later pages (lessons, checkpoint form, admin) use the same tokens and utilities, keeping long reading calm.
- **Changed from this plan**: only `format` was ported from `assets/js/lib/`. `grade`, `submissions` and `notifications` port with the phase that first uses them (7 and 10); `escape-html` and `html` are not needed, since React escapes text itself.

### Milestone 2: learning (read, progress, the 5 notes items)

**Phase 4. Hub: content tables + import + read API (M)**: migration `tech_content`; a `nh3` sanitiser with the same allowlist, run on import and on every save; `backend/scripts/import_tech_content.py` reads `content/*.json` (`--dry-run`, create/skip/update per row); `GET /tech/catalog` (public), `GET /tech/courses/{id}` (public overview; item links only for approved accounts), `GET /tech/items/{id}` (approved only; answer keys never included). Tests: an unapproved or anonymous request is refused on every content route; draft courses are hidden from students.
- *Planned in detail (2026-09-25, Topher)*: 1. migration `0014_tech_content`: `courses`, `units`, `items`, `lessons`, `checkpoints` (test tables wait for Phase 11; the 13 tests import as `needs_content` items), each row with `retired_at`. 2. `app/tech/sanitize.py` (nh3) from a hub copy of `vocabulary.json`; the import refuses to run if the site's copy differs. 3. `scripts/import_tech_content.py --content <dir> [--dry-run]`: create / update / skip / retire per row, a second run prints only skip. **Content reaches production by running this script from Topher's machine with the Render `DATABASE_URL`**; in dev `site/content` is mounted read-only into the backend container. **Rows that disappear from `content/` are retired, never deleted** (progress and submissions keep their item; re-adding un-retires it). **The 94 checkpoint definitions import now**; Phase 8 adds submitting. 4. Read API: `GET /tech/catalog` (public), `GET /tech/courses/{id}` (public overview, item details for approved accounts), `GET /tech/items/{id}` (approved only); **tech admins also see draft courses**, students never do. 5. Real import into `hub_dev`, docs, tracker.
- *As delivered (2026-09-25)*: migrations `0014_tech_content` and `0015_tech_content_real_shapes` (the first dry run of the real content showed 37 lessons without a subtitle, 2 lessons from `exercises/` without an old page, and `grading_hint` as `{runner, tests}` rather than text); `app/tech/sanitize.py` (nh3 0.3.7; all 358 real HTML pieces come through with identical text and the same images, code blocks, videos, links and tables); `scripts/import_tech_content.py` (create / update / skip / retire / restore; real import into `hub_dev`: 15 courses, 54 units, 120 lessons, 406 items, 94 checkpoints, and a second run skips every row); `app/routers/tech_content.py`. **Changed from the plan:** the course overview is the same for everyone (plus drafts for tech admins) and never carries an item's contents, not even for approved accounts; every item opens through `/items/{id}`, and Phase 5 supplies the per-student progress the course page needs. Tests are served as `needs_content` with no link to the old Google Form; checkpoints never send `grading_hint`, `exercise` or `starter_path` (only `has_starter`). Hub suite 465 tests. **Topher's task:** once `tech-class` is deployed, run the import against production (hub README, "Tech course content").

**Phase 5. Hub: progress + media tracking (M)**: migration `tech_progress`; `POST /tech/items/{id}/complete` **refuses (409, with a reason) while a required video is under 90% watched**; `POST /tech/media/heartbeat` (throttled, monotonic `max_position`, rejects implausible jumps); course and overall percentages; admin view of a student's progress including watch %. Everyone, admins included, has their own progress.

**Phase 6. Site: student islands (L)**
- Course page `/courses/:id`: units with status words (Not started / Done / Submitted / Needs revision / Complete), anchor per unit, scroll to `#unit-...` and a highlight on the just-finished item.
- Item pages `/learn/:itemId` for lesson, video, slides, link and note: content, then a sticky-bottom **Mark complete** that returns to the course page at that unit. Videos use the YouTube IFrame API for tracking; the button stays disabled with "Watch the video to finish (62% watched)".
- Legacy URLs: `/courses/<id>.html` and `/assets/pdfs/<path>.html` redirect to the new routes, generated from `legacy-map.json` into one redirects file used by `render.yaml` (verify Render's rewrite and wildcard syntax against current docs first).
- Catalog and Home: a progress ring with a word ("In progress · 40%", "Complete") next to courses the signed-in user has started; public visitors see the plain catalog.
- Profile / My Courses for **every role, admins included**: continue-where-you-left-off, per-course progress, recent work, certificates.

### Milestone 3: checkpoints, grading, notifications, admin

**Phase 7. Hub: submissions, grading, inbox, activity (L)**: migration `tech_submissions`; port `lib/notifications.js`, `lib/submissions.js` and `lib/grade.js` sentence builders and their tests to `app/tech/notify.py` and `grading.py` exactly (same wording, same deterministic ids); service-layer fan-out in the same transaction as the write (replacing `onSubmissionWrite`, `onUserWrite`, `onInboxWrite`); queue (oldest first, bounded, filters), grade (**Complete / Return** for checkpoints, points for tests), inbox list, unread count, mark read, mark all read, activity feed + CSV export. Port `tests/functions/*` and `tests/rules/{submissions,notifications}` as pytest.

**Phase 8. Hub: checkpoints + uploads (L)**: `storage.py` (R2 via S3 API + local fs; presigned PUT with size/MIME caps and a per-student quota; presigned GET); draft create and autosave, submit, resubmit after Return, mentor sign-off field (confirmed by an admin, "Your coach will confirm this in person"). A student can edit only their own draft or returned work, never score fields.

**Phase 9. Site: checkpoint form (M)**: one task per page, draft on first keystroke, autosave with a visible "Saved", upload progress bars, a "Review your answers" step, then a read-only receipt; returned work reopens with feedback pinned at the top.

**Phase 10. Site: admin islands (L)**: `/admin` hash-routed shell (Today, Grading Queue [n], Students, Activity, Accounts), porting the existing views and their jsdom tests to React + Testing Library. The Grade view gains field-type rendering (image preview, PDF inline, download chips, code in `<pre>`, checklist, sign-off). Students detail shows progress with watch % and submissions. Accounts: approve/decline, student type, superadmin-only tech admin management. Notification bell in the header for everyone.

### Milestone 4: tests and certificates

**Phase 11. Hub + site: native tests (L)**: questions, answer keys (never serialised to students; a test proves it), auto-grading mc/tf/multi, provisional totals, attempts; a markdown import (roadmap section 8 format) as a script and an admin upload; the `test.html`-equivalent runner (all questions on one page, "4 of 12 answered", no timer, autosave, submit confirmation naming unanswered questions, result screen). **Topher re-authors the 13 quizzes** (export each Form's responses CSV first to keep the question text).

**Phase 12. Certificates (M)**: a PDF from a template recreated from the `.docx` (pure-Python renderer that runs on Render's native Python runtime, chosen after checking current docs; no system libraries), stored in R2, emailed, a student download endpoint, revoke, and an "eligible" hint. **Topher approves the design.**

### Milestone 5: migration and cutover

- **Phase 13. Accreditation review (Topher)**: after the Mandy conversation, confirm or adjust the model.
- **Phase 14. Export/import (M)**: `scripts/export_firebase_tech.mjs` (users + `auth:export`, progress maps, submissions, inbox, activity, certificates array, legacyOrphans, `testResults` kept as dead data); `backend/scripts/import_firebase_tech.py` + `scripts/import_tech_to_render.sh`: idempotent, `--dry-run`, create/skip/conflict per row, a second dry run shows only skip; accounts matched by lowercased email with `legacy_uid` stored; **positional `u-i` keys mapped to item ids through `legacy_key`**, with an unmapped-key report; legacy certificates imported as records (files regenerated as PDFs on demand). No Firebase password hashes: password users get a "set your password" email at cutover (template in the PR; Topher sends).
- **Phase 15. Delivery (M)**: `render.yaml` static service `tech-frontend` (redirects, `/site/*` to `/*`, env `PUBLIC_API_URL`); CI jobs for `web/` scoped to the `render-migration` branch path until cutover; a GitHub Pages redirect stub; `docs/CUTOVER.md` modelled on `neurodev-hub/docs/scheduler-cutover.md` (freeze, export, dry run, import, smoke tests, DNS CNAME add-only in the `neurodevmentoring.com` zone recorded in `03-dns-records.md`, Pages stub, repo rename `site` to `tech-class-website`, Firebase read-only for 30 days, Blaze downgrade). It also lists: no reordering of items on the live course pages between Phase 2 and the import (item ids and old progress keys come from their positions), and archiving the 60 `NeuroDev-Tech-Class` exercise repos read-only after cutover (the local `tech-class-courses/` folder can then go).

### After cutover (next plan)

Course builder, test builder, checkpoint builder with draft/publish validation (roadmap phase 6); lesson editor with image upload (phase 7); Settings view; build-time catalog from the API plus a Render deploy hook on publish (replacing the committed `content/` snapshot as the catalog source); retention and cleanup; linking tech accounts to hub student profiles when `core.people` exists.

## Topher's tasks (outside code)

| When | Task |
|---|---|
| Before Phase 1 ships (**done 2026-09-23**) | Resend: add and verify `mail.neurodevmentoring.com` (DNS add-only). Google OAuth client: add the tech callback redirect URI (prod + localhost:8001). |
| Before Phase 8 | Create a Cloudflare account, an R2 bucket and an API token; put the keys in the hub's Render env. |
| During Phase 2 (**done 2026-09-24**) | Approved the exercise rewrites and the new hardware exercise; chose repo-link hand-in with downloadable starters; exercises moved into this repo. |
| During Phase 11 | Export the 13 Forms' response CSVs and re-author the quizzes. |
| During Phase 12 | Approve the certificate PDF design. |
| Before Phase 14 prod run | Talk to Mandy (accreditation); run the Firebase export with `~/keys/github-deploy.json`. |
| Cutover | Everything marked as his in `CUTOVER.md`. |

## Docs updated in the first commit

`docs/BRIEF-render-migration.md` "Decisions" (every row above; mark Stage A superseded); `docs/LMS-ROADMAP.md` status line (phases 3-4 move into the migration, 6-8 after); `../PROJECT.md` Decisions Log and Phase 4 checklist; memory `project_lms_roadmap.md`.

## Verification (every step, and the whole)

1. Hub: `docker compose exec backend pytest` against `hub_test` (never `hub_dev`), `ruff`, `mypy`. The hub and scheduler suites stay green in the same run.
2. Web: `lint`, `typecheck`, `vitest`, `astro build`, plus the `/site/` scan, run in the web container.
3. Site's existing `npm test` stays green (nothing existing changes).
4. Manual checks listed per step, run against the hub's `docker compose up` (backend 8001, Mailpit) with Astro dev on 4321.
5. Before cutover: a full dry-run import of a real export, a second dry run showing only skip, then a smoke test as a student (register, verify, approve, open a lesson, watch a video, mark complete, submit a checkpoint with an upload, take a test) and as a tech admin (grade, return, award a certificate, add a tech admin).
