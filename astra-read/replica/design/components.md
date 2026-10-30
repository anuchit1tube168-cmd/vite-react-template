# ASTRA Read components

## AppHeader
Desktop navigation, responsive search, account/VIP/support/settings actions. Keyboard focus must remain visible.

## StoryCard
3:4 generated cover role, title, author, genre, rating and chapter count. Entire card is an interactive navigation target with keyboard support.

## FilterBar
Genre chips plus sort/status selectors. Selected state uses semantic primary tint rather than copied target styling.

## StoryDetail
Cover, metadata, synopsis, primary read CTA, library toggle and chapter directory.

## ChapterRow
Chapter number/title, estimated reading time, access label (Free / coin preview), read action.

## Reader
Sticky top bar, semantic article body, previous/next controls, responsive measure and persisted preferences.

## ReaderSettings
Theme (white/sepia/dark), font-size controls and reading-width slider. Changes are applied without page reload.

## Modal
Used for demo sign-in, VIP preview and support. Production version requires focus trap, Escape close and proper dialog semantics.

## States
Every production component should cover loading, empty, error, permission/locked, long text, mobile and offline/slow-network states.
