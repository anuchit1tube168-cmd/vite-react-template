# ASTRA Read architecture

## MVP now
Browser → Cloudflare Worker `astra-read` → ASTRA Read assets from the GitHub branch. The Worker exposes `/api/health` and `/api/catalog`; UI state for demo sign-in, library, progress and reader preferences is localStorage only.

This GitHub-backed bootstrap is intentionally simple for the first runnable clean-room build. It contains no target secrets or target APIs.

## Production target
Browser/PWA → Cloudflare Worker API/router → D1 primary database + R2 licensed content/cover storage + optional Queues for async jobs.

### Suggested tables
- users: id, provider_subject, display_name, role, created_at, updated_at
- stories: id, slug, title, author_name, synopsis, genre_id, status, rating_summary, published_at, updated_at
- chapters: id, story_id, number, title, body_object_key, access_tier, coin_price, published_at, unique(story_id,number)
- library_items: user_id, story_id, created_at, unique(user_id,story_id)
- reading_progress: user_id, story_id, chapter_number, position, updated_at, unique(user_id,story_id)
- reader_preferences: user_id, theme, font_size, reading_width, updated_at
- entitlements: user_id, product_type, product_id, status, expires_at, provider_ref
- ledger: id, user_id, kind, amount_minor, currency_or_coin, idempotency_key, created_at

### Authorization
Public read: published story metadata and free chapters. Authenticated users may mutate only their own library/progress/preferences. Entitlements and coin balances are server-authoritative; admin/content mutation is role-gated.

### API sketch
GET /api/catalog
GET /api/stories/:id
GET /api/stories/:id/chapters
GET /api/read/:story/:chapter
GET/PUT /api/me/library
GET/PUT /api/me/progress
GET/PUT /api/me/preferences
POST /api/checkout (future, hosted checkout only)
POST /api/webhooks/payment (future, signed + idempotent)

## Hardening
Use D1 migrations, R2 signed/private content access where required, rate limits on auth/mutation endpoints, CSRF/session protections as appropriate, no secrets in GitHub, separate staging/production bindings, backups and deletion/export flows.

## Build order
1. Current vertical slice: browse → detail → reader.
2. D1 identity/library/progress.
3. Licensed content pipeline and admin workflow.
4. Server-authoritative VIP/coins/payments.
5. Notifications, analytics, moderation and PWA/offline improvements.
