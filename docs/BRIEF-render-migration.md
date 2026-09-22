# Brief: migrate the Tech Class site from GitHub Pages + Firebase to Render + Postgres

**For:** a Claude Code session opened in `NeuroDev/tech-class-website` (this folder; it was called `site` until 2026-09-17, and the GitHub repo is still named `site` on purpose, see "URL root" below) (with read access to the sibling folders `../neurodev-hub` and `../IDEA-Assessment`).
**Owner:** Topher. **Written:** 2026-09-17. **Umbrella plan:** `../PROJECT.md`.
**Layout decided 2026-09-22:** the tech site's **frontend** is its own Astro static site in this repo at `tech.neurodevlabs.com` (Render static sites are free). Its **backend is not a separate service**: it is a module inside `../neurodev-hub/backend/app/tech/`, served by the existing `hub-backend` at `https://hub-api.neurodevlabs.com/api/v1/tech/...`. This is the same split the scheduler used (`app/schedule/`), except the scheduler's pages also live in the hub and the tech site's pages do not. No new Render web service, no `tech-api` subdomain, no `tech_app` database role.

So this brief drives work in **two repos**: backend PRs in `../neurodev-hub`, frontend PRs here. The scheduler migration (`../NeuroDev-Time-Off-Calendar/BRIEF-scheduler-migration.md`) is done and is the worked example to copy.

## Goal

