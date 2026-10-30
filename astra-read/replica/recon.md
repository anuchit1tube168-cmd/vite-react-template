# ASTRA Read — clean-room recon

Target reference: public pages of `anovel.acith.com`, inspected only as rendered UI/behavior. No proprietary source, bundles, private APIs, logos, cover art, novel text, or credentials were copied.

## Core loop
Discover catalog → filter/search → open story detail → choose chapter → read → save progress/library.

## Public screen map
- S01 Home: global nav, search, genre chips, sort/status filters, story cards, reader settings entry, sign-in/VIP/support surfaces.
- S02 Library: signed-out gate; signed-in saved titles and progress concept.
- S03 Genres: genre directory, in-category search/filter/sort, card grid.
- S04 Story detail: cover/meta/author/status/rating, synopsis, add-to-library, chapter directory, free/coin labels.
- S05 Reader: chapter content, previous/next, reader settings (font size/theme/reading width).

## Flows
- F01 Browse: Home → filter/search → Story detail.
- F02 Read: Story detail → Chapter → Reader → next/previous.
- F03 Save: Sign in → add/remove Library → resume progress.
- F04 Personalize: Reader → settings → theme/font-size/width persisted locally.
- F05 Monetization shell: VIP / coin labels shown as product surfaces only in MVP; no live payment.

## Entities inferred
Story(id,title,author,genre,status,rating,chapter_count,cover_role)
Chapter(id,story_id,number,title,access_tier)
User(id,display_name)
LibraryItem(user_id,story_id)
ReadingProgress(user_id,story_id,chapter_number)
ReaderPreference(user_id/theme/font_size/reading_width)

## Scope decisions
Original/third-party novel content, cover art, target branding, payment credentials, private APIs, and licensed assets are out of scope. ASTRA Read ships with original demo titles/text and geometric covers.

## Size
M for a production-ready reading platform; current clean-room MVP is S/M.

## Three hardest production areas
1. Server-authoritative identity/library/progress sync across devices.
2. Entitlement/coin/VIP payment integrity and idempotent webhooks.
3. Content ingestion/licensing/moderation at scale.
