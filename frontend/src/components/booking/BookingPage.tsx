"use client";

import { ArrowLeft, CalendarX, Lock, Star, TriangleAlert, UserX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { formatDay, formatPrice, fromISO, guestSummary, toISO, formatRating } from "@/lib/format";
import type { ListingDetail } from "@/lib/types";
import { useBlockedNights, useQuote, useStay } from "@/lib/useStay";
import { useAuth } from "../AuthProvider";
import { Footer } from "../Footer";
import { Header } from "../Header";
import { StatePanel } from "../StatePanel";
import { PriceBreakdown } from "../listing/Reserve";
import { useToast } from "../ui/Toast";
import { CardForm } from "./CardForm";
import { validateCard, type CardErrors, type CardFields } from "./cardFormat";
import { DatesModal, GuestsModal } from "./EditModals";
import { SafeImg } from "@/components/ui/SafeImg";

type Load =
  | { id: string; status: "ok"; listing: ListingDetail }
  | { id: string; status: "missing" | "gone" | "error"; message: string };

export function BookingPage({ id }: { id: string }) {
  const [load, setLoad] = useState<Load | null>(null);

  useEffect(() => {
    document.title = "Confirm and pay | staybnb";
    let cancelled = false;
    api
      .listing(id)
      .then((listing) => !cancelled && setLoad({ id, status: "ok", listing }))
      .catch((e: unknown) => {
        if (cancelled) return;
        const status = e instanceof ApiError ? e.status : 0;
        setLoad({
          id,
          status: status === 404 || status === 422 ? "missing" : status === 410 ? "gone" : "error",
          message: e instanceof Error ? e.message : "Something went wrong",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const current = load && load.id === id ? load : null;
  if (!current) return <Shell><Skeleton /></Shell>;
  if (current.status !== "ok") {
    return (
      <Shell>
        <StatePanel
          icon={TriangleAlert}
          title={current.status === "gone" ? "This listing is no longer available" : current.status === "missing" ? "We can’t find that place" : "We couldn’t load this listing"}
          body={current.status === "error" ? current.message : undefined}
          action={{ label: "Browse stays", href: "/" }}
          testId="book-listing-error"
        />
      </Shell>
    );
  }
  return <BookingContent listing={current.listing} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mb-[65px] md:mb-0">
      <Header variant="plain" hideMobile />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-content px-6 pt-8 md:px-8 xl:px-0" aria-busy="true" aria-label="Loading">
      <div className="mb-8 h-8 w-1/3 animate-pulse rounded-xs bg-surface-control" />
      <div className="h-64 animate-pulse rounded-md bg-surface-control" />
    </div>
  );
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const validISO = (s: string | null): s is string => !!s && ISO.test(s) && toISO(fromISO(s)) === s;

function BookingContent({ listing }: { listing: ListingDetail }) {
  const router = useRouter();
  const toast = useToast();
  const { user, ready, requestLogin } = useAuth();
  const stay = useStay(listing);
  const { isNightBlocked } = useBlockedNights(listing.id);

  const { start, end } = stay.dates;
  const datesState: "missing" | "invalid" | "ok" =
    !start || !end ? "missing" : !validISO(start) || !validISO(end) || end <= start || start < toISO(new Date()) ? "invalid" : "ok";
  const isOwn = !!user && listing.host.id === user.id;
  const canBook = ready && !!user && !isOwn && datesState === "ok";
  const quote = useQuote(canBook ? listing.id : null, stay.dates, stay.guests);

  const [card, setCard] = useState<CardFields>({ number: "", expiry: "", cvv: "", pin: "" });
  const [errors, setErrors] = useState<CardErrors>({});
  const [busy, setBusy] = useState(false);
  const [conflictFor, setConflictFor] = useState<string | null>(null);
  const [editing, setEditing] = useState<"dates" | "guests" | null>(null);

  const stayQuery = new URLSearchParams();
  if (start) stayQuery.set("check_in", start);
  if (end) stayQuery.set("check_out", end);
  stayQuery.set("adults", String(stay.guests.adults));
  for (const k of ["children", "infants", "pets"] as const) if (stay.guests[k]) stayQuery.set(k, String(stay.guests[k]));
  const listingHref = `/rooms/${listing.id}${datesState === "ok" ? `?${stayQuery.toString()}` : ""}`;

  if (!ready) return <Shell><Skeleton /></Shell>;
  if (!user) {
    return (
      <Shell>
        <StatePanel
          icon={Lock}
          title="Log in to complete your booking"
          body="You need an account to reserve this place. Your trip details will be waiting for you."
          action={{ label: "Log in or sign up", onClick: () => requestLogin() }}
          testId="book-login"
        />
      </Shell>
    );
  }
  if (isOwn) {
    return (
      <Shell>
        <StatePanel icon={UserX} title="You can’t book your own listing" body="Switch to a guest account to make a reservation, or view your listing." action={{ label: "View listing", href: `/rooms/${listing.id}` }} testId="book-own" />
      </Shell>
    );
  }
  if (datesState !== "ok") {
    return (
      <Shell>
        <StatePanel
          icon={CalendarX}
          title={datesState === "missing" ? "Choose your dates first" : "Those dates don’t look right"}
          body={datesState === "missing" ? "Pick a check-in and check-out date on the listing page, then reserve." : "Check-in can’t be in the past and check-out must come after it. Pick your dates again on the listing."}
          action={{ label: "Back to the listing", href: `/rooms/${listing.id}` }}
          testId="book-dates"
        />
      </Shell>
    );
  }

  const dateKey = `${start}|${end}`;
  const conflict = conflictFor === dateKey;
  const q = quote.status === "ready" ? quote.quote : null;
  const room = listing.room_type === "entire_home" ? "Entire home" : listing.room_type === "private_room" ? "Private room" : "Shared room";
  const guestText = guestSummary(stay.guests.adults, stay.guests.children, stay.guests.infants, stay.guests.pets) || "1 guest";

  async function confirm() {
    const found = validateCard(card);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      document.querySelector("[data-testid=card-form]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!start || !end) return;
    setBusy(true);
    try {
      const b = await api.createBooking({
        listing_id: listing.id,
        check_in: start,
        check_out: end,
        adults: stay.guests.adults,
        children: stay.guests.children,
        infants: stay.guests.infants,
        pets: stay.guests.pets,
      });
      router.replace(`/book/${listing.id}/confirmed?booking=${b.id}`);
    } catch (e) {
      setBusy(false);
      if (e instanceof ApiError && e.status === 409) {
        setConflictFor(dateKey);
        toast.show(e.message, "error", { label: "Back to listing", href: `/rooms/${listing.id}` });
      } else if (e instanceof ApiError && e.status === 401) {
        toast.show("Your session expired. Please log in again.", "error");
        requestLogin();
      } else {
        toast.show(e instanceof ApiError ? e.message : "Couldn’t complete your booking. Please try again.", "error");
      }
    }
  }

  const mini = (
    <div className="flex gap-4">
      <div className="aspect-card w-28 shrink-0 overflow-hidden rounded-sm bg-surface-control">
        {listing.photos[0] && <SafeImg src={listing.photos[0]} width={400} alt="" className="size-full object-cover" />}
      </div>
      <div className="min-w-0">
        <p className="text-base text-ink-secondary">{room}</p>
        <h2 className="line-clamp-2 text-md font-medium">{listing.title}</h2>
        <p className="mt-1 flex items-center gap-1 text-base">
          <Star size={12} className="fill-ink stroke-ink" /> {formatRating(listing.avg_rating)}
          {listing.review_count > 0 && <span className="text-ink-secondary">({listing.review_count})</span>}
        </p>
      </div>
    </div>
  );
  const price = (
    <>
      <PriceBreakdown nights={stay.nights} quote={q} loading={quote.status === "loading"} />
      {quote.status === "error" && <p className="mt-4 text-base text-brand-deep">{quote.message}</p>}
    </>
  );
  const section = "border-t border-line-soft py-8";
  const edit = "text-md font-semibold underline transition-colors duration-150 ease-airy hover:text-ink-secondary";

  return (
    <div className="-mb-[65px] md:mb-0">
      <Header variant="plain" hideMobile />
      <main className="mx-auto max-w-content px-6 pb-12 pt-6 md:px-8 md:pt-10 xl:px-0">
        <div className="mb-6 flex items-center gap-4 md:mb-10">
          <button
            type="button"
            aria-label="Back"
            onClick={() => (window.history.length > 1 ? router.back() : router.push(listingHref))}
            className="-ml-2 flex size-10 items-center justify-center rounded-full transition-colors duration-200 ease-airy hover:bg-surface-control"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold">Confirm and pay</h1>
        </div>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_var(--container-reserve)] lg:gap-x-12 xl:gap-x-24">
          <div className="min-w-0">
            <div className="mb-8 border-b border-line-soft pb-8 lg:hidden">{mini}</div>
            <section aria-labelledby="trip-h" className="pb-8">
              <h2 id="trip-h" className="mb-4 text-xl font-semibold">Your trip</h2>
              <div className="flex items-start justify-between gap-4 py-2">
                <div>
                  <h3 className="text-md font-medium">Dates</h3>
                  <p className="text-md text-ink-secondary" data-testid="trip-dates">
                    {formatDay(start as string)} – {formatDay(end as string)} · {stay.nights} night{stay.nights === 1 ? "" : "s"}
                  </p>
                </div>
                <button type="button" onClick={() => setEditing("dates")} className={edit}>Edit</button>
              </div>
              <div className="flex items-start justify-between gap-4 py-2">
                <div>
                  <h3 className="text-md font-medium">Guests</h3>
                  <p className="text-md text-ink-secondary" data-testid="trip-guests">{guestText}</p>
                </div>
                <button type="button" onClick={() => setEditing("guests")} className={edit}>Edit</button>
              </div>
            </section>

            <section aria-labelledby="price-h" className={`${section} lg:hidden`}>
              <h2 id="price-h" className="text-xl font-semibold">Price details</h2>
              {price}
            </section>

            <section aria-labelledby="pay-h" className={section}>
              <h2 id="pay-h" className="mb-4 text-xl font-semibold">Pay with</h2>
              <CardForm value={card} onChange={(v) => setCard(v)} errors={errors} />
            </section>

            <section aria-labelledby="policy-h" className={section}>
              <h2 id="policy-h" className="mb-2 text-xl font-semibold">Cancellation policy</h2>
              <p className="text-md">
                <span className="font-semibold">Free cancellation before check-in on {formatDay(start as string)}.</span> You can cancel
                this booking any time before you arrive. After check-in begins it can’t be cancelled.
              </p>
            </section>

            <section className={section}>
              <p className="text-base text-ink-secondary">
                By selecting the button below, I agree to the host’s house rules and to staybnb’s terms. This is a demo: no payment is taken.
              </p>
              {conflict && (
                <div role="alert" className="mt-4 flex gap-3 rounded-md bg-surface-subtle p-4 text-md" data-testid="book-conflict">
                  <TriangleAlert size={20} className="mt-0.5 shrink-0 text-brand-deep" />
                  <p>
                    Those dates were just booked by someone else.{" "}
                    <Link href={`/rooms/${listing.id}`} className="font-semibold underline">Back to the listing</Link> to pick new dates.
                  </p>
                </div>
              )}
              {quote.status === "error" && (
                <p role="alert" className="mt-4 text-md text-brand-deep" data-testid="book-quote-error">
                  {quote.message}. Change your dates or guests to continue.
                </p>
              )}
              <button
                type="button"
                onClick={confirm}
                disabled={busy || quote.status !== "ready" || conflict}
                className="mt-6 h-14 w-full rounded-md bg-brand-gradient text-md font-medium text-white transition-transform duration-200 ease-airy active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 md:w-auto md:px-12"
              >
                {busy ? "Confirming…" : q ? `Confirm and pay · ${formatPrice(q.total)}` : "Confirm and pay"}
              </button>
            </section>
          </div>

          <aside className="hidden lg:block">
            <div className="rounded-md border border-line p-6 lg:sticky lg:top-[var(--spacing-header-compact)]" data-testid="summary-card">
              <div className="border-b border-line-soft pb-6">{mini}</div>
              <h2 className="mt-6 text-xl font-semibold">Price details</h2>
              {price}
            </div>
          </aside>
        </div>
      </main>
      <Footer />

      <DatesModal open={editing === "dates"} onClose={() => setEditing(null)} value={stay.dates} isNightBlocked={isNightBlocked} onSave={stay.setDates} />
      <GuestsModal open={editing === "guests"} onClose={() => setEditing(null)} listing={listing} value={stay.guests} onSave={stay.setGuests} />
    </div>
  );
}
