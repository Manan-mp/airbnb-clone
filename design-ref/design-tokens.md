# Design tokens — measured from airbnb.co.in (logged out, 9 Oct 2026)

Reference only. Values below were read with `getComputedStyle` / `getBoundingClientRect` in the built-in browser at
1440x900 (desktop) and 390x844 (mobile) viewports. Do not copy Airbnb's code, logo, fonts, icons or images:
re-create these values with your own assets.

Legend: **UNVERIFIED** = not directly measured or observed (inferred from screenshots, or not captured at all).

## Screenshot caveats (read first)
- Desktop shots (`*-1440.png`) are real 1440px-wide viewports but the pane returns them downscaled to **800x500** JPEG
  (converted to PNG). Layout is accurate, small text is hard to read. Rely on the numbers in this file for exact values.
- Mobile shots (`*-390.png`) are 780x1688 (2x) and sharp. `reserve-error-390.png` is 390x844.
- The map on the 1440 results page was still grey (tiles not loaded) in `search-results-1440.png`; it was loaded in `filters-modal-1440.png`.

## Colors
| Token | Value | Where seen |
|---|---|---|
| text-primary | `#222222` (rgb 34,34,34) | body, headings, card title |
| text-secondary | `#6C6C6C` (rgb 108,108,108) | card price line, subtitles |
| text-disabled / divider dot | `#C1C1C1` (rgb 193,193,193) | "Clear all" disabled, `·` separators |
| text-unavailable (calendar) | `#8C8C8C` (rgb 140,140,140) + line-through | unavailable dates |
| bg-page | `#FFFFFF` | body |
| bg-subtle | `#F7F7F7` (rgb 247,247,247) | footer, calendar range fill |
| bg-control | `#F2F2F2` (rgb 242,242,242) | circular icon buttons (profile, carousel arrows, stepper +/-) |
| border-light | `#DDDDDD` (rgb 221,221,221) | social login buttons |
| brand (gradient) | `linear-gradient(to right, #E61E4D 0%, #E31C5F 50%, #D70466 100%)` | Continue, Check availability, Search (mobile sheet) |
| brand-flat (search circle) | approx `#E61E4D`–`#D70466`; exact flat value UNVERIFIED (gradient on the button) | desktop search circle |
| heart (on image, idle) | fill `rgba(0,0,0,0.5)`, stroke `#FFFFFF`, stroke-width 2px | card wishlist button |
| badge bg | `rgba(255,255,255,0.8)` | "Guest favourite" pill |
| selected date | bg `#222222`, text `#FFFFFF` | calendar start date |

## Typography
- Font stack (computed): `"Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, ...` — proprietary. Substitute with an open font of similar geometry.
- Body: 14px / 20.02px / 400.

| Element | Size / line-height / weight | Notes |
|---|---|---|
| Card title (e.g. "Room in Chandigarh") | 13px / 16px / 500 | home carousel card |
| Card price/meta | 12px / 16px / 400, `#6C6C6C` | |
| "Guest favourite" badge text | 11px / 13px / 600 | pill: padding 5.5px 9.5px, radius 14px, 82.6x14.5 text box |
| Home section heading (h2 wrapper) | measured inner size UNVERIFIED (h2 wrapper read 14px/400; visually ~18–20px/600 desktop, ~22px/600 mobile) | |
| Listing h1 (desktop) | 26px / 30px / 500 | |
| Listing section h2 (desktop) | 22px / 500 | "What this place offers", "Select check-in date" |
| Review score (big) | 100px / 500 | "4.85" |
| Host name h2 | 26px / 700 | |
| Filters modal title | 16px / 20px / 600 | |
| Filters modal section heading | 18px / 24px / 500 | |
| Login modal heading | 26px / 30px / 600 | |
| Primary button text | 16px / 20px / 500 | |
| Search input text | 14px / 18px / 500 | |
| Filter chip text | 12px / 16px / 400 | |
| Mobile "Who?" heading | 22px / 26px / 700 | |

## Radii
- Listing card image/link: **20px** (home + results)
- Search pill (desktop): **32px**; its inner search button: 24px
- Search pill (mobile, "Start your search"): **40px**
- Mobile category pills: 40px
- Filter / amenity chips: 24px
- Heart, profile, carousel arrows, stepper buttons: 50% (circle)
- Modals (filters, login desktop): **32px**; mobile bottom sheets: 32px 32px 0 0
- Mobile search step cards: 24px
- Primary buttons: 12px (login Continue, mobile Search); reserve/Check availability: 999px (pill)
- Calendar day: 100% (circle), range ends `50% 0 0 50%` / `0 50% 50% 0`
- Social login buttons: 12px, 60x60, border 1px `#DDDDDD`

