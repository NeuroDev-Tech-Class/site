# neurodev-tech-class

Static site for the NeuroDev tech class, hosted on GitHub Pages from `main` and backed by Firebase (Auth, Firestore, Storage, Cloud Functions) in project `tech-certificates-af7c3`.

Planning docs:

- [docs/LMS-ROADMAP.md](docs/LMS-ROADMAP.md): goals, decisions, data model, admin redesign and phased roadmap for in-site checkpoints, tests and the content editor.
- [docs/CHECKPOINT-DELIVERABLES.md](docs/CHECKPOINT-DELIVERABLES.md): every checkpoint and the form fields it gets.

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
| `npm run test:e2e` | `tests/emulator/*.e2e.js`: the real `onUserWrite` inside the Functions, Auth and Firestore emulators | Java |
| `npm run emulators` | leaves the emulators running for manual poking | Java |

New features are test-first: write the failing test, watch it fail, implement, run `npm test`. Views take a `ctx` object (repos, store, `navigate`, `confirm`, `alert`, clock) so they run in jsdom without Firebase; see `tests/helpers/admin-ctx.js`.

Loading `functions/index.js` from a `/mnt/c` path takes about 16 seconds, longer than the Firebase CLI's 10 second discovery timeout. `test:e2e` already sets `FUNCTIONS_DISCOVERY_TIMEOUT=120`; set it yourself for any manual `firebase deploy --only functions` from WSL.

### Layout

```
assets/js/lib/      pure helpers: escape-html, html (escaping tagged template), format, claims-refresh
assets/js/data/     one repo per collection (users, test-results, mail); the only files that call Firestore
assets/js/ui/       shared markup fragments
assets/js/admin/    admin dashboard: main.js, router.js, store.js, views/
functions/          Cloud Functions; functions/shared/ is a generated copy of browser modules
tools/              sync-shared.mjs, backfill-claims.mjs
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
