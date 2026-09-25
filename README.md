# neurodev-tech-class

Static site for the NeuroDev tech class, hosted on GitHub Pages from `main` and backed by Firebase (Auth, Firestore, Storage, Cloud Functions) in project `tech-certificates-af7c3`.

Planning docs:

- [docs/LMS-ROADMAP.md](docs/LMS-ROADMAP.md): goals, decisions, data model, admin redesign and phased roadmap for in-site checkpoints, tests and the content editor.
- [docs/CHECKPOINT-DELIVERABLES.md](docs/CHECKPOINT-DELIVERABLES.md): every checkpoint and the form fields it gets.
- [docs/MIGRATION-PLAN.md](docs/MIGRATION-PLAN.md): the move to Render + Postgres, with its phase tracker. See "Render migration" below.

## Development

Work in WSL. The site itself has no build step: open `index.html` through any static server and the ES modules load as they are.

### One-time setup

```
sudo apt install -y openjdk-21-jre-headless   # Firestore emulator
nvm use                                       # picks Node 22 from .nvmrc
npm ci
npm ci --prefix functions
firebase login:use neurodevtechcoach@gmail.com   # run inside this folder; pins the account for this project only
```

### Tests

| Command | Runs | Needs |
|---|---|---|
| `npm test` | everything except the end-to-end run, inside the Firestore emulator | Java |
| `npm run test:unit` | pure modules, data repos against the fake Firestore, jsdom view tests, function handlers | nothing |
| `npm run test:rules` | the security-rules matrix in `tests/rules/` | Java |
| `npm run test:e2e` | `tests/emulator/*.e2e.js`: the real `onUserWrite`, `onSubmissionWrite` and `onInboxWrite` inside the Functions, Auth and Firestore emulators, one file at a time | Java |
| `npm run emulators` | leaves the emulators running for manual poking | Java |

New features are test-first: write the failing test, watch it fail, implement, run `npm test`. Views take a `ctx` object (repos, store, `navigate`, `confirm`, `alert`, clock) so they run in jsdom without Firebase; see `tests/helpers/admin-ctx.js`.

Loading `functions/index.js` from a `/mnt/c` path takes about 16 seconds, longer than the Firebase CLI's 10 second discovery timeout. `test:e2e` already sets `FUNCTIONS_DISCOVERY_TIMEOUT=120`; set it yourself for any manual `firebase deploy --only functions` from WSL.

### Layout

```
assets/js/lib/      pure helpers: escape-html, html (escaping tagged template), format, claims-refresh,
                    grade (pass threshold, derived totals), submissions (ids, labels), legacy-results,
                    notifications (every notification and activity sentence, with deterministic ids)
assets/js/data/     one repo per collection (users, submissions, mail, notifications, activity); the only files that call Firestore
assets/js/ui/       shared markup fragments; notification-bell.js is the header bell, mounted by auth.js
assets/js/admin/    admin dashboard: main.js, router.js, store.js, nav.js, checklist.js, views/
assets/js/student/  profile pieces: recent-work.js
functions/          Cloud Functions (onUserWrite, onSubmissionWrite, onInboxWrite); lib/notify.js is the fan-out;
                    functions/shared/ is a generated copy of browser modules (format, grade, submissions, notifications, mail)
tools/              sync-shared.mjs, backfill-claims.mjs, migrate-test-results.mjs
tests/              node --test suites; helpers/fake-firestore.js, helpers/dom.js, helpers/rules-env.js
firestore.rules  firestore.indexes.json  storage.rules  firebase.json
```

`functions/shared/` is written by `npm run sync-shared` from `assets/js`. Edit the originals; CI and the functions predeploy fail if the copies drift.

### Deploys

Rules, indexes, storage rules and functions deploy from GitHub Actions on every push to `main` (`.github/workflows/ci.yml`, job `deploy`, after the tests pass). Nothing is edited in the Firebase console by hand.

The site's pages deploy through GitHub Pages from `main` at the same time.

Manual deploy from WSL, only for first-time API enablement or an emergency:

```
FUNCTIONS_DISCOVERY_TIMEOUT=120 firebase deploy --only functions --project tech-certificates-af7c3
firebase deploy --only firestore,storage --project tech-certificates-af7c3
```

The first functions deploy on a project can fail with "Permission denied while using the Eventarc Service Agent". Wait two minutes and rerun.

### Secrets

The workflow authenticates with the `FIREBASE_SERVICE_ACCOUNT` repository secret: the JSON key of the `github-deploy` service account. No key file is committed; `.gitignore` excludes `service-account*.json` and `*.key.json`. A local copy for the tools below lives outside the repo at `~/keys/github-deploy.json`.

To create or rotate it:

1. Google Cloud console > IAM & Admin > Service Accounts > Create, name `github-deploy`, project `tech-certificates-af7c3`.
2. Grant roles **Firebase Admin**, **Cloud Functions Admin** and **Service Account User**.
3. Keys > Add key > JSON. Save it as `~/keys/github-deploy.json`.
4. Inside this repo: `gh secret set FIREBASE_SERVICE_ACCOUNT < ~/keys/github-deploy.json`.
5. Delete any older key from the service account's Keys tab.

