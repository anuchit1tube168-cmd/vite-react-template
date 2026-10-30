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
- D1 checkpoint after deploy: 6 books, 72 chapters, and zero real user accounts/sessions/tickets at the checkpoint, so no synthetic smoke-account residue was left behind.

## Current feature status
- Browse/search/filter: yes.
- Story detail + chapter directory: yes.
- Reader: yes for original seeded demo content.
- Library + progress: yes, authenticated D1-backed.
- Reader preferences: yes, local device settings.
- Basic account/session auth: yes.
- Account export/delete: yes.
- Notifications: yes.
- Support tickets: yes.
- Server entitlement enforcement: yes.
- Auth/write hardening: partial but materially improved.
- Email verification/password recovery: pending.
- Admin/content CMS: pending.
- VIP/coins/payment: payment remains OFF; no real transactions.
