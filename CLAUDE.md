# staybnb — Airbnb clone (assignment)

Spec: `Assignment Airbnb Clone.md`. Design reference: `design-ref/` (screenshots + `design-tokens.md` + `ux-notes.md`).

## Stack
- `frontend/` — Next.js (App Router) + TypeScript + Tailwind CSS. Port 3000. API base URL from `NEXT_PUBLIC_API_URL`.
- `backend/` — FastAPI + SQLAlchemy 2.0 + Pydantic v2 + SQLite (`DATABASE_URL`). Port 8000. Tests with pytest.
- Deploy: frontend on Vercel, backend on Railway with a volume mounted at `/data` (`DATABASE_URL=sqlite:////data/app.db`).

## Rules
1. **Tokens only.** Colours, radii, shadows, type scale, spacing, easing and breakpoints come only from
   `design-ref/design-tokens.md`, exposed as Tailwind theme keys in `frontend/src/app/globals.css`.
   Do not hard-code hex/px values in components; add a token first if one is missing.
2. **Visual check every page.** After building a page, run the dev servers (`.claude/launch.json`) and open
   localhost:3000 in the built-in browser. Screenshot at 1440x900 and 390x844 and compare with the matching
   `design-ref/<page>-<width>.png`. List the differences, fix all of them, re-screenshot, and only then call the page done.
   The 1440 references are downscaled to 800px wide; check exact values against `design-tokens.md`.
3. **No copied Airbnb assets.** No Airbnb code, logo, fonts, icons or images.
   - Wordmark: text "staybnb" in the brand colour.
   - Font: DM Sans via `next/font/google` (free, close to Airbnb Cereal).
   - Images: Unsplash URLs (`images.unsplash.com`).
   - Icons: lucide-react or hand-made SVGs.
4. **Unverified UX.** Items in `design-ref/ux-notes.md` marked `assumption:` follow standard Airbnb patterns.
   Keep them labelled "assumption" and update the note if the chosen pattern changes.
5. **Commit after each phase** of the plan, conventional commit messages.
6. **Backend owns business rules**: availability/overlap checks, pricing and authorisation. The frontend
   displays the backend quote and never computes the charged total itself.
7. **Seed data** must make the app usable immediately (`python -m app.seed`). Every Unsplash URL is verified to return
   HTTP 200 and failures are dropped; never invent photo IDs. The verified list is cached in
   `backend/app/seed_data/photos.json` so seeding is deterministic and works offline.
8. **Secrets via env.** JWT secret, token expiry and CORS origins come from env vars. Never commit `.env`.
9. **SQLite discipline.** Run uvicorn with a single worker. WAL mode + `busy_timeout` are on. The booking
   transaction uses `BEGIN IMMEDIATE` (set via the `begin` event with `isolation_level=None`) and has a concurrency test.
10. **Maps.** Phases 3-4 use a static map placeholder. The interactive Leaflet price-pin map is a stretch goal, only after Phase 7.
11. **Reference screenshots stay local.** `design-ref/*` is gitignored except `design-tokens.md` and `ux-notes.md`.
12. **Time buffer.** If any phase runs over by more than 15 minutes, stop and tell the user what will be cut.

## Commands
- Backend: `cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000`; tests: `pytest`; seed: `python -m app.seed`
- Frontend: `cd frontend && npm run dev`; checks: `npm run lint && npm run build`

## Domain rules (reference)
- Overlap: a confirmed booking conflicts when `existing.check_in < new.check_out AND existing.check_out > new.check_in`
  (check-out day is free for the next check-in). Check + insert happen in one transaction.
- Price: subtotal = nightly × nights; + cleaning fee; + service fee 14% of subtotal. Amounts are integer rupees.
- Reviews: only by the booking's guest, after check-out, one per booking.
- Deleting a listing with future confirmed bookings returns 409.
