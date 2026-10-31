# ASTRA Read — clean-room recon

Target reference: public rendered pages and public interactions of `anovel.acith.com`. No proprietary source, bundles, private APIs, logos, cover art, novel text, credentials, or target account data were copied.

## Core loop
Discover catalog → filter/search → open story detail → choose chapter → read → save progress/library → unlock paid chapter with coins when required.

## Public screen map
- S01 Home: sticky header, Home/Library/Genres, search, support, notifications, VIP surface, sign-in, reader settings, genre chips, sort/status filters, dense 3:4 story grid, floating Quick Top-Up.
- S02 Sign-in modal: Google sign-in surface, email/password sign-in, signup transition.
- S03 Library: authenticated collection / resume-reading concept; signed-out state requires authentication.
- S04 Genres: genre browsing with the same filter/sort language as Home.
- S05 Story detail: back link, cover/meta/author/status/rating/chapter count, synopsis, start reading, add to library, full chapter directory.
- S06 Reader: chapter content, chapter navigation, persistent reader controls.
- S07 Reader settings drawer: Serif/Sans choice, font size, White/Sepia/Dark themes, light-to-night slider.
- S08 Wallet / Quick Top-Up: coin balance/top-up entry point and coin-gated chapters.
- S09 VIP: VIP Member surface in the global shell.
- S10 Notifications: global notification entry point.
- S11 Support: global admin-support entry point.

## Observed monetization behavior
On a publicly visible story detail page, early chapters were directly readable while later chapters displayed `10 Coins`. The exact free/locked boundary is content-specific and is not copied into ASTRA Read. ASTRA Read uses original demo data with the same job-to-be-done: free chapters plus server-authoritative coin unlocks.

## Observed authentication behavior
The public sign-in modal exposes a Google sign-in option plus email/password sign-in and a signup action. ASTRA Read implements email/password now. Google OAuth remains provider-configuration work because a legitimate OAuth client ID/redirect setup must belong to this project; target OAuth credentials are explicitly out of scope.

## Flows
- F01 Browse: Home → filter/search → Story detail.
- F02 Read: Story detail → Chapter → Reader → next/previous.
- F03 Save: Sign in → add/remove Library → resume progress.
- F04 Personalize: Reader/Global shell → settings → font/theme/size/width persisted locally and synced when authenticated.
- F05 Coin access: locked chapter → Wallet → top-up → server-authoritative coin deduction → entitlement → read.
- F06 VIP: VIP entry → membership state / trial or future hosted checkout.
- F07 Support: sign in → submit support ticket → see ticket history.
- F08 Notifications: sign in → notification list → mark one/all read.

## Entities inferred
Story(id,title,author,genre,status,rating,chapter_count,cover_role)
Chapter(id,story_id,number,title,access_tier,coin_price)
User(id,display_name,email)
LibraryItem(user_id,story_id)
ReadingProgress(user_id,story_id,chapter_number,progress_pct)
ReaderPreference(user_id,theme,font_family,font_size,reading_width,ambient)
CoinLedger(user_id,delta,reason,reference_id)
Entitlement(user_id,chapter_id,source)
VipMembership(user_id,tier,status,source,expires_at)
Notification(user_id,kind,title,body,is_read)
SupportTicket(user_id,subject,message,status)

## Scope decisions
Original/third-party novel content, cover art, target branding, target payment credentials, target OAuth clients, private APIs, and licensed assets are out of scope. ASTRA Read ships with original demo titles/text and generated/geometric cover treatment.

## Size
L for feature parity without live payments; XL once production payments, transactional email, CMS/admin, content ingestion, and operational controls are included.

## Hardest production areas
1. Server-authoritative identity, entitlements, wallet, and cross-device reading state.
2. Payment integrity, idempotent hosted checkout/webhooks, refunds and subscription lifecycle.
3. Licensed content ingestion, moderation, admin tooling and large-catalog performance.
