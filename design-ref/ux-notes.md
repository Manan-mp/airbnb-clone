# UX notes — airbnb.co.in interaction behaviour (logged out, 9 Oct 2026)

Observed in the built-in browser at 1440x900 and 390x844. Everything here was seen directly unless tagged **assumption:**. An assumption is something that could not be captured; the clone follows the standard Airbnb pattern named after the tag.
No account was created, nothing was typed into forms, nothing was booked.

## Global
- **Dismissable popups**: on first desktop load a modal said "Now you'll see one price for your trip, all fees included." with a "Got it" button. On mobile a "Get the app" top banner had an X. Both were dismissed.
- **Toast**: a small white rounded card "Prices include all fees" (pink tag icon) floats bottom-centre on home (desktop and mobile). It fades out on its own after a few seconds (seen mid-fade on mobile). **assumption:** auto-dismiss after 4s with a 200ms fade. On mobile it floats above the bottom nav.
- **Tabs**: top-level tabs All / Homes / Experiences / Services (desktop centre, mobile pills). "Homes" is a real route (`/homes`); selected tab gets an underline (desktop) or a pressed/raised pill (mobile). Clicking a tab was reliable via its link; coordinate clicks sometimes only registered after the animation settled (wait ~1–2s before reading state).
- **Header collapse (desktop)**: the expanded 3-field search pill collapses to a compact "Anywhere | Anytime | Add guests" pill when the page scrolls (seen on home footer and listing page). Header is `position: sticky`.
- **Mobile bottom nav**: fixed Explore / Wishlists / Log in. "Log in" navigates to a full page `/login` (not a modal).
- **Mobile header**: on home the "Start your search" pill and category pills stay pinned while the page scrolls (footer screenshot).

## Search bar (desktop)
- Pill has 3 segments: Where (text input, placeholder "Search destinations"), When ("Add dates"), Who ("Add guests") + circular red search button.
- Clicking a segment opens its **popover** below the pill; the active segment turns white, the others go grey. The red search button expands into a labelled "Search" button while a popover is open.
- **Where**: popover "Suggested destinations" list with icons (Nearby, Chandigarh, Shimla, Kasauli, Zerakpur, Manali, Kharar…), scrollable (scrollbar visible).
- **When**: popover with "Dates | Flexible" toggle and two side-by-side month grids (Oct + Nov 2026), prev/next chevrons, bottom chips "Exact dates / ±1 day / ±2 days / ±3 days / ±7 days / ±14 days". Past dates are greyed.
- **Who**: popover with steppers for Adults, Children (2–12), Infants (<2), Pets, each with −/+ circles; minus disabled at 0; "Bringing a service animal?" link under Pets.
- Clicking outside the pill closes the popover (observed when a click landed on empty page area). Escape closes modals (observed). **assumption:** Escape also closes popovers.
- Popover open animation takes ~1s; screenshots taken sooner show a half-faded popover.

## Search bar (mobile)
- "Start your search" pill opens a **full-screen sheet** with stacked collapsible steps: Where? → When? → Who?. The open step is a large white card; closed steps are slim rows ("Where — I'm flexible", "When — Add dates").
- Top of sheet: Homes / Experiences / Services tabs + circular close (X).
- Footer bar: "Clear all" (left) and red "Search" (right). On the When step the footer shows "Reset" and a black "Next" button instead, which advances to Who.
- When step shows a vertical scrolling calendar, a Dates | Flexible segmented toggle, and a horizontally scrolling chip row (Exact dates, ±1 day, ±2 days, ±3 days…).

## Filters
- **Desktop**: "Filters" chip (left of a chip row: Wifi, Free parking, Washing machine, Kitchen, Air conditioning) opens a centred 568x820 modal with a title row + X, scrolling body ("Recommended for you" icon tiles, "Type of place" segmented control, "Price range" histogram with two circular handles and Minimum / Maximum inputs) and a sticky footer: "Clear all" (disabled until a filter is set) + black "Show 1,000+ places". Escape closes it. **assumption:** backdrop `rgba(0,0,0,0.5)`, no blur.
- **Mobile**: filter icon (top-right of results header) opens a bottom sheet (full height minus 12px, 32px top radius) with the same content; the quick-filter chips are in a horizontal scroll row under the header.
- **assumption:** a selected chip gets a 2px `#222` border and `#F7F7F7` fill; applying filters re-runs the search and closes the modal.

