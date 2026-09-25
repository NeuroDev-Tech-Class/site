# Render setup for the Tech Class site

The new site is one **free** Render static site, `tech-frontend`, defined in `render.yaml` at the repo root. Its
backend is the hub's existing `hub-backend` service (`/api/v1/tech/*`), so nothing else is created and the monthly
bill does not change (the Pro workspace covers custom domains; a static site has no compute charge).

Written 2026-09-25, when Phase 4 was done. Steps marked **(Topher)** need his Render or cPanel login.

## 1. First deploy (once)

1. **(Topher)** Commit and push `render.yaml`, `.nojekyll` and this file, and merge to `main`.
2. **(Topher)** Render dashboard > **New > Blueprint** > repository `NeuroDev-Tech-Class/site` > branch
   **`main`** > Apply. Render creates `tech-frontend` and runs the first build
   (`cd web && npm ci && npm run build`, publishing `web/dist`). It lands "ungrouped".
3. **(Topher)** Move it into the **Tech Class** environment of the NeuroDev project (service > Settings, or the
   environment's "Add service"). Blueprints can't place a service in an environment.
4. Open the `onrender.com` URL Render assigned. Home, Catalog, Resources and every published course page are
   built from `content/` at build time, so they work before the backend is deployed.

## 2. Custom domain: `tech.neurodevmentoring.com`

`render.yaml` already lists the domain, so Render shows it under **Settings > Custom Domains** as "pending" with
the CNAME target to use (the service's `…onrender.com` host).

1. **(Topher, or Claude with cPanel open)** cPanel > Zone Editor > `neurodevmentoring.com` > **Add record**:
   `tech` CNAME → that host, TTL 14400. **Add only**: this zone carries the Google Workspace MX and SendGrid
   records; never edit or delete anything in it.
2. InfoWest publishes in roughly 20–30 minutes. Render then verifies the domain and issues the certificate itself.
3. Record the row in `../IDEA-Assessment/project-notes/03-dns-records.md` (there is a "future tech" placeholder).

## 3. What works when

| Piece | Works as soon as | Why |
|---|---|---|
| Home, Catalog, Resources, course pages, 404 | the static site is up | rendered from the committed `content/` JSON |
| Register, verify, sign-in, Google sign-in, waiting page | `tech-class` is merged to hub `main` and `hub-backend` has redeployed | the routes live in the hub; `CORS_ORIGINS` and `TECH_APP_BASE_URL` in the hub's `render.yaml` already name `https://tech.neurodevmentoring.com` |
| Catalog and course data from the API (Phase 6 onward) | the content import has been run against production (hub README, "Tech course content") | `tech.courses` etc. are empty until then |

Sign-in on the live site before the hub merge just shows the site's own "can't reach the server" error; that is
expected, not a bug.

## 4. Every later deploy

Merge to `main` and Render rebuilds automatically, but only when something under `web/`, `content/`,
`assets/images/` or `render.yaml` changed (`buildFilter`). `main` also feeds the old GitHub Pages site until cutover: `.nojekyll` at the repo root stops Pages from running
Jekyll over `web/` and `content/` (Astro's `---` front matter broke the Pages build on 2026-09-25).

## 5. Checks after the first deploy

- Render build log ends with `astro build` output and "Your site is live".
- `https://tech-frontend….onrender.com/` and, once DNS is in, `https://tech.neurodevmentoring.com/`: Home loads, the
  header logo and course images show (they come from `assets/images` via `scripts/sync-assets.mjs`), Catalog lists
  fourteen courses (`web-dev-1` hidden as a draft), a course page opens, an unknown path shows the site's own 404.
- `https://tech.neurodevmentoring.com/site/catalog.html` redirects to `/catalog.html` (404 for now; per-page
  redirects come with Phase 15).
- Response headers include `X-Frame-Options: DENY`.
