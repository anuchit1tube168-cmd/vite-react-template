# ASTRA Read backend readiness

## Phase 4 status — live
- Primary database: Cloudflare D1 `astra-read-prod` in APAC.
- Catalog, story detail, chapters, Library and reading progress are D1-backed.
- Authentication: email/password with PBKDF2-SHA256 (100,000 iterations + per-account random salt).
- Sessions: opaque random token in `HttpOnly; Secure; SameSite=Lax` cookie; only SHA-256 token hashes persist in D1.
- Account export/delete: implemented.
- Notifications: D1-backed per user. Welcome, support acknowledgement and demo-entitlement events can generate notifications.
- Support: authenticated readers can submit tickets and view their own ticket history.
- Auth abuse guard: register/login are rate-controlled with a D1 counter keyed by a SHA-256-derived identifier; raw IP addresses are not stored in the rate table.
- Write guard: cross-site browser writes are rejected using Origin / Sec-Fetch-Site checks when present.
- Entitlements: server-authoritative.
- Payments: disabled (`PAYMENTS_ENABLED=false`).

## Current API groups
### Public
- `GET /api/health`
- `GET /api/catalog`
- `GET /api/books/:bookId`
- `GET /api/books/:bookId/chapters/:chapterNo`

### Auth/account
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/account/export`
- `DELETE /api/account`

### Reader state
- `GET /api/library`
- `POST|DELETE /api/library/:bookId`
- `GET /api/progress`
- `PUT /api/progress/:bookId`
- `POST /api/demo/unlock/:bookId/:chapterNo`

### Notifications/support
- `GET /api/notifications`
- `POST /api/notifications/:id/read`
- `GET /api/support`
- `POST /api/support`

## Data model additions
Phase 4 adds `notifications`, `support_tickets`, and `rate_limits`. Reader-owned rows cascade when a reader profile is deleted. Rate-limit records do not contain raw IP addresses.

## Security notes
- Password plaintext is never persisted.
- Session plaintext is never persisted.
- Private endpoints derive the reader identity from the session, not a caller-supplied ID.
- Ticket/notification reads are constrained to the authenticated reader.
- Payment and real coin spending remain intentionally unavailable.

## Before broad public signup
- Add email verification and password reset/recovery.
- Add bot protection (for example Turnstile) if abuse appears.
- Add admin roles + immutable audit trail before exposing content/support administration.
- Add backup/restore runbook and a staging database separate from production.
