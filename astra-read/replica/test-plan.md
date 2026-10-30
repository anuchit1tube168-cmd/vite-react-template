# ASTRA Read test plan

## Core flow smoke
1. `/` renders header, search, filters and original story cards.
2. `/genres` renders all genre filters and catalog.
3. `/library` shows signed-out gate; demo sign-in then shows saved titles.
4. `/novel/skyforge` shows original story detail and chapter directory.
5. `/read/skyforge/1` renders reader and previous/next controls.
6. Reader theme, font size and width persist after refresh.
7. `/api/health` returns ok/service/version.
8. `/api/catalog` returns only ASTRA Read original demo data.

## Edge coverage for production
Empty and long/unicode searches; invalid story/chapter IDs; double-click library toggle; multiple tabs; back/refresh; slow/offline assets; expired session; cross-user isolation; locked chapters; mobile widths; keyboard-only navigation; screen-reader labels; DST/time-zone behavior for scheduled releases.

## Release blockers
S1: data leakage/payment entitlement bypass/site unavailable.
S2: auth isolation failure, paid chapter access bug, broken core reader flow.
No production launch with open S1; fix S1/S2 and add regression checks first.
