# ASTRA Read build log

## 2026-10-30 — Phase 1
- Completed public clean-room recon of the reference product's rendered UI and flows.
- Created the independent `ASTRA Read` brand and original demo catalog.
- Implemented Home, Genres, Library, Story Detail and Reader routes.
- Deployed Cloudflare Worker `astra-read` on workers.dev.

## 2026-10-30 — Phase 2
- Created D1 database `astra-read-prod` in APAC.
- Added schema + reproducible seed migrations.
- Seeded 6 original stories and 72 demo chapters.
- Moved catalog/detail/chapter/library/progress state to D1.
- Added server-side demo entitlement checks.
- Kept payment disabled.

## 2026-10-30 — Phase 3
- Added email/password account tables and server sessions.
- Passwords use PBKDF2-SHA256 with per-account salt and 100,000 iterations.
- Session cookie is HttpOnly/Secure/SameSite=Lax; D1 stores only token hashes.
- Private Library/Progress/Entitlement authorization derives user identity from the server session.
- Added account export/delete.
- Deployed v0.3.0; live health smoke returned HTTP 200.

## 2026-10-30 — Phase 4
- Added D1 migrations for notifications, support tickets and rate counters.
- Added Welcome, support acknowledgement and demo-entitlement notifications.
- Added authenticated notification list/read flow and support-ticket create/history flow.
- Added Origin/Sec-Fetch-Site write guard.
- Added register/login rate control without storing raw IP addresses in the rate table.
- Updated header UI with real notification and support actions.
- Deployed Worker v0.4.0 (`deployment da9b9a235ee8494e90124c64bc0599d1`).
- Live production health smoke returned HTTP 200 with `mode=auth-notify-support`, `books=6`, `payments=false`.

## 2026-10-31 — Phase 5 public feature parity
- Re-audited the target from public rendered behavior rather than relying on the first screen map.
- Expanded the feature matrix from the original small MVP list to 60 tracked behaviors.
- Added D1 reader preferences, wallet integrity helpers, optional ASTRA VIP state, guest support requests, and reader auto-purchase preference.
- Added server-authoritative wallet balance, coin ledger, demo top-up, coin deduction and chapter entitlements.
- Added public guest Support with category, details, contact e-mail and optional phone. Guest requests are rate-limited and can link to a signed-in reader when available.
- Added public coin-package UI matching the observed package structure: S 40/50, M 80/100, L 240/300, XL 400/500, XXL 800/1000; PromptPay and card payment-method surfaces are present while real checkout remains disabled.
- Corrected the public product model after observing that both `VIP Member` and `Quick Top-Up` expose the same coin-purchase surface. A separate paid VIP subscription is not treated as required parity from current evidence.
- Added separate Create Account state with Username / Email / Password plus Google surface.
- Added Genres current-result count and dedicated in-page title/author search.
- Added Reader table-of-contents action and `auto-purchase next chapter when enough Coins` preference; the D1 preference is exposed via GET/PUT API and locked chapters can use the existing coin-unlock endpoint after navigation.
- Fixed a generated parity-script parsing bug caused by regex escaping inside the static build template. Commit `a2c5adf60ee9455d8e61635d3a8a3f99375ed339` removed the fragile regex and uses pathname segments instead.
- Deployed Cloudflare Worker v0.5.2 stack; latest upload deployment id `e738e9e1eb80464fb44a81bc68a285dc`.
- Live Browser Rendering verified Genres result count/search, Create Account, VIP → Coin packages and Reader TOC/auto-buy/bottom TOC controls.

## 2026-10-31 — Phase 6 production operations
- Added `user_roles`, `audit_log` and `cms_settings` migration and confirmed them live in production D1.
- Added a production Admin Console at `/admin` with one-time Owner bootstrap, RBAC, book/chapter CMS, Support queue, users/roles and audit log.
- Owner bootstrap stores only a SHA-256 hash of the one-time setup token in D1. The owner chooses their own e-mail and password; the server creates the normal account with PBKDF2-SHA256 and deletes the bootstrap hash after successful bootstrap.
- Added server-side Admin APIs under `/api/admin/*` directly in the Cloudflare Pages Worker using the production D1 binding. Normal reader APIs continue proxying to the core Worker.
- Added `admin-page.html`, `admin-worker-v2.js` and `build-admin.mjs`; Pages build now runs `build-static.mjs && build-admin.mjs`.
- Fixed `/admin` canonical-asset redirect loop by serving the Admin HTML directly from the Pages Worker.
- Production Pages deployment `7874a7a9-849c-4f2e-8906-1b77ea7c2847` completed successfully. Live Browser Rendering returned HTTP 200 for `/admin` and verified the Owner setup UI.
- Production D1 checkpoint before Owner creation: 6 books, 72 chapters, 0 authenticated accounts, 0 owners, one active bootstrap hash.
- Created separate APAC D1 database `astra-read-staging` (`98e46a5c-86e0-4fc3-9d65-f818b2ae9cb0`) and seeded the same schema + 6 demo books + 72 chapters.
- Cloudflare Pages production `DB` binding remains `astra-read-prod`; preview `DB` binding now points to `astra-read-staging`. UAT/preview therefore cannot mutate production D1 by accident.
- Added `replica/admin.md` operations runbook. The plaintext Owner Setup Token is intentionally not committed to Git.
- Real payments remain disabled.

## Current feature status
- Browse/search/filter/sort/status: yes.
- Story detail + searchable/sortable chapter directory: yes.
- Reader prev/next + scroll progress + TOC + auto-buy preference: yes.
- Reader font/theme/size/width/ambient preferences: yes.
- Library + reading history + resume progress: yes, authenticated D1-backed.
- Email/password account/session auth: yes.
- Separate Create Account state: yes, live verified.
- Google Sign-In: UI only; project-owned OAuth configuration pending.
- Account export/delete: yes.
- Notifications: yes.
- Guest support + authenticated linkage: yes.
- Coin wallet + ledger + coin chapter unlock: yes for UAT/demo coins.
- Coin package/payment-method UI: yes; VIP button routes to the same surface.
- Admin/content CMS: live.
- Owner/Admin RBAC + audit log: live.
- Production/staging D1 isolation: live.
- Real Stripe/PromptPay/card checkout: intentionally OFF pending ASTRA-owned Stripe configuration and signed webhook reconciliation.
- Password recovery/e-mail verification: pending external transactional e-mail provider.
- Netlify deploy config + Edge API proxy: ready in GitHub; live Netlify site requires a Netlify account connection.
