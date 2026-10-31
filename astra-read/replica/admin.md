# ASTRA Read Admin / Operations Runbook

Status: live on Cloudflare Pages

## Entry points
- Reader app: `https://astra-read-static.pages.dev/`
- Admin console: `https://astra-read-static.pages.dev/admin`
- Core API: Cloudflare Worker `astra-read`
- Admin API: Cloudflare Pages Function/Worker under `/api/admin/*`

## First owner bootstrap
Production starts with no privileged account. A one-time bootstrap token is stored only as a SHA-256 hash in production D1 and is supplied to the owner out-of-band; the plaintext token must never be committed to Git.

1. Open `/admin`.
2. Enter the one-time Owner Setup Token.
3. Choose the owner display name, email and a password of at least 12 characters.
4. Select **Create Owner**.
5. The server creates the normal account, grants `owner`, writes an audit event, and deletes the bootstrap hash.
6. The console then signs in through the normal ASTRA authentication route.

After the first owner exists, bootstrap is closed server-side.

## RBAC
- `reader`: no admin console permissions.
- `admin`: books/chapters, support queue and audit reads/updates.
- `owner`: all admin capabilities plus user role assignment and destructive chapter deletion.

Authorization is derived from the server session and `user_roles`; the browser cannot select its own reader ID or role.

## Content CMS
Admin can:
- create/update books;
- list chapters by book;
- create/update chapters;
- choose Free vs Coins and coin price;
- delete chapters (owner only);
- automatically recalculate chapter count after chapter mutations.

All content mutations write to `audit_log`.

## Support operations
The queue combines:
- guest `support_requests`;
- authenticated `support_tickets`.

Admin can close or reopen each item. Mutations are audited.

## Production / staging isolation
Production D1:
- `astra-read-prod`
- used by production Pages and the core Worker.

Staging D1:
- `astra-read-staging`
- separate APAC database seeded with the same 6 original demo stories and 72 chapters;
- used by Pages preview configuration only.

Never bind preview/UAT back to production D1.

## Security posture
- Passwords: PBKDF2-SHA256, 100,000 iterations, random per-account salt.
- Sessions: opaque cookies; database stores session hashes.
- Write APIs reject cross-site browser writes.
- Owner bootstrap is one-time and rate-limited.
- Admin actions use server-side RBAC and audit logging.
- Real card data is never collected by ASTRA Read.
- `payments=false` remains a release invariant until a project-owned payment provider is configured with signed, idempotent webhook reconciliation.

## Production payment gate
Do not enable paid Coins/PromptPay/Card checkout until all are complete:
1. project-owned Stripe/payment account;
2. hosted checkout or provider-controlled payment UI;
3. signed webhook verification;
4. idempotency and duplicate-event handling;
5. successful payment → ledger reconciliation;
6. refund/chargeback reversal;
7. entitlement reconciliation tests;
8. staging UAT before production enablement.
