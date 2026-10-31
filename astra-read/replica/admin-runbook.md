# ASTRA Read Admin / CMS Runbook

## Live components
- Reader frontend: `https://astra-read-static.pages.dev/`
- Reader API: Cloudflare Worker `astra-read`
- Admin API + UI: Cloudflare Worker `astra-read-admin`
- Primary database: D1 `astra-read-prod`
- Payments remain disabled.

## First owner setup
1. Create a normal ASTRA Read account from the Reader frontend.
2. Open the Admin Worker URL.
3. Sign in using the same ASTRA email/password.
4. Because there is no owner yet, the portal displays the one-time Owner Bootstrap screen.
5. Enter the bootstrap token supplied out-of-band by the system owner.
6. On success, a `user_roles` row with role `owner` is created and an immutable audit event is written.
7. After any owner exists, bootstrap returns `bootstrap_closed` and cannot promote another account.

## Admin capabilities
- Dashboard counts: books, chapters, users, open support, audit events.
- Books: list, create, edit title/author/genre/status/rating/accent/description.
- Chapters: list per book, create chapter, edit title/body/free-vs-coin price.
- Chapter count is recalculated server-side after creation.
- Support: list public support requests and close/reopen them.
- Audit: read latest admin mutation events.

## Security posture
- Admin uses its own `ar_admin_session` HttpOnly/Secure/SameSite=Lax cookie.
- Password verification uses the existing PBKDF2-SHA256 account hashes; plaintext passwords are never stored.
- Only SHA-256 hashes of session tokens persist in D1.
- Admin writes are Origin/Sec-Fetch-Site guarded.
- Role checks run server-side on every CMS endpoint.
- Owner bootstrap token is a Cloudflare `secret_text` binding and is not committed to GitHub.
- CMS mutations write `audit_log` events.
- Payment is still OFF; CMS cannot enable real payment checkout.

## Current production checkpoint (2026-10-31)
- Books: 6
- Chapters: 72
- Auth accounts: 0 at checkpoint
- Owners: 0 at checkpoint
- Open support: 0 at checkpoint
- Audit events: 0 at checkpoint

The first real user account can therefore safely claim Owner once using the bootstrap flow without colliding with an existing privileged account.