Same site, same features, same content, new platform: **Astro** frontend (React islands for the interactive parts), **FastAPI** routes added to `hub-backend` (`tech` schema in the shared NeuroDev database, managed by the hub's Alembic), deployed on Render as one free static site at `tech.neurodevlabs.com` talking to `https://hub-api.neurodevlabs.com`. Firebase project `tech-certificates-af7c3` is retired at the end.

This is a **port, not a redesign**. LMS roadmap phases 3-8 (`docs/LMS-ROADMAP.md`) are paused and get built afterwards on the new stack. Do not start them here. The roadmap's "stay a static site on Firebase" guideline is superseded; every other guideline in it (test-first, escape by default, one grading spine, stable IDs, UX rules for a neurodivergent audience) still applies.

## Read first

1. `README.md`, `docs/LMS-ROADMAP.md` (especially sections 2 and 3 and the decisions log), `docs/CHECKPOINT-DELIVERABLES.md`.
2. `firestore.rules`, `storage.rules`, `functions/index.js`, `functions/lib/notify.js` — the server-side behaviour to reproduce.
3. `assets/js/data/*` (one repo per collection: the only files that call Firestore), `assets/js/lib/*` (pure logic), `assets/js/admin/*`, `assets/js/student/*`, `assets/js/ui/*`, `auth.js`, `profile.js`.
4. `tests/` — especially `tests/rules/` (the permission matrix) and `tests/functions/`.
5. `../neurodev-hub/` — where the backend goes. Read `backend/app/schedule/` (a complete module: models, service, router, tests), `backend/app/database.py` and `backend/alembic/env.py` (schema list), `backend/app/routers/auth.py`, `backend/app/dependencies/auth.py`, and `backend/tests/conftest.py`.

## Hard rules

- Test-first; all checks green before each commit. Port existing tests before porting the code they cover.
- The database is shared with the live, paid IDEA Inventory. Backend work happens in the hub repo: add `TECH_SCHEMA = "tech"` to `app/database.py`, add it to `OWNED_SCHEMAS` in `alembic/env.py`, and create the tables in a new numbered hub migration. Never touch `public` (IDEA). Touch `core` only in Stage A, and never change `hub` or `schedule` tables.
- The current site must keep working until cutover. In this repo, work on a branch `render-migration`; the new Astro site lives in `web/`; do not move or delete existing files. The 155 lesson files are never deleted. In the hub repo, work on a branch `tech` off `main`; every hub PR must keep the hub and scheduler green (their tests run in the same CI).
- Escape by default. Lesson HTML is the only raw HTML, and it is sanitised on import against the fixed vocabulary listed in the roadmap.
- No deploys, no DNS, no Firebase deletions, no sending email to real users. Topher does cutover.
- Ask rather than guess; record answers under "Decisions" at the bottom of this file.

## Stage A — accounts for non-staff (done in `../neurodev-hub`, separate PR there)

The hub's auth currently admits only `@neurodevmentoring.com` Google accounts. Students need to sign in to the tech site with the same central accounts.

1. Migration in the hub repo: `core.accounts.kind` (`staff` | `student`), `password_hash` (nullable), `email_verified_at`; `core.email_tokens` for verification and reset codes. Port the email+password, verification-code, and reset flows from `../IDEA-Assessment/backend/app/routers/auth.py` and `services/passwords.py` / `tokens.py` / `email.py` (Resend). Keep IDEA's lockout and rate limits.
2. Sign-in is per app: `GET /api/v1/auth/google/start?app=tech` allows any verified Google account and creates `kind=student`; `app=hub` (default) keeps the staff-domain rule. A `student` account can never open hub routes: add that check to `get_current_account` consumers in the hub and test it.
3. Set `COOKIE_DOMAIN=.neurodevlabs.com` so the refresh cookie is shared by `hub.` and `tech.`; redirect targets after login come from an allowlist of app base URLs, never from a free-form parameter.
4. Tech routes use the hub's own `get_current_account` dependency (same process, same tokens), plus a `get_tech_user` dependency that loads `tech.users` for that account. Tech-specific role and status (`student`/`admin`/`superadmin`, `pending`/`approved`) live in `tech.users`, keyed by `account_id`. A hub admin is not automatically a tech admin; `tech.users.role` decides.
5. Cookie and CORS: the refresh cookie is set by `hub-api.neurodevlabs.com`, and `tech.neurodevlabs.com` is same-site with it, so it already flows; `COOKIE_DOMAIN` can stay empty. Add `https://tech.neurodevlabs.com` to `CORS_ORIGINS` and to the post-login redirect allowlist (env var, not code).

## Stage B — backend (`../neurodev-hub/backend/app/tech/`)

Translate the **current** Firestore model (what exists today after LMS phase 2), not the roadmap's future model:

```
tech.users            account_id PK/FK core.accounts, role, status, profile fields, legacy_uid (Firebase uid)
tech.progress         account_id, course_id, item_key (positional legacy key, kept as-is), done, at
tech.submissions      id (keep `{uid}__{legacyKey}__{attempt}` as legacy_id), kind, status, scores, feedback,
                      graded_by, graded_at, legacy bool, payload jsonb
tech.inbox            id, account_id, type, title, body, link, actor_name, read, created_at
tech.counters         account_id, unread
tech.activity         append-only feed
tech.certificates     account_id, course_id, awarded_at, awarded_by, storage_path, revoked
tech.legacy_orphans   email, payload jsonb
tech.mail_log         what was sent (replaces the `mail` collection + Trigger Email extension; send via Resend)
```

- Layout mirrors `app/schedule/`: `app/tech/models.py` (or `app/models/tech.py`, whichever the scheduler used), `app/tech/service.py`, `app/tech/notify.py`, `app/routers/tech.py` mounted at `/api/v1/tech`, tests in `backend/tests/tech/`. Register the router in `app/main.py`.
- Cloud Functions become service-layer code in the same transaction as the write: `onUserWrite` (claims sync) disappears because roles are read from `tech.users` per request; `onSubmissionWrite` and `onInboxWrite` become `services/notify.py` (port `assets/js/lib/notifications.js` sentence builders and their tests exactly, including deterministic ids).
- `firestore.rules` becomes FastAPI dependencies. Port the whole `tests/rules/` matrix to pytest as API-level permission tests: students read/write only their own progress, inbox, draft submissions, never score fields; admins read all and grade; role changes are superadmin-only; nothing is world-writable.
- Live `onSnapshot` listeners (grading queue, bell) become polling every 20-30s or SSE. Pick polling unless it is clearly inadequate; note it in Decisions.
- File storage: certificates and any uploaded files move off Firebase Storage. Default: a Render persistent disk is **not** acceptable on a starter plan with zero-downtime deploys, so use an S3-compatible bucket behind a small `storage.py` interface with a local-filesystem implementation for dev and tests. Confirm the bucket provider with Topher before wiring a real one.

## Stage C — frontend (`web/`, Astro)

- Course catalog, course pages, the 155 lesson pages, resources, slides: static Astro pages generated from the existing `courses/*.html` inline JSON and `assets/pdfs/**/*.html` lesson files. Write the extractor as a script with tests; do not hand-copy content. Keep existing URLs working (same paths, or redirects listed in one file).
- Profile, progress checkboxes, notification bell, admin dashboard (Today, Grading Queue, Students, Activity): React islands. Reuse the existing pure modules in `assets/js/lib/` by converting them to TypeScript with their tests, not by rewriting them.
- Brand tokens and button/field classes from `../neurodev-hub/frontend/tailwind.config.ts` and `src/index.css`. Keep the dark/light theme toggle.
- Fix as you go, and list in the PR: the duplicated `identifying_computer_hardware.html`, the two different submission emails, the six `https://url` placeholders and visible `TODO:` in `web-dev-1`, the two missing Web Dev II PDFs (flag, do not invent).

### URL root: no `/site/` prefix (required)

Today the site lives at `neurodev-tech-class.github.io/site/` and that prefix is hardcoded everywhere: `<base href="/site/">` and `/site/assets/js/...` script tags in every course page, `admin.html`, `catalog.html`, the lesson pages, and the `basePath` logic in `assets/js/load-header.js`. The new site serves from the **root of `tech.neurodevlabs.com`**.

- Astro `base` is `/`. Nothing in `web/` may contain the string `/site/`. Add a test that scans the build output and fails if it appears.
- The content extractor rewrites internal links and asset paths while importing (strip the leading `/site`), with tests covering `<base>`, absolute `/site/...` links, and relative links that depended on the `<base>` tag.
- Do not touch the `/site/` paths in the existing static files: the live GitHub Pages site needs them until cutover.
- Redirects, listed in one file: `tech.neurodevlabs.com/site/*` -> `/*` (301, Render redirect rule in `render.yaml`), and a GitHub Pages stub for the old host that forwards `/site/<path>` to `https://tech.neurodevlabs.com/<path>`.
- The GitHub repo rename (`site` -> `tech-class-website`) is a cutover step for Topher, after DNS points at Render, because renaming the repo kills the Pages URL immediately. Put it in `docs/CUTOVER.md`. Do not rename anything on GitHub.

## Stage D — data migration (hub repo: `backend/scripts/` and `scripts/`)

- `scripts/export_firebase_tech.mjs` (firebase-admin; Topher runs it with `~/keys/github-deploy.json`; model it on `scripts/export_firestore_schedule.mjs`): users (`auth:export` JSON + `users` docs), progress, submissions, inbox, activity, certificates, legacyOrphans, and a manifest of Storage objects. Output goes to a gitignored folder. Never commit exported data.
- `backend/scripts/import_firebase_tech.py` (model: `import_firestore_schedule.py`) plus a `scripts/import_tech_to_render.sh` wrapper like `import_to_render.sh`: idempotent, `--dry-run`, prints `create` / `skip` / `conflict` per row, second dry run shows only `skip` (same contract as `tools/migrate-test-results.mjs`). Accounts are matched to `core.accounts` by lowercased email, created as `kind=student` when absent, `legacy_uid` stored.
- Passwords: do not import Firebase scrypt hashes. Google users just sign in. Password users get a "set your password" email at cutover (template in the PR; sending is Topher's step).

## Stage E — delivery

- This repo's `render.yaml`: one static service `tech-frontend` (`rootDir: web`, `staticPublishPath: dist`, SPA/404 rules as Astro needs, the `/site/*` -> `/*` redirect, env `PUBLIC_API_URL=https://hub-api.neurodevlabs.com`). No web service, no database, no new Postgres role: the hub's `hub_app` role owns the `tech` schema because the hub's Alembic creates it.
- Hub repo: no `render.yaml` change except documenting the two new env values (`CORS_ORIGINS` gains the tech origin; the redirect allowlist gains `https://tech.neurodevlabs.com`).
- CI: replace the Firebase emulator jobs with backend (Postgres service) and frontend jobs, but only on the `render-migration` branch path until cutover so `main` keeps deploying rules and functions.
- `docs/CUTOVER.md`: freeze window, export, dry run, import, smoke tests, DNS (`tech` CNAME to the Render static host, added to `../IDEA-Assessment/project-notes/03-dns-records.md`), GitHub Pages redirect stub, repo rename, 30 days of Firebase read-only, then Blaze downgrade. Steps Topher performs are marked as his. Model it on `../neurodev-hub/docs/scheduler-cutover.md`.

## Suggested PR sequence

Hub repo: 1. Stage A (student accounts). 2. `app/tech` schema, models, permission tests. 3. Notifications/grading services and routes. 7. Export/import scripts + dry run against a real export.
This repo: 4. Content extractor + static Astro pages (can start in parallel with 2). 5. Islands: auth, profile, progress (needs 3 deployed or run locally against the hub's docker-compose). 6. Islands: admin. 8. `render.yaml`, CI, CUTOVER.md.

Local dev: run the hub's `docker compose up` (backend on 8001) and point the Astro dev server's `PUBLIC_API_URL` at it; add `http://localhost:4321` to the hub's local `CORS_ORIGINS`.

Each PR is independently reviewable and leaves `main` working.

## Decisions

(append here)
