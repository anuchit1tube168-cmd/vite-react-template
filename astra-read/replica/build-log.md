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
- Cloudflare Pages deployment `6cefc704-ec7b-4c32-99e8-2bba18f3d5aa` from the runtime-fix commit completed successfully.
- Live mobile Browser Rendering verified Genres result count + dedicated search.
- Live mobile Browser Rendering verified Reader `สารบัญตอน` + auto-purchase checkbox.
- Browser Rendering later hit account-level 429 while attempting the VIP click smoke; this is a renderer-rate-limit limitation, not an application error.

## Current feature status
- Browse/search/filter/sort/status: yes.
- Story detail + searchable/sortable chapter directory: yes.
- Reader prev/next + scroll progress + TOC: yes.
- Reader font/theme/size/width/ambient preferences: yes.
- Reader auto-purchase preference: D1/API live; UI visible in live reader.
- Library + reading history + resume progress: yes, authenticated D1-backed.
- Email/password account/session auth: yes.
- Separate Create Account state: deployed; final click smoke remains part of parity QA.
- Google Sign-In: UI only; project-owned OAuth configuration pending.
- Account export/delete: yes.
- Notifications: yes.
- Guest support + authenticated linkage: yes.
- Coin wallet + ledger + coin chapter unlock: yes for UAT/demo coins.
- Coin package/payment-method UI: yes.
- Real Stripe/PromptPay/card checkout: intentionally OFF pending ASTRA-owned Stripe configuration and signed webhook reconciliation.
- Admin/content CMS: pending.
- Password recovery/e-mail verification: pending external e-mail provider.
- Netlify deploy config + Edge API proxy: ready in GitHub; live Netlify site still requires an account connection unavailable in this chat.
