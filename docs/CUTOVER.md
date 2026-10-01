# Tech class cutover: GitHub Pages + Firebase to Render + the hub

Moves students from the old site (`neurodev-tech-class.github.io/site/`, Firebase project `tech-certificates-af7c3`)
to `tech.neurodevmentoring.com`. Modelled on the hub's `docs/scheduler-cutover.md`. Every step is safe to repeat,
and nothing is deleted until the last section. Steps marked **(Topher)** need his logins.

## Before you start

Check each; do the ones not done yet.

1. **(Topher)** Hub: `tech-class` merged to `main` and `hub-backend` deployed green. It migrates itself on start
   (`alembic upgrade head`, up to `0023`). Rebuild the image if `requirements.txt` changed (fpdf2, pypdf).
2. **(Topher)** Hub: the content import run against production since the last `content/` change
   (hub README, "Tech course content"). Without it lessons and the 12 tests the old scores attach to are missing.
3. **(Topher)** Site: `render-migration` merged to `main`; `tech-frontend` on Render built green
   (`docs/RENDER-SETUP.md`), and the `tech` CNAME in place so `https://tech.neurodevmentoring.com` loads.
4. **(Topher)** R2: the production bucket's CORS allows `https://tech.neurodevmentoring.com` (hub README,
   "Tech uploads"); `hub-backend` has the four `R2_*` settings.
5. **(Topher)** Sign in at `https://tech.neurodevmentoring.com` with Google as `topher@neurodevmentoring.com`:
   you land as superadmin and `/admin` opens.

The 13 tests do not need to be uploaded first: each test page opens once its test is uploaded on the dashboard's
Tests page.

## 1. Final export (the freeze)

From here on, whatever students do on the old site is not carried over, so pick a quiet time and tell the class.
In WSL (Claude can run this; it only reads):

```
cd /mnt/c/Users/chris/Documents/Coding/NeuroDev/neurodev-hub/scripts
npm install
GOOGLE_APPLICATION_CREDENTIALS=~/keys/github-deploy.json node export_firebase_tech.mjs
```

Expected, like the 2026-10-01 export: `Wrote tech-export.json: 47 sign-ins, 39 users, 635 ticks, 7 certificates,
151 old scores, 3 activity lines, 0 orphans` (a few more if students kept working).

## 2. Import into production

**(Topher)** Copy five values from Render (hub-backend > Environment): `DATABASE_URL` and the four `R2_*`. In WSL:

```
cd /mnt/c/Users/chris/Documents/Coding/NeuroDev/neurodev-hub
RENDER_DATABASE_URL='...' R2_ACCOUNT_ID='...' R2_ACCESS_KEY_ID='...' R2_SECRET_ACCESS_KEY='...' \
  R2_BUCKET='tech-class-uploads' bash scripts/import_tech_to_render.sh
```

It dry-runs, shows the totals, asks, imports, then dry-runs again and fails if anything is left. On `hub_dev` the
2026-10-01 export gave: accounts 90 create (38 site accounts, 52 record-only quiz takers) and 1 update, progress 633,
certificates 7, activity 3, scores 151. On production expect "update" only for accounts already made on the new site.
The 8 "sign-in with no profile" conflicts are abandoned registrations and stay out. What each table means is in the
hub README, "Moving the tech class's data in".

## 3. Switch the old site to the redirect

1. **(Topher)** GitHub > `NeuroDev-Tech-Class/site` > Settings > Pages > Build and deployment > Source:
   **GitHub Actions**. (The old site stops being served from `main` at this moment.)
2. **(Topher)** Actions > **Pages redirect** > Run workflow (branch `main`).
3. Check: `https://neurodev-tech-class.github.io/site/courses/python-1.html` lands on
   `https://tech.neurodevmentoring.com/courses/python-1`, and an old lesson link lands on its `/learn/...` page.

Nothing on the old site can write to Firebase any more, so Firebase is effectively read-only from here.

## 4. Welcome email

**(Topher)** Render > hub-backend > Shell (it has the production email settings):

```
python -m scripts.send_tech_welcome --dry-run
python -m scripts.send_tech_welcome
```

Each imported student (approved or pending) with no password and no Google sign-in gets one "The NeuroDev Tech
Class has a new home" email with a 7-day set-your-password link. Rerunning sends only to anyone it failed for.
Record-only quiz takers are deactivated and get nothing. About 40 emails, inside Resend's daily allowance.

## 5. Smoke test

As a student (a test account, or a real student with them): set a password from the email, see your courses at the
right percent and your certificates under My Courses, open a lesson, watch a video to Mark complete, hand in a
checkpoint with an upload. As a coach: the student's page shows their certificates and old scores ("Old site (Google
Form)"), grade the checkpoint, create and print a certificate, approve a pending sign-up.

## 6. Keep the records

- **(Topher)** Upload `neurodev-hub/scripts/tech-export.json` to R2 (Cloudflare > R2 > `tech-class-uploads` >
  Upload) under `archive/firebase-export-<date>.json`. It is the original record of the old site; keep it with the
  other backups (see `docs/RECORDS-POLICY.md`). Then delete the local copy.
- `hub_dev` holds a copy of the real students from the dry runs. Reset it (`docker compose down -v` in
  `neurodev-hub`, then re-import content) if it should not keep real data, and remove `certificates/` from the dev
  bucket.

## 7. After 30 days on the new site

1. Final export once more (step 1) and archive it beside the first.
2. **(Topher)** Firebase console > Project settings > Delete project. The only irreversible step.
3. Claude removes the old site's code and the Firebase jobs in `.github/workflows/ci.yml`; GitHub Pages keeps
   serving the redirect, since it is built from `web/` and `content/`.
4. The repo rename to `tech-class-website` (`docs/MIGRATION-PLAN.md`) ends `neurodev-tech-class.github.io/site/`
   and so the redirect for old links. Do it only once old bookmarks no longer matter.

## If something goes wrong

- Before step 3 the old site is untouched and still works.
- Undo step 3: Settings > Pages > Source back to **Deploy from a branch**, `main`, `/ (root)`. The old site is back
  at once (its data in Firebase is as it was at the export).
- The importer never overwrites or deletes; after fixing an export, run step 2 again. Imported rows are marked
  (`accounts.legacy_uid`, `progress.via = 'legacy'`, `activity` ids `legacy__…`, `submissions.legacy`).
