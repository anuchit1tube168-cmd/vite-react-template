# ASTRA Read backend readiness

## MVP status
- Auth: demo-only localStorage; no passwords collected or stored.
- Library/progress/preferences: localStorage only.
- Catalog: original in-code demo data.
- Payments/VIP/coins: UI preview only; no live checkout and no financial state.
- Secrets: none required by the MVP and none committed.

## Production plan
Use Cloudflare D1 as the primary database, R2 for licensed chapter bodies/covers, and a server-side identity provider selected by the owner. Keep library/progress/preferences scoped to the authenticated user. Payment state must be server-authoritative and updated only from signed, idempotent provider webhooks.

## Security gates
- Separate staging and production databases/buckets.
- Apply least-privilege roles for content/admin operations.
- Rate-limit auth, search abuse and write endpoints.
- Validate all story/chapter IDs server-side.
- Never trust client coin balances or entitlement flags.
- Provide export/delete-account flows before production user data is stored.
- Add backups and migration rollback notes before launch.
