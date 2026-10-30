# ASTRA Read test plan

## Core public smoke
1. `/` renders header, search, filters and only ASTRA Read original story cards.
2. `/genres` renders all genre filters and D1 catalog.
3. `/novel/skyforge` renders detail + chapter directory.
4. `/read/skyforge/1` renders a free chapter.
5. `/read/skyforge/11` returns locked state unless the authenticated reader owns an entitlement.
6. `/api/health` returns HTTP 200 with the expected live version/mode and `payments=false`.

## Account/session
1. Register with valid email, display name and >=10-character password.
2. Registration sets HttpOnly/Secure/SameSite=Lax session cookie and creates a Welcome notification.
3. Wrong login returns generic invalid credentials.
4. `/api/auth/me` works only with a valid unexpired session.
5. Logout invalidates the session.
6. Account export omits password hashes, salts and session hashes.
7. Account delete cascades reader-owned Library/Progress/Entitlement/Notification/Ticket/Session rows.

## Isolation/security
- User A cannot read/write User B Library, progress, notifications, tickets or entitlements.
- Caller-supplied reader IDs have no effect on authenticated private routes.
- Cross-site writes with mismatched Origin or `Sec-Fetch-Site: cross-site` are rejected.
- Auth rate counter rejects repeated attempts after its limit/window.
- SQL values are parameter-bound; invalid book/chapter IDs return controlled 4xx responses.

## Notifications/support
1. New account receives Welcome notification.
2. User can mark only their own notification as read.
3. Valid support ticket returns a unique ticket ID and appears in own history.
4. Ticket acknowledgement produces a notification.
5. Short/invalid ticket content is rejected.
6. Demo unlock produces an entitlement notification and never charges real money.

## UX/edge coverage
Empty/long/unicode searches; long display names; double-submit; multiple tabs; back/refresh; slow/offline source assets; expired session; mobile widths; keyboard navigation; screen-reader labels; long chapter content; time-zone behavior for future scheduled publishing.

## Release blockers
S1: data leakage, auth bypass, entitlement bypass, unintended payment, site unavailable.
S2: account isolation failure, broken login/session, broken core reader flow, lost Library/progress writes.
No public payment launch with open S1/S2. Real payment remains disabled until signed idempotent webhook tests and entitlement reconciliation are implemented.
