"use client";

import { ChevronDown, ChevronUp, Star, X } from "lucide-react";
import { clsx } from "clsx";
import { useEffect, useRef, useState } from "react";
import { formatPrice, formatRange, fromISO, guestSummary } from "@/lib/format";
import type { QuoteState } from "@/lib/useStay";
import type { ListingDetail } from "@/lib/types";
import { DateRangeCalendar, type DateRange } from "../DateRangeCalendar";
import { GuestStepper, type Guests } from "../GuestStepper";
import { Modal } from "../ui/Modal";

const short = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const fmt = (iso: string | null) => (iso ? short.format(fromISO(iso)) : null);

type StayProps = {
  listing: ListingDetail;
  dates: DateRange;
  guests: Guests;
  nights: number;
  quote: QuoteState;
  onGuests: (g: Guests) => void;
  onReserve: () => void;
  onPickDates: () => void;
};

export function GuestsPicker({ listing, guests, onGuests }: Pick<StayProps, "listing" | "guests" | "onGuests">) {
  return (
    <div>
      <GuestStepper value={guests} onChange={onGuests} maxGuests={listing.max_guests} minAdults={1} />
      <p className="mt-2 text-sm text-ink-secondary">
        This place has a maximum of {listing.max_guests} guests, not including infants.
      </p>
    </div>
  );
}

