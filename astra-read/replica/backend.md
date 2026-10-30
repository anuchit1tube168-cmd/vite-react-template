# ASTRA Read backend readiness

## Phase 3 status — live
- Primary database: Cloudflare D1 `astra-read-prod` in APAC.
- Worker binding: `DB` configured in `wrangler.toml`.
- Catalog, story detail and chapter metadata: D1-backed.
- Library and reading progress: D1-backed and now scoped to an authenticated server session.
- Authentication: email/password with PBKDF2-SHA256 (100,000 iterations, per-account random salt).
- Sessions: random opaque token in `HttpOnly; Secure; SameSite=Lax` cookie; only SHA-256 session-token hashes are persisted in D1.
- Account self-service: authenticated export and delete endpoints are implemented.
- Entitlements: server-authoritative; locked chapters are never unlocked by a client flag.
- Coin ledger schema: present, but real coin purchase/spend remains disabled.
- Payments/VIP: explicitly disabled (`PAYMENTS_ENABLED=false`).
- Secrets: none committed to GitHub.

## Public API
- `GET /api/health`
- `GET /api/catalog`
- `GET /api/books/:bookId`
- `GET /api/books/:bookId/chapters/:chapterNo`

## Authentication API
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/account/export`
- `DELETE /api/account`

## Authenticated reader API
- `GET /api/library`
- `POST|DELETE /api/library/:bookId`
- `GET /api/progress`
- `PUT /api/progress/:bookId`
- `POST /api/demo/unlock/:bookId/:chapterNo`

All SQL writes use parameter binding. Private reader data is derived from the server session rather than a caller-supplied reader ID.

## Data model
`books -> chapters`; `reader_profiles -> auth_accounts`; `reader_profiles -> sessions`; `reader_profiles -> library_items`; `reader_profiles -> reading_progress`; `reader_profiles + chapters -> entitlements`; `reader_profiles -> coin_ledger`.

Foreign keys use cascade deletion where child state belongs to the parent reader/book.

## Security notes
- Passwords are never stored; only PBKDF2 hashes + salts are stored.
- Session plaintext tokens are only in the browser cookie; D1 stores their SHA-256 hashes.
- Login returns one generic invalid-credentials error to avoid basic account enumeration.
- No sensitive reader data should be added until email verification, password recovery, rate limiting and abuse controls are completed.
- Payment remains off until signed idempotent webhook tests are green.

## Phase 4 gate
1. Implement notifications and support/ticket workflow.
2. Add origin/write protections and abuse-rate controls.
3. Add email verification/password recovery before broad public signup.
4. Add admin role + audit log before content management is exposed.
5. Keep payment off.