## Shadows
- Modal (filters, login): `0 0 0 1px rgba(0,0,0,.02), 0 8px 24px rgba(0,0,0,.1)`
- "Guest favourite" badge: `0 0 0 1px rgba(0,0,0,.02), 0 2px 6px rgba(0,0,0,.04), 0 4px 8px rgba(0,0,0,.1)`
- Mobile search pill: `0 6px 20px rgba(0,0,0,.1)`
- Mobile search step card: `0 0 0 1px rgba(0,0,0,.04), 0 6px 20px rgba(0,0,0,.2)`
- Reserve card shadow: UNVERIFIED (visible in screenshot, value not read)

## Layout / sizing
| Item | Value |
|---|---|
| Desktop page side padding (home/results) | 48px (header padding `0 48px`) |
| Header height — home, desktop | 96px (expanded search shown below as 66px pill row) |
| Header height — results, desktop | 152px, `position: sticky` |
| Header collapses on scroll | yes: expanded pill becomes compact "Anywhere / Anytime / Add guests" pill (observed on listing + footer scroll) |
| Search pill, desktop expanded | **850 x 66**, radius 32, centred (x=295 at 1440) |
| Search button (desktop, collapsed state) | 99.7 x 48 when labelled "Search" (opens popover) |
| Category tab (All/Homes/…) | 36px tall; "All" 66px wide, "Homes" 103.5px wide, padding 0 5px |
| Profile/menu circular button | 40x40, bg `#F2F2F2` |
| Carousel arrow buttons | 28x28, bg `#F2F2F2`, circle |
| Heart button | 32x32 at card top-right (8px inset), svg 24x24 |
| Home card (desktop, 1440) | link 181.7 wide; image 181.7 x 172.6 (~**1.05:1**, near square); 7 cards visible per row; gap ≈ 12px. Exact aspect UNVERIFIED (carousel reflows) |
| Home card (mobile, 390) | 165 x 198.8 (image ~165x157, ~1.05:1); 2.3 cards visible; gap 12px; side padding 24px |
| Results card (desktop, 1440) | image 307.2 x 230.4 = **4:3**; radius 20 |
| Mobile search pill | 342 x 56, x=24, y=12 |
| Mobile bottom nav | fixed, 390 x 125 total (60px bottom padding), 3 tabs: Explore / Wishlists / Log in |
| Mobile category pills | 99.8 x 40 ("Homes"), padding 10px 14px |
| Filters modal (desktop) | 568 x 820, centred, radius 32 |
| Filters sheet (mobile) | 390 x 832, top radius 32 |
| Login modal (desktop) | 480 x 488; input 432 x 55 (padding 29px 16px 6px, floating label); Continue 432 x 48 |
| Login (mobile) | full page `/login`, not a modal |
| Listing gallery (desktop, 1440 viewport) | grid: hero 560x476 + four 272x238/272x230 tiles, 8px gaps; content max-width ≈ 1120 (x 160 → 1280) |
| Listing reserve card (sticky) | sticky wrapper `top: 80px`, 373 wide; card 324 inner; CTA 324.3 x 48, pad 14px 24px, radius 999 |
| Listing mobile | hero full-bleed ~ 390x~347 with `1 / 92` counter chip; content card with 32px top radius; fixed bottom reserve bar (price + gradient CTA) |
| Calendar day cell | 42 x 42; selected: bg `#222`, text `#fff`; in-range cell fill `#F7F7F7`; hover end: 1.5px `#222` outline circle |
| Footer | bg `#F7F7F7`, padding-bottom 80px; h≈633 desktop, ≈1246 mobile |

## Grid breakpoints / columns
Home carousels: horizontally scrolling rows (not a grid): ~7 cards at 1440, ~2.3 at 390. Intermediate widths: UNVERIFIED.

Search results page (card grid left of map). Measured by resizing the viewport and reading `[data-testid=card-container]` x/width:

