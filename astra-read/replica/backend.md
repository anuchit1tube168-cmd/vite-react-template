# ASTRA Read backend readiness

## Phase 2 status — live
- Primary database: Cloudflare D1 `astra-read-prod` in APAC.
- Worker binding: `DB` configured in `wrangler.toml`.
- Catalog: read from D1, no longer hard-coded in the live API.
- Story detail / chapter metadata: read from D1.
- Chapter bodies: demo content currently stored in D1 for the prototype; move licensed production bodies to R2 later if needed.
- Library: D1-backed per reader ID.
- Reading progress: D1-backed per reader ID.
- Entitlements: server-side D1 table; locked demo chapters require an entitlement row.
- Coin ledger schema: present, but no real coin purchase/spend is enabled.
- Payments/VIP: explicitly disabled (`PAYMENTS_ENABLED=false`).
- Auth: still device/demo identity only; no password or third-party OAuth secrets are collected.
- Secrets: none committed to GitHub.

## API surface
- `GET /api/health`
- `GET /api/catalog`
- `POST /api/readers`
- `GET /api/library`
- `POST|DELETE /api/library/:bookId`
- `GET /api/progress`
- `PUT /api/progress/:bookId`
- `GET /api/books/:bookId`
- `GET /api/books/:bookId/chapters/:chapterNo`
- `POST /api/demo/unlock/:bookId/:chapterNo`

All SQL writes use parameter binding. Book IDs and reader IDs are validated server-side. Paid/demo chapter access is decided on the Worker, not from a client flag.

## Data model
`books -> chapters`; `reader_profiles -> library_items`; `reader_profiles -> reading_progress`; `reader_profiles + chapters -> entitlements`; `reader_profiles -> coin_ledger`.

Deletion behavior is defined with foreign keys and `ON DELETE CASCADE` where child records belong to the parent reader/book.

## Current security boundary
The current `reader_id` is a device-generated demo identifier, not authentication. It is suitable for prototype sync only and must not be treated as proof of identity. Do not store sensitive user data in Phase 2.

## Phase 3 gate
Before real users or money:
1. Add real authentication and signed server session.
2. Add cross-user isolation tests using two accounts.
3. Add auth/write rate limits.
4. Add account export/delete flow.
5. Keep entitlement and coin balance server-authoritative.
6. Add a payment provider only after signed webhook + idempotency tests are green.
7. Add production backups and restore drill notes.
