# ASTRA Read deployment

## Source of truth
- GitHub repo: `anuchit1tube168-cmd/vite-react-template`
- Branch: `astra-read-cleanroom`
- App path: `astra-read/`
- Shared static build: `node scripts/build-static.mjs`
- Build output: `astra-read/dist/`

## Cloudflare production
Primary static frontend:
- Pages project: `astra-read-static`
- Live URL: `https://astra-read-static.pages.dev/`
- Production branch: `astra-read-cleanroom`
- Root directory: `astra-read`
- Build command: `node scripts/build-static.mjs`
- Publish directory: `dist`
- Advanced Pages Worker is generated into `dist/_worker.js` and proxies only `/api/*` to the canonical backend.

Canonical backend:
- Worker: `astra-read`
- URL: `https://astra-read.anuchit1tube168.workers.dev/`
- D1 binding: `DB` -> `astra-read-prod`
- Payments: disabled

Legacy/fallback entry retained during transition:
- `https://astra-read-fallback.pages.dev/`

## Netlify-ready deployment
Repository config is ready but a Netlify account connection is still required because no Netlify account connector/credential is available in the current ChatGPT session.

Use these settings when connecting the repository in Netlify:
- Repository: `anuchit1tube168-cmd/vite-react-template`
- Production branch: `astra-read-cleanroom`
- Base/package directory: `astra-read`
- Config file: `astra-read/netlify.toml`
- Build: `node scripts/build-static.mjs`
- Publish: `dist`
- Edge function: `netlify/edge-functions/astra-api.js`

The Netlify Edge Function handles `/api/*`, rewrites requests to the canonical Cloudflare Worker as same-origin, and preserves the frontend/backend contract without duplicating D1 data.

## Visual release
The warm premium catalog redesign is stored in `src/styles.js` and `replica/design/tokens.json`:
- warm paper/sepia background
- compact sticky header
- pill search and category filters
- responsive 6/4/2 column catalog
- 3:4 original geometric cover system
- gold VIP treatment and blue primary sign-in action
- right-side reader settings drawer
- serif/sans reader choice enhancement
- mobile-safe HTML shell and bottom navigation dock

No target logos, cover art, novel text, private APIs, proprietary source code, or private assets are copied.

## Verification completed
- Cloudflare Pages build/deploy succeeded from GitHub commit `970e2e020a304f029de3b1bb1707de7d7dda188d`.
- Mobile Browser Rendering at 390x844 returned HTTP 200 and rendered ASTRA Read catalog controls, six original demo titles, and mobile dock.
- Production backend remains separate from static frontend and payments remain OFF.
- Browser Rendering API hit a rate limit during a later `/api/health` probe, so that single probe was not re-run in the same release window.

## Release rule
GitHub is the source of truth. Cloudflare Pages is the primary frontend. Cloudflare Worker + D1 is the backend. Netlify is the secondary preview/fallback target after the user connects the repository to their Netlify account.