## Search results
- **Desktop**: two-pane layout: left list of cards in a 2-column grid, right pane a Google Map with price pills, zoom +/−, fullscreen button. Header is sticky (152px) and contains the compact search pill + chip row.
- **Result card**: image carousel with dots (5 visible), heart in top-right, optional badge ("Guest favourite" / "Superhost"), title + rating "★ 4.85 (55)", subtitle, bedrooms/beds, date range, price (struck-through original + current, "for 5 nights"), and small green "Book early to save" + "Free cancellation" tags.
- **Count line**: "Over 1,000 homes in Chandigarh" with a "Prices include all fees" note.
- **Pagination vs infinite scroll**: a `nav[aria-label*=agination]` element exists in the DOM, which suggests numbered pagination rather than infinite scroll. Not scrolled to the bottom to confirm. **assumption:** numbered pagination (circular page buttons with prev/next chevrons) below the grid, 20 per page.
- **Mobile**: map fills the screen behind a draggable bottom sheet (grab handle at top) listing the cards in a single column; header = back arrow + summary pill ("Homes in Chandigarh / Any week · Add guests") + filter icon. **assumption:** the sheet has two snap points (list expanded / peeking above the map) toggled by a "Map" pill. Map tiles stayed grey in the mobile capture.
- **assumption:** hovering a card highlights its price pin on the map (pin turns `#222` with white text).

## Listing detail page
- **Desktop top**: title (h1) + Share / Save links at right; 5-photo gallery (1 large + 4 tiles) with a "Show all photos" button at bottom-right of the grid.
- **Gallery modal**: "Show all photos" navigates to a full-page "Photo tour" (URL gets `modal=PHOTO_TOUR_SCROLLABLE`): back arrow top-left, Share/Save top-right, a row of room thumbnails with labels (Living room, Full kitchen…), then a scrolling list of large photos per room. **assumption:** clicking a photo opens a black full-screen lightbox with a "n / total" counter, prev/next arrows and arrow-key navigation.
- **Mobile top**: full-bleed hero image with back, share, heart over it and a `1 / 92` counter chip; the photo tour was opened via its URL in testing. **assumption:** the hero is a horizontally swipeable (scroll-snap) carousel, and tapping it opens the photo tour.
- **Sticky behaviours (desktop)**:
  1. Right-hand reserve card is in a `position: sticky; top: 80px` wrapper and follows the scroll through the amenities/calendar sections.
  2. After scrolling past the first screen, a sticky **section nav** (Photos / Amenities / Reviews / Location) appears at the top. Once the reserve card scrolls out of view (reviews section), the nav bar also shows "Add dates for prices ★ 4.85 · 55 reviews" with a red **Check availability** button at the right.
  3. A "Take 10% off your next stay — Claim" promo strip sat above the reserve card (offer-specific, may not recur).
- **Sticky (mobile)**: fixed bottom bar "Add dates for prices ★ 4.85" + full-width gradient "Check availability" pill.
- **Reserve card (desktop)**: "Add dates for prices", CHECK-IN / CHECKOUT fields, GUESTS select ("1 guest"), gradient CTA "Check availability", "Report this listing" below. After picking a check-in date, the card updates (fields fill with `10/12/2026`) and scrolls/slides up slightly.