### Custom claims

Firestore rules trust `request.auth.token.role` and `request.auth.token.status`, which `onUserWrite` mirrors from each `users/{uid}` document. Tokens refresh within an hour; the client forces an early refresh when it sees its own document is ahead of its token.

If claims ever need rebuilding for every user:

```
GOOGLE_APPLICATION_CREDENTIALS=~/keys/github-deploy.json node tools/backfill-claims.mjs --project tech-certificates-af7c3 --dry-run
GOOGLE_APPLICATION_CREDENTIALS=~/keys/github-deploy.json node tools/backfill-claims.mjs --project tech-certificates-af7c3
```

The dry run prints one row per user and exits non-zero if any user lacks `role` or `status`. Never publish claims-based rules to a project whose users have no claims yet: run the backfill first.

### Legacy test results

Google Forms scores used to land in `testResults/{email}`. The Phase 1 migration copied every row into `submissions/{uid}__{legacyKey}__1` (`legacy: true`) and the rules now deny `testResults` to every client. The collection is dead data, kept until Phase 8 deletes it. Rows whose email matched no user are listed in `legacyOrphans/{email}` (admin read only).

The migration is idempotent; rerun it if a new orphan is resolved:

```
GOOGLE_APPLICATION_CREDENTIALS=~/keys/github-deploy.json node tools/migrate-test-results.mjs --project tech-certificates-af7c3 --dry-run
GOOGLE_APPLICATION_CREDENTIALS=~/keys/github-deploy.json node tools/migrate-test-results.mjs --project tech-certificates-af7c3
```

Each row prints as `create`, `skip` (already migrated), `orphan` or `conflict`. A second dry run after the real run must show only `skip`. Existing submissions are never overwritten, so grades entered after the migration survive a rerun. `--strict` exits non-zero when orphans exist.

## Render migration

On the `render-migration` branch the site is being rebuilt on Render + Postgres ([docs/MIGRATION-PLAN.md](docs/MIGRATION-PLAN.md) has the phase tracker). Nothing below is served by the live site, and none of it changes the live site's files.

```
exercises/              the 58 former GitHub Classroom exercises, one folder each:
                        exercise.json, lesson.md, assignment.md (Web Dev III), starter/ (what students download,
                        tests and a GitHub Actions test workflow included)
tools/extract/          reads the live site (courses/, assets/pdfs/) and exercises/, writes content/
  checkpoints.json      which lesson pages and notes become checkpoints, and their form fields
  overrides/            fixes that exist only in the extracted copy: lessons/<page path> replaces a page's body,
                        courses.json patches a course page
tools/exercises/        import-repos.mjs (the one-time Classroom import), verify.mjs, workflows/ (the test workflows)
content/                generated, committed: catalog, courses, lessons, checkpoints, legacy-map, vocabulary, report.md
web/                    the new site: Astro + React islands + Tailwind, served at tech.neurodevmentoring.com
  src/pages/            Home, Catalog, Resources, courses/[id], the six sign-in pages, 404
  src/lib/              content.ts (reads content/, sanitises), api.ts (hub client), session.ts, redirect.ts, format.ts
  src/components/       header, footer, ThemeToggle, UserMenu, CourseStart, auth/ (the sign-in forms)
  tests/build.test.ts   checks every page in dist/ (one h1, skip link, nav, no /site/, images exist, catalog links)
```

The web site runs in Docker only (`docker-compose.yml` at the repo root; `node_modules` lives in a volume). Run these from the repo root, with the hub running for sign-in (`neurodev-hub`: `docker compose up`; API on 8001, Mailpit on 8026):

| Command | Does |
|---|---|
| `docker compose up web` | dev server at http://localhost:4321 |
| `docker compose run --rm web sh -c "npm run lint && npm run typecheck && npm test"` | ESLint, `astro check`, unit and component tests |
| `docker compose run --rm web sh -c "npm run build && npm run test:build"` | builds `dist/` and checks the built pages |
| `docker compose run --rm -p 4321:4321 web sh -c "npm run build && npx astro preview --ignore-lock --host"` | serves the production build |

`--ignore-lock` is needed because a stopped preview leaves Astro's lock file in `web/.astro/`.

The extractor and exercise commands run in WSL:

| Command | Does |
|---|---|
| `npm run test:extract` | extractor and exercise tests (fast, no emulator) |
| `npm run extract` | regenerates `content/`; commit what changes |
| `npm run extract -- --check` | fails if `content/` is out of date (CI runs this) |
| `npm run test:exercises` | runs every exercise's tests in Python 3.12 / Node 22 containers; needs Docker. Add `-- python-1/2.3-loops` for one |

After changing anything the extractor reads (a course page, a lesson, `checkpoints.json`, an override or an exercise), run `npm run extract`, read `content/report.md`, and commit `content/` with the change. **Don't reorder items on the live course pages before cutover**: item ids and the old progress keys are taken from their positions.

`exercises/` is edited by hand; `import-repos.mjs` refuses to run over it. The `Migration` workflow (`.github/workflows/migration.yml`) runs these checks on the `render-migration` branch only; `main` keeps deploying the Firebase site through `ci.yml`.
