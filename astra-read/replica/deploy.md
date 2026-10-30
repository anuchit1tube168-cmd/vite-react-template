# ASTRA Read deployment

## Live MVP
Cloudflare account: owner-connected account.
Worker script: `astra-read`
workers.dev: enabled
Live URL: `https://astra-read.anuchit1tube168.workers.dev/`
Source branch: `astra-read-cleanroom`
Source path: `astra-read/`

## Deployment shape
The initial Worker is a small bootstrap that serves ASTRA Read UI assets from this public GitHub branch and edge-caches the source. This keeps GitHub as the inspectable source for the first MVP. No target product API, secret, or asset is referenced.

## Preflight performed
- Clean-room brand/content sweep applied by construction.
- No live credentials required by MVP.
- No live payment path enabled.
- Worker upload succeeded through Cloudflare API.
- workers.dev subdomain enabled.
- External Browser Rendering verified live root HTTP 200 and rendered ASTRA Read controls/catalog.

## Before production data/payments
Move assets into a self-contained Worker/Workers Assets deployment; add staging/prod D1 and R2; implement real auth; test cross-user isolation; implement backups/export/delete; add payment provider only with hosted checkout + signed idempotent webhooks; add monitoring/error tracking and release gates.