### Calendar (desktop, inline "Select check-in date")
- Two months side by side, prev chevron disabled on the current month; legend row has a keyboard-shortcuts icon (bottom-left) and "Clear dates" (bottom-right).
- Unavailable dates: grey `#8C8C8C` + line-through, not clickable. Available: bold `#222`.
- **Range selection**: first click on 12 Oct → that cell becomes a solid `#222` circle with white text, heading changes from "Select check-in date" to "Select checkout date", and earlier dates + now-invalid dates become struck-through. URL updates with `check_in=2026-10-12&guests=1&adults=1`.
- **Hover preview**: hovering 16 Oct drew the range 12→16 with a `#F7F7F7` fill band (rounded outer ends) and a 1.5px `#222` outlined circle on the hovered end.
- **assumption:** the second click sets checkout and the heading becomes "N nights in <city>" with the date range; a range that would cross a booked date is not selectable; "Clear dates" resets to check-in selection. No min-stay rules.

### Calendar (mobile)
- Opened via the fixed bar's "Check availability" (URL gets `#availability-calendar`): full-height sheet with X (left), "Clear dates" (right), heading "Select check-in date", weekday header row pinned, months stacked vertically, and a footer showing "Add dates for prices ★ 4.85" with a disabled grey **Save** button until a range is chosen. X closes it.

### Other sections
- Amenities: icon + label list (two columns desktop, one mobile); unavailable amenities struck through; "Show all 60 amenities" grey button. **assumption:** it opens a centred modal listing every amenity grouped by category.
- Reviews: huge score with laurel graphic and "Guest favourite" text; rating bars + category scores (Cleanliness, Accuracy, Check-in, Communication, Location, Value); "Guests mention" chip carousel with arrow; review cards (2 per row desktop, horizontal scroll mobile) with "Show more".
- Sections after: Where you'll be (map), Meet your host, Things to know, Explore other options, footer.

## Heart / wishlist
- Heart is a 32x32 circular button over the image (semi-transparent dark fill, white outline). Not clicked during capture. **assumption:** logged in, it toggles to a filled brand-colour heart with a small scale bounce and shows a "Saved to wishlist" / "Removed from wishlist" toast; logged out, it opens the login modal.

## Login
- **Desktop**: "Log in" (profile menu) opens a centred 480x488 modal: logo, "Log in or sign up", a floating-label field "Phone number or email", gradient Continue, "or", Google and Apple icon buttons. Backdrop is a light dim. Close X top-right; Escape closes.
- **Mobile**: separate page `/login` with the same content, no modal chrome.
- **assumption:** the clone uses email + password: "Continue" with a known email shows a password step; an unknown email shows a short sign-up step (name, password, guest/host). No country-code selector.

## Reserve / booking
- Direct navigation to `/book/stays/<id>?checkin=...&checkout=...&numberOfGuests=1` logged out showed a plain page: Airbnb logo + a grey "Something went wrong" error banner (desktop and mobile). Not a captcha or block. The "Reserve" button flow was not clicked. **assumption:** standard "Confirm and pay" page: back arrow + title, left column with trip details (dates, guests, each with "Edit"), mocked payment section and a "Confirm and pay" gradient button; right column a sticky summary card (photo, title, rating, price breakdown, total).

## Footer
- Light grey `#F7F7F7`; top: a link grid of destinations with property types (e.g. "Barcelona / Flat rentals") and a "Show more" control (section heading not captured); then three columns Support / Hosting / Airbnb; bottom row: © line + Privacy · Terms · Company details on the left; language (English (IN)), currency (₹ INR), and social icons on the right. Mobile: single column, sections separated by 1px lines.

## Clone-wide assumptions
- **assumption:** the home page is a responsive grid of listing cards under a sticky category row, with numbered pagination (the assignment asks for a grid + pagination; live airbnb.co.in shows city carousels instead).
- **assumption:** hover styles: card image zooms to 1.04 over 300ms; chips and secondary buttons darken their border to `#222`; text links underline.
- **assumption:** messaging, identity verification and real payments show "Coming soon".

