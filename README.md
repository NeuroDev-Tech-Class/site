# neurodev-tech-class

The NeuroDev Tech Class site, live at **tech.neurodevmentoring.com**: an Astro site with React islands (`web/`), served
by Render as the static site `tech-frontend`. Its backend is the hub (`neurodev-hub`, routes under `/api/v1/tech/*`,
the `tech` schema in the hub's Postgres, files in Cloudflare R2).

The repo was called `site` until 2026-10-02. The old GitHub Pages + Firebase site was switched off at cutover
(October 2026) and its code is in git history before the `remove-old-site` branch; its addresses
(`neurodev-tech-class.github.io/site/...`) ended with the rename.

Docs:

- [docs/MIGRATION-PLAN.md](docs/MIGRATION-PLAN.md): how the site was rebuilt, phase by phase, with every decision.
- [docs/CUTOVER.md](docs/CUTOVER.md): the move from the old site, and the 30-day steps still to come.
- [docs/RENDER-SETUP.md](docs/RENDER-SETUP.md): the Render service and the domain.
- [docs/RECORDS-POLICY.md](docs/RECORDS-POLICY.md): what student records are kept, backups, record requests.
- [docs/CHECKPOINT-DELIVERABLES.md](docs/CHECKPOINT-DELIVERABLES.md): every checkpoint and the fields it asks for.

## Layout

```
web/                    the site: Astro + React islands + Tailwind
  src/pages/            Home, Catalog, Resources, courses/[id], learn/[itemId] (one per reading, video, slides,
                        link, checkpoint and test), my-courses, admin (the coaches' dashboard), the six sign-in pages, 404
  src/lib/              content.ts (reads content/, sanitises, item pages, counts), api.ts (hub client), session.ts,
                        remote.ts + courseProgress.ts (shared progress reads), videoTracking.ts (YouTube heartbeats),
                        checkpoint.ts (what the form still needs), upload.ts (browser upload to R2 with progress),
                        adminApi.ts (the coach's hub calls), adminRoute.ts (the dashboard's #/ addresses),
                        useLoad.ts (load, reload, refresh every 30 s while visible), usePopover.ts (header dropdowns),
                        itemLabel.ts, redirect.ts, format.ts, icons.ts
  src/components/       header, footer, ThemeToggle, UserMenu, NotificationBell, Icon, course/ (progress panel,
                        units, ring), admin/ (AdminApp shell and one view each: Today, Queue, Grade, Students,
                        Student, StudentCourse, Tests, Activity, Storage, Certificates),
                        learn/ (item page; Checkpoint, CheckpointForm, FileField, AnswerList for checkpoints;
                        TestTaker for tests; SlideDeck for slides), test/ (Question, Review: shared by the test page
                        and the Grade view), progress/ (My Courses, Home card, catalog ring), auth/ (sign-in forms)
  scripts/              sync-assets.mjs (assets/images into public/), zip-starters.mjs (each exercise's starter/ to
                        public/starters/<checkpoint id>.zip), both run before dev and build; gate.mjs (the checks)
  tests/                build.test.ts checks every built page; scripts.test.ts the scripts
content/                the course content, edited by hand (see "Changing content"): catalog.json, courses/<id>.json,
                        lessons/<id>.html, lessons.json, checkpoints/<id>.json, vocabulary.json, legacy-map.json
assets/images/          every picture the site shows, slides' pictures under slides/<deck>/
exercises/              the 58 hands-on exercises, one folder each: exercise.json, lesson.md, assignment.md
                        (Web Dev III), starter/ (what students download, tests and a test workflow included)
tools/exercises/        verify.mjs (runs every exercise's tests), workflows/ (the test workflows starters carry)
```

## Changing content

`content/` is the source: the pages are built from it and the hub's content import copies it into Postgres, where the
lessons, checkpoints and slides are served from. After any change, deploy the site (merge to `main`) **and** run the
hub's content import against production (hub README, "Tech course content"); `--dry-run` first shows what changes.

- A course is `content/courses/<id>.json`: units, each with items (`lesson`, `video`, `slides`, `link`, `note`,
  `checkpoint`, `test`). A lesson's page is `content/lessons/<lesson id>.html`, listed in `lessons.json`; a
  checkpoint's form is `content/checkpoints/<id>.json`; a slide deck's slides are in its item's `payload.slides`.
- HTML is cleaned on import against `vocabulary.json` (the hub keeps its own copy and refuses an import if they differ).
- A new item needs an id nobody has used (`i_` and 10 lowercase hex characters, likewise `u_`, `l_`, `c_`) and a
  `legacy_key` no other item in its course has. Old items' keys are their positions on the old site (`unit-item`);
  give new ones `new-1`, `new-2`, and so on. Never change an existing id: progress and handed-in work point at it.
- Removing an item from `content/` retires it in the hub; students' progress and work on it are kept.
- Tests (questions and answer keys) are not in this repo, which is public: coaches upload each test's markdown on the
  dashboard's Tests page (format in the hub README, "Tech tests").

## Development

The site runs in Docker only (`docker-compose.yml`; `node_modules` lives in a volume). Run these from the repo root,
with the hub running for sign-in (`neurodev-hub`: `docker compose up`; API on 8001, Mailpit on 8026):

| Command | Does |
|---|---|
| `docker compose up web` | dev server at http://localhost:4321 |
| `docker compose run --rm web npm run gate` | the whole gate in about a minute: lint, `astro check` and the unit tests run alongside the build, then the built pages are checked; only a failing step's output is shown |
| `docker compose run --rm web sh -c "npm run lint && npm run typecheck && npm test"` | ESLint, `astro check`, unit and component tests |
| `docker compose run --rm web sh -c "npm run build && npm run test:build"` | builds `dist/` and checks the built pages |
| `docker compose run --rm -p 4321:4321 web sh -c "npm run build && npx astro preview --ignore-lock --host"` | serves the production build |

`--ignore-lock` is needed because a stopped preview leaves Astro's lock file in `web/.astro/`. `web/dist`,
`web/public/images` and `web/public/starters` are generated, so compose keeps them in Docker volumes (look at the build
inside the container, not in Explorer). The image copy and starter zips only rewrite what changed.

The exercise checks run in WSL from the repo root:

| Command | Does |
|---|---|
| `npm test` | checks every exercise's files and the checker itself (fast) |
| `npm run test:exercises` | runs every exercise's own tests in Python 3.12 / Node 22 containers; needs Docker. Add `-- python-1/2.3-loops` for one |

`exercises/` is edited by hand; a changed starter reaches students as a new zip on the next deploy.

A checkpoint page shows the instructions, the starter download and the student's work (autosaved form, Review, Hand
it in; the receipt; or the form again with the coach's feedback on top). Files go from the browser straight to R2 with
a link the hub signs. A test page saves answers as they go and shows the result question by question. Certificates are
made on a student's course page in the dashboard; the hub draws the PDF and keeps it in R2. Item pages hold only the
public outline; what an item contains is fetched from the hub after sign-in, so nothing behind the login is in the
static site.

The dashboard is one page, `/admin`, with the view in the hash (`#/today`, `#/queue`, `#/grade/{id}`,
`#/students?tab=`, `#/students/{id}`, `#/students/{id}/courses/{course}`, `#/tests`, `#/tests/{item}`, `#/activity`,
`#/storage`), which is what the hub's notification links point at. It refreshes every 30 seconds while the tab is
visible; Storage and the Admins tab are for the superadmin.

## Branches, checks and releases

Same flow as the hub. Work happens on a branch, goes to `main` through a pull request, and Render deploys `main` by
itself.

- **Checks** (`.github/workflows/ci.yml`) run on every pull request into `main` and every push to it: **Web CI** (lint,
  types, tests, build and the built-page checks) and **Exercises CI** (`npm test` and every exercise's tests). GitHub
  can't make them required on this plan, so merging on red is possible; the rule is not to.
- **Versions** (`auto-tag.yml`): merging a pull request into `main` creates the next `vMAJOR.MINOR.PATCH` tag and a
  GitHub Release with generated notes. Put a `major`, `minor` or `patch` label on the pull request to say which part
  moves; no label means patch.
- **Manual tags** (`release.yml`): pushing a `v*` tag by hand also produces a Release, with a changelog of the commits
  since the previous tag.