/** Sticky desktop card: dates, guests, live price from the API, Reserve. */
export function ReserveCard({ listing, dates, guests, nights, quote, onGuests, onReserve, onPickDates }: StayProps) {
  const [guestsOpen, setGuestsOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const hasDates = !!(dates.start && dates.end);

  useEffect(() => {
    if (!guestsOpen) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setGuestsOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setGuestsOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [guestsOpen]);

  const summary = guestSummary(guests.adults, guests.children, guests.infants, guests.pets) || "1 guest";
  const q = quote.status === "ready" ? quote.quote : null;

  return (
    <div className="rounded-md bg-surface p-6 shadow-modal" data-testid="reserve-card">
      {hasDates ? (
        <p className="mb-5 text-xl font-medium">
          {formatPrice(listing.price_per_night)} <span className="text-base font-normal text-ink-secondary">night</span>
        </p>
      ) : (
        <p className="mb-5 text-xl font-medium">Add dates for prices</p>
      )}

      <div ref={box} className="relative">
        <div className="overflow-hidden rounded-sm border border-ink-muted">
          <div className="grid grid-cols-2">
            <button type="button" onClick={onPickDates} className="border-r border-ink-muted p-3 text-left hover:bg-surface-subtle">
              <span className="block text-2xs font-semibold uppercase">Check-in</span>
              <span className={clsx("block text-base", !dates.start && "text-ink-secondary")}>{fmt(dates.start) ?? "Add date"}</span>
            </button>
            <button type="button" onClick={onPickDates} className="p-3 text-left hover:bg-surface-subtle">
              <span className="block text-2xs font-semibold uppercase">Checkout</span>
              <span className={clsx("block text-base", !dates.end && "text-ink-secondary")}>{fmt(dates.end) ?? "Add date"}</span>
            </button>
          </div>
          <button
            type="button"
            aria-expanded={guestsOpen}
            onClick={() => setGuestsOpen((o) => !o)}
            className="flex w-full items-center justify-between border-t border-ink-muted p-3 text-left hover:bg-surface-subtle"
          >
            <span>
              <span className="block text-2xs font-semibold uppercase">Guests</span>
              <span className="block text-base">{summary}</span>
            </span>
            {guestsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
        {guestsOpen && (
          <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-md bg-surface p-5 shadow-modal">
            <GuestsPicker listing={listing} guests={guests} onGuests={onGuests} />
            <button type="button" onClick={() => setGuestsOpen(false)} className="mt-3 block w-full text-right text-base font-semibold underline">
              Close
            </button>
          </div>
        )}
      </div>

      {quote.status === "error" && (
        <p role="alert" className="mt-4 rounded-md bg-surface-subtle px-4 py-3 text-base text-brand-deep">
          {quote.message}
        </p>
      )}

      <button
        type="button"
        onClick={hasDates ? onReserve : onPickDates}
        disabled={hasDates && quote.status !== "ready"}
        className="mt-4 h-12 w-full rounded-full bg-brand-gradient text-md font-medium text-white transition-transform duration-200 ease-airy active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {hasDates ? "Reserve" : "Check availability"}
      </button>

      {hasDates && (
        <>
          <p className="mt-3 text-center text-base text-ink-secondary">You won’t be charged yet</p>
          <PriceBreakdown nights={nights} quote={q} loading={quote.status === "loading"} />
        </>
      )}
    </div>
  );
}

type QuoteValue = Extract<QuoteState, { status: "ready" }>["quote"] | null;

export function PriceBreakdown({ nights, quote, loading }: { nights: number; quote: QuoteValue; loading: boolean }) {
  if (!quote) {
    return loading ? <p className="mt-5 text-base text-ink-secondary">Calculating price…</p> : null;
  }
  const row = "flex justify-between py-1 text-md";
  return (
    <div className="mt-5" data-testid="price-breakdown">
      <div className={row}>
        <span className="underline">
          {formatPrice(quote.nightly_price)} × {nights} night{nights === 1 ? "" : "s"}
        </span>
        <span>{formatPrice(quote.subtotal)}</span>
      </div>
      <div className={row}>
        <span className="underline">Cleaning fee</span>
        <span>{formatPrice(quote.cleaning_fee)}</span>
      </div>
      <div className={row}>
        <span className="underline">Service fee</span>
        <span>{formatPrice(quote.service_fee)}</span>
      </div>
      <div className="mt-4 flex justify-between border-t border-line-soft pt-4 text-md font-semibold">
        <span>Total</span>
        <span>{formatPrice(quote.total)}</span>
      </div>
    </div>
  );
}
/* ───────── phones ───────── */

export function MobileReserveBar({ listing, dates, guests, nights, quote, onReserve, onPickDates }: StayProps) {
  const hasDates = !!(dates.start && dates.end);
  const q = quote.status === "ready" ? quote.quote : null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-surface px-6 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:hidden">
      {hasDates ? (
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-md font-semibold">{q ? `${formatPrice(q.total)} total` : formatPrice(listing.price_per_night)}</p>
          <button type="button" onClick={onPickDates} className="text-base underline">
            {formatRange(dates.start, dates.end)} · {nights} night{nights === 1 ? "" : "s"}
          </button>
        </div>
      ) : (
        <>
          <p className="text-md font-semibold">Add dates for prices</p>
          <p className="flex items-center gap-1 text-base text-ink-secondary">
            <Star size={12} className="fill-ink stroke-ink" /> {listing.avg_rating > 0 ? listing.avg_rating.toFixed(2) : "New"}
          </p>
        </>
      )}
      <button
        type="button"
        onClick={hasDates ? onReserve : onPickDates}
        disabled={hasDates && quote.status !== "ready"}
        className="mt-3 h-12 w-full rounded-full bg-brand-gradient text-md font-medium text-white disabled:opacity-50"
      >
        {hasDates ? "Reserve" : "Check availability"}
      </button>
      <span className="sr-only">{guestSummary(guests.adults, guests.children, guests.infants, guests.pets)}</span>
    </div>
  );
}

/** Bottom sheet with guests + a scrolling calendar (phones). */
export function MobileDatesSheet({
  open,
  onClose,
  listing,
  dates,
  guests,
  quote,
  onDates,
  onGuests,
  isNightBlocked,
}: {
  open: boolean;
  onClose: () => void;
  listing: ListingDetail;
  dates: DateRange;
  guests: Guests;
  quote: QuoteState;
  onDates: (r: DateRange) => void;
  onGuests: (g: Guests) => void;
  isNightBlocked: (iso: string) => boolean;
}) {
  const [guestsOpen, setGuestsOpen] = useState(false);
  const complete = !!(dates.start && dates.end);
  const nights = complete ? Math.round((fromISO(dates.end as string).getTime() - fromISO(dates.start as string).getTime()) / 86_400_000) : 0;
  const heading = complete ? `${nights} night${nights === 1 ? "" : "s"} in ${listing.city}` : dates.start ? "Select checkout date" : "Select check-in date";
  const summary = guestSummary(guests.adults, guests.children, guests.infants, guests.pets) || "1 guest";
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Dates"
      hideHeader
      variant="sheet"
      footer={
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="min-w-0 text-base">
            {quote.status === "ready" ? (
              <>
                <p className="text-md font-semibold">{formatPrice(quote.quote.total)} total</p>
                <p className="text-ink-secondary">{formatRange(dates.start, dates.end)}</p>
              </>
            ) : quote.status === "error" ? (
              <p className="text-brand-deep">{quote.message}</p>
            ) : (
              <>
                <p className="text-md font-semibold">Add dates for prices</p>
                <p className="flex items-center gap-1 text-ink-secondary">
                  <Star size={12} className="fill-ink stroke-ink" /> {listing.avg_rating > 0 ? listing.avg_rating.toFixed(2) : "New"}
                </p>
              </>
            )}
          </div>
          <button
            type="button"
            disabled={!complete || quote.status === "error"}
            onClick={onClose}
            className="h-12 shrink-0 rounded-md bg-ink px-8 text-md font-medium text-white disabled:bg-surface-control disabled:text-ink-disabled"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="px-6 pt-4">
        <div className="flex items-center justify-between">
          <button type="button" aria-label="Close" onClick={onClose} className="-ml-2 flex size-10 items-center justify-center rounded-full hover:bg-surface-control">
            <X size={18} />
          </button>
          <button type="button" disabled={!dates.start} onClick={() => onDates({ start: null, end: null })} className="text-base font-semibold underline disabled:text-ink-disabled disabled:no-underline">
            Clear dates
          </button>
        </div>
        <h3 className="mt-4 text-xl font-medium">{heading}</h3>
        <p className="mt-1 text-base text-ink-secondary">
          {complete ? `${fmt(dates.start)} – ${fmt(dates.end)}` : "Add your travel dates for exact pricing"}
        </p>

        <div className="mt-6 rounded-md border border-line">
          <button type="button" aria-expanded={guestsOpen} onClick={() => setGuestsOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-3 text-left">
            <span>
              <span className="block text-2xs font-semibold uppercase">Guests</span>
              <span className="block text-base">{summary}</span>
            </span>
            {guestsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {guestsOpen && (
            <div className="border-t border-line px-4 pb-4">
              <GuestsPicker listing={listing} guests={guests} onGuests={onGuests} />
            </div>
          )}
        </div>

        <DateRangeCalendar value={dates} onChange={onDates} isNightBlocked={isNightBlocked} vertical cell={44} className="mx-auto mt-6 w-fit pb-8" />
      </div>
    </Modal>
  );
}

/* ───────── inline calendar section (desktop) ───────── */

export function AvailabilitySection({
  listing,
  dates,
  nights,
  onDates,
  isNightBlocked,
}: {
  listing: ListingDetail;
  dates: DateRange;
  nights: number;
  onDates: (r: DateRange) => void;
  isNightBlocked: (iso: string) => boolean;
}) {
  const heading = dates.start && dates.end ? `${nights} night${nights === 1 ? "" : "s"} in ${listing.city}` : dates.start ? "Select checkout date" : "Select check-in date";
  const sub = dates.start && dates.end ? `${fmt(dates.start)} – ${fmt(dates.end)}` : "Add your travel dates for exact pricing";
  return (
    <section id="calendar" className="hidden scroll-mt-24 border-b border-line-soft py-12 md:block">
      <h2 className="text-xl font-medium">{heading}</h2>
      <p className="mb-8 mt-1 text-base text-ink-secondary">{sub}</p>
      <DateRangeCalendar value={dates} onChange={onDates} isNightBlocked={isNightBlocked} cell={42} responsiveMonths />
      <div className="mt-4 text-right">
        <button
          type="button"
          disabled={!dates.start}
          onClick={() => onDates({ start: null, end: null })}
          className="rounded-md px-3 py-2 text-base font-semibold underline disabled:text-ink-disabled disabled:no-underline"
        >
          Clear dates
        </button>
      </div>
    </section>
  );
}
