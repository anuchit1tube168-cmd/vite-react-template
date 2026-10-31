# ASTRA Read — public feature parity audit

Date: 2026-10-31
Reference: public rendered behavior of `anovel.acith.com` only.

## Verdict
ASTRA Read v0.5 now covers the publicly observable core reading loop and the major global product surfaces: catalog/search/filter/sort, story detail, chapter directory, free/coin access states, Library, reading progress/history, Reader Settings, notifications, support, wallet/Quick Top-Up surface, VIP state, email/password account flow, mobile navigation, and multi-host deployment architecture.

It is **not 100% parity** yet. The remaining gaps require project-owned external service configuration or additional operations tooling rather than copying anything from the target.

## Strong parity
- Warm reading-oriented global shell and responsive dense catalog.
- Home / Library / Genres navigation.
- Search, category chips, latest/chapter/rating/name sort, status filtering.
- Story metadata, start/resume, add/remove Library, chapter directory.
- Free versus coin-gated chapter states.
- Server-authoritative wallet balance, ledger, coin deduction and entitlements.
- Quick Top-Up entry with safe demo top-up while real payments are disabled.
- VIP global surface plus server membership state and demo trial.
- Email/password register/login/logout and server session.
- Library and reading-history views with cross-device progress state.
- Reader prev/next and scroll progress saving.
- Serif/Sans, font size, White/Sepia/Dark, ambient slider, reading width.
- Notifications list, unread badge, mark one/all read.
- Support ticket create/history.
- Mobile 2-column catalog and single bottom navigation dock.
- Cloudflare Pages frontend + Cloudflare Worker/D1 backend.
- Netlify-compatible build and Edge API proxy committed to GitHub.

## Partial / pending parity
- Google Sign-In: public target surface observed; ASTRA UI surface exists, but production login requires an OAuth client owned by this project.
- Password reset/email verification: requires a transactional email provider and recovery-token flow.
- Real coin top-up and paid VIP: intentionally disabled until an owned payment provider, hosted checkout, signed idempotent webhooks, refund handling and entitlement reconciliation are configured.
- Admin/content CMS: not implemented yet; current content remains migration/seed managed.
- Netlify live site: repository config is ready, but this chat does not have a Netlify account connector/credential to create or attach the site.
- Signed-in-only target screens that are not publicly observable were not bypassed or reverse-engineered.

## Screen observations
Home and mobile hierarchy are now close in job and density rather than copied pixels: narrow sticky header, search pill, compact filters, 3:4 cards, two mobile columns, reader controls, wallet/VIP entry points. ASTRA retains its own branding, geometric cover treatment, copy and code.

The public target Library signed-out state communicates sign-in, saved favorites, bookmarks and synchronized progress. ASTRA implements the same job and adds separate Saved / Recent Reading tabs after authentication.

The public target story detail exposes a long chapter directory with free chapters and later coin labels. ASTRA implements the same access model with original demo chapter data and server-side entitlement checks.

## Release gate
Safe for continued demo/UAT with `PAYMENTS_ENABLED=false`.
Not ready for a paid public launch until Google OAuth/recovery requirements (if retained), production payment reconciliation, admin/CMS, backup/restore runbook and final cross-user authorization tests are complete.
