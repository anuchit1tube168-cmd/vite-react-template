# ASTRA Read — public feature parity audit

Date: 2026-10-31
Reference: public rendered behavior of `anovel.acith.com` only.

## Verdict
ASTRA Read v0.5.2 now covers the publicly observable reading loop and the major global product surfaces using fresh ASTRA code and content: catalog/search/filter/sort, story detail, chapter directory, free/coin access, Library, reading progress/history, Reader Settings, notifications, public support, coin packages, account flows, mobile navigation, and multi-host deployment architecture.

It is **not 100% production parity**. External-provider functions remain intentionally gated, and signed-in-only target behavior is not bypassed.

## Newly confirmed public behavior
- Support is available while signed out. Its public form asks for issue category, details, contact e-mail and optional phone. ASTRA now has `POST /api/support/public`, guest-safe rate limiting, D1 `support_requests`, and the matching public form.
- Create Account is a separate state from Sign In and contains Google, Username, Email and Password. ASTRA has a separate Create Account UI state; Google remains unconnected until ASTRA owns an OAuth client.
- `VIP Member` and `Quick Top-Up` both expose the same public coin-purchase surface from current evidence; a separate paid VIP-subscription flow was not observed.
- The public coin surface exposes package S 40 Coins / THB 50, M 80 / THB 100, L 240 / THB 300, XL 400 / THB 500, XXL 800 / THB 1,000, plus PromptPay QR and Credit/Debit Card through Stripe Gateway. ASTRA mirrors the package-selection job in original UI, with real checkout disabled.
- Genres has a current-result count and a dedicated in-page title/author search in addition to genre selection and sorting.
- Reader exposes a table-of-contents action and a `buy next chapter automatically when enough Coins` checkbox. ASTRA D1 now stores `reader_preferences.auto_purchase`; v0.5.2 exposes GET/PUT preference APIs and the frontend enhancement auto-unlocks a locked chapter through the existing server-authoritative coin endpoint after navigation.

## Strong parity
- Warm reading-oriented global shell and responsive dense catalog.
- Home / Library / Genres navigation.
- Global search, category chips, latest/chapter/rating/name sort, status filtering.
- Story metadata, start/resume, add/remove Library, chapter directory.
- Free versus coin-gated chapter states.
- Server-authoritative wallet balance, ledger, coin deduction and entitlements.
- Public coin-package selection and payment-method surfaces with payments safely disabled.
- Email/password register/login/logout and HttpOnly server session.
- Public guest support and authenticated support linkage.
- Library and reading-history views with cross-device progress state.
- Reader prev/next, scroll progress, settings persistence and server preference sync.
- Serif/Sans, font size, White/Sepia/Dark, ambient slider and reading width.
- Notifications list, unread badge, mark one/all read.
- Mobile 2-column catalog and single bottom navigation dock.
- Cloudflare Pages frontend + Cloudflare Worker/D1 backend.
- Netlify-compatible build and Edge API proxy committed to GitHub.

## Partial / pending parity
- Google Sign-In: UI is present, but production login requires a project-owned Google OAuth client, secret and redirect URIs.
- Password reset / e-mail verification: requires transactional e-mail infrastructure.
- Real Stripe checkout: package/payment-method UI is present, but checkout is disabled until ASTRA connects its own Stripe account and implements signed idempotent webhook reconciliation, refunds and ledger settlement.
- The latest Genres count/search, Create Account, VIP-to-Coin modal mapping and Reader TOC/auto-purchase UI were redeployed after fixing a generated-script parsing bug and require final browser-render smoke confirmation if Cloudflare Browser Rendering is temporarily rate-limited.
- Admin/content CMS is not implemented yet; current catalog content remains migration/seed managed.
- Netlify live site is not created because no connected Netlify account action is available in this chat; repo configuration is ready.
- Signed-in-only target screens not publicly observable were not bypassed or reverse-engineered.

## Release gate
Safe for continued demo/UAT with `PAYMENTS_ENABLED=false`.
Not ready for a paid public launch until OAuth/recovery choices are finalized, production Stripe reconciliation is connected, admin/CMS and backup/restore operations exist, and final cross-user authorization/payment tests pass.