| Viewport | Columns | Card width | Left edge(s) | Notes |
|---|---|---|---|---|
| 1920 | 2 | 430 | 48, 502 | gap 24 |
| 1600 | 2 | 348 | 48, 420 | gap 24 |
| 1440 | 2 | ~307 | 48, ~355 | |
| 1280 | 2 | 337 | 48, 409 | gap 24 |
| 1128 | 2 | 290 | 48, 362 | gap 24; map not detected |
| 950 | 1 | 440 | 32 | list layout |
| 744 | 2 | 328 | 32, 384 | gap 24 |
| 390 | 1 | full width in bottom sheet | 24 | map behind, draggable sheet |

Exact breakpoint pixel values (where 2→1→2 columns flip, where the map appears/disappears): **UNVERIFIED** (sampled only the widths above). Card counts of 3+ columns when the map is hidden: UNVERIFIED.

## Buttons
- **Primary (gradient)**: bg gradient above, white text 16/500, padding 14px 24px, radius 12px (forms/sheets) or 999px (reserve).
- **Secondary/neutral pill button** ("Show all 60 amenities", "Show all 55 reviews" on mobile): bg `#F2F2F2`, text `#222`, radius ~12px, ~48px tall (read from screenshot; exact radius UNVERIFIED).
- **Black CTA** ("Show 1,000+ places", mobile "Next"): bg `#222222`, white text, radius 4px measured on text node wrapper; outer button radius ~12px UNVERIFIED.
- **Ghost** ("Clear all"): transparent, text `#222` (disabled `#C1C1C1`), 14px/500, padding 11px 12px, radius 12px.
- **Filter chip**: bg `#FFF`, 1px light border, text 12/16 400, padding 8px 12px, radius 24px, height 34.
- **Segmented control** ("Any type / Room / Entire home"): selected = 2px dark outline + `#F7F7F7` fill (read from screenshot; exact values UNVERIFIED).
- **Stepper (+/-)**: 32x32 circle, bg `#F2F2F2`; minus disabled at 0 (lower contrast).

## Transitions / hover states
Measured `transition` values:
- Circular buttons (heart, profile, arrows): `transform 0.25s cubic-bezier(0.2, 0, 0, 1)`
- Chips / filter buttons: `box-shadow 0.2s cubic-bezier(0.2,0,0,1), transform 0.1s cubic-bezier(0.2,0,0,1), border-color ...`
- Reserve CTA: `box-shadow 0.2s cubic-bezier(0.2,0,0,1), transform 0.25s cubic-bezier(0.2,0,0,1) ...`
- Text-link style buttons: `text-decoration-thickness 0.3s cubic-bezier(0.2,0,0,1), box-shadow 0.3s ...`
- Ghost "Clear all": `box-shadow 0.2s, transform 0.25s, background-color ...`
- Easing curve used everywhere: `cubic-bezier(0.2, 0, 0, 1)`

Hover appearances (colour/shadow/scale values) for cards, chips, buttons, tabs: **UNVERIFIED** (hover was only exercised on calendar dates; the computed hover styles were not read).

## Spacing
- Page gutters: 48px desktop (home/results), 32px at 744–950, 24px mobile.
- Card grid gap: 24px (results, ≥744). Home carousel gap ≈ 12px (read from screenshot).
- Modal inner padding: 24px (filters content x=460 inside 436 modal).
- Mobile sheet card padding: 24px.
- Vertical rhythm of other sections: UNVERIFIED (not measured).

## Not captured / UNVERIFIED summary
- Reserve page (`/book/stays/...`): server error when loaded directly logged out; layout, tokens UNVERIFIED.
- Wishlist heart toggle states (filled colour), toast styling beyond what is visible, hover styles, focus rings.
- Dark mode: not checked.
- Tablet (744/1128) screenshots were not saved; only column counts were sampled.

## Clone additions (assumption — not measured on the reference site)
| Token | Value | Use |
|---|---|---|
| line-soft | `#EBEBEB` | section dividers (1px) |
| success | `#008A05` | "Book early to save" / success text |
| scrim | `rgba(0,0,0,0.5)` | modal backdrop |
| breakpoint-sm | 550px | small-phone → large-phone grid change |
| header-compact | 80px | collapsed header height (matches sticky reserve `top: 80px`) |
| aspect-card-home | 20 / 19 (measured 181.7 x 172.6) | home grid card image |
| aspect-card | 4 / 3 (measured 307.2 x 230.4) | results card image |
| breakpoint-map | 1280px | results page shows the map pane from here |
