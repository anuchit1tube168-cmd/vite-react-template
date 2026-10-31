# ASTRA Read

Clean-room rebuild of a modern web-novel reading experience, implemented from scratch for Cloudflare Workers.

## Included
- Home catalog with search, genre filters, sorting and status filter
- Genre directory
- Local demo Library with sign-in gate
- Novel detail and chapter list
- Chapter reader with font, size, theme and reading-width controls
- Bookmark / reading progress in localStorage
- VIP / coin / support / notification demo surfaces
- `/api/health` and `/api/catalog`

## Deploy
`npx wrangler deploy -c astra-read/wrangler.toml`

## Clean-room note
No target source code, CSS, JS bundles, private APIs, logos, cover art, or novel text are reused. Public UI behavior was used only as product-reference evidence. All shipped branding, copy, sample titles, covers and implementation are original.