## Phase 3 implementation notes
- **assumption:** the map is a static placeholder (price pills projected from lat/lng over a grid) until the stretch-goal interactive map; pins link to the listing.
- **assumption:** on phones the results page shows the placeholder map with the list in a rounded sheet over it (fixed, not draggable).
- **assumption:** home is a responsive grid (2 columns on phones at 165px cards, up to 6 at 1440) with a category row and numbered pagination (24 per page); results use 20 per page.
- **assumption:** the mobile "When?" step shows only the exact-dates calendar (no Flexible tab / ±N day chips).
- Login/sign-up is a modal on desktop; phones use the `/login` page (Phase 5).

## Phase 4 implementation notes (listing page)
- Layout measured from the reference: content 1120 wide; 5-photo grid 560/272/272 columns, 238/230 rows; sticky reserve column 373 wide at `top: 80px`; calendar cell 42px.
- The plain header (listing/utility pages) is in-flow, 96px, and scrolls away. A fixed section nav (Photos / Amenities / Reviews / Location) slides in after the gallery; it shows the reserve button once the sticky card is released at the end of its column.
- Stay (dates + guests) lives in the URL (`check_in`, `check_out`, `adults`, `children`, `infants`, `pets`), so it is shareable and survives reloads; search results pass it through to the listing.
- Blocked nights come from `/availability`: booked nights are struck through and a range may not cross one; checking out on the first booked night is allowed (back-to-back stays).
- **assumption:** guests picker is capped at the listing's max guests (adults + children), infants and pets are not counted.
- **assumption:** phones open a bottom sheet for dates (calendar first, collapsible guests row) from the sticky bar; the bar stacks price text above a full-width button.
- **assumption:** archived listings answer 410 and show "This listing is no longer available"; unknown or non-numeric ids show "We can't find that place".
- **assumption:** the location block is a static placeholder pin with "exact location shared after booking".
- **assumption:** "Message host" is shown disabled ("coming soon").

## Phase 5 implementation notes (booking, trips, wishlists, auth)
- **assumption:** the reserve page `/book/[id]` ("Confirm and pay") was never captured, so it follows the standard Airbnb layout: back arrow + title; left column = Your trip (dates and guests, each with an Edit link that opens a modal), Pay with (mocked card), Cancellation policy, Confirm and pay button; right column = sticky summary card (photo, title, rating, price breakdown from the server quote) at `top: 80px`, 373 wide from 950px up. On phones the listing summary sits at the top and Price details follows Your trip.
- **assumption:** payment is a demo: card number (13-19 digits), MM/YY, CVV (3-4 digits) and a 6-digit PIN code are format-checked only, never sent to the backend or stored.
- **assumption:** guards on `/book/[id]` show an in-page message instead of redirecting: logged out ("Log in to complete your booking" with the login button), own listing, and missing / malformed / reversed / past dates (link back to the listing). Unknown listings show "We can't find that place". Server errors on the quote (guest cap, pets, dates taken) show inline and disable the button.
- **assumption:** a 409 on Confirm shows an error toast with a "Back to listing" link plus a persistent inline notice, and disables the button until the dates change. Success replaces the URL with `/book/[id]/confirmed?booking=<id>` (a reload cannot double-book) showing a reference `SB000123` and a "View my trips" button.
- **assumption:** cancellation policy text matches the backend rule: free cancellation any time before check-in, none after.
- **assumption:** `/trips` has Upcoming / Past / Cancelled tabs (`?tab=`), booking cards with photo, dates, guests, total, reference. Cancel is offered only before check-in day and opens a confirm modal; a Past stay offers "Leave a review" (overall + six sub-ratings required, optional comment, one per booking) or "You reviewed this stay".
- **assumption:** `/wishlists` is the home grid with a heart that removes the card, an empty state ("No saved places yet"), and a login prompt when logged out.
- **assumption:** `/login` on phones is the same email + password form as the modal (the reference's single "phone or email" field and Google / Apple buttons are not built: no OAuth or phone auth). After logging in it returns to the page that asked (`?next=`) and runs the pending action, e.g. the heart.
- **assumption:** profile menu (logged in): Trips, Wishlists, Messages, Identity verification, Host dashboard (hosts only), Log out. Messages and Identity verification are "Coming soon" pages.
