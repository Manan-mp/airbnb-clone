"use client";

import { Share, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { formatRating } from "@/lib/format";
import type { ListingDetail } from "@/lib/types";
import { useScrollFrame } from "@/lib/useScrollFrame";
import { useBlockedNights, useQuote, useStay } from "@/lib/useStay";
import { useAuth } from "../AuthProvider";
import { Footer } from "../Footer";
import { Header } from "../Header";
import { SaveButton } from "../HeartButton";
import { MobileHero, PhotoGrid } from "./Gallery";
import { PhotoTour } from "./PhotoTour";
import { AvailabilitySection, MobileDatesSheet, MobileReserveBar, ReserveCard } from "./Reserve";
import { AmenitiesSection, Avatar, HostSection, LocationSection, ReviewsSection, ThingsToKnow } from "./Sections";
import { SectionNav } from "./SectionNav";
import { useShare } from "./share";

type Load =
  | { id: string; status: "ok"; listing: ListingDetail }
  | { id: string; status: "missing" | "gone" | "error"; message: string };

export function ListingPage({ id }: { id: string }) {
  const [load, setLoad] = useState<Load | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .listing(id)
      .then((listing) => !cancelled && setLoad({ id, status: "ok", listing }))
      .catch((e: unknown) => {
        if (cancelled) return;
        const status = e instanceof ApiError ? e.status : 0;
        setLoad({
          id,
          status: status === 404 || status === 422 ? "missing" : status === 410 ? "gone" : "error", // 422: id is not a number
          message: e instanceof Error ? e.message : "Something went wrong",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  const current = load && load.id === id ? load : null;
  if (!current) return <Shell><ListingSkeleton /></Shell>;
  if (current.status === "ok") return <ListingContent listing={current.listing} />;

  const copy = {
    missing: { title: "We can’t find that place", body: "The link may be wrong, or the listing never existed." },
    gone: { title: "This listing is no longer available", body: "The host has removed it. There are plenty of other places to stay." },
    error: { title: "We couldn’t load this listing", body: current.message },
  }[current.status];
  return (
    <Shell>
      <div className="mx-auto max-w-[560px] px-6 py-24 text-center" data-testid="listing-unavailable">
        <h1 className="text-2xl font-semibold">{copy.title}</h1>
        <p className="mt-3 text-md text-ink-secondary">{copy.body}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="rounded-md bg-ink px-6 py-3.5 text-md font-medium text-white">
            Browse stays
          </Link>
          {current.status === "error" && (
            <button type="button" onClick={() => { setLoad(null); setAttempt((n) => n + 1); }} className="rounded-md border border-ink px-6 py-3.5 text-md font-medium">
              Try again
            </button>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header variant="plain" />
      {children}
      <Footer />
    </>
  );
}

function ListingSkeleton() {
  return (
    <div className="mx-auto max-w-content px-6 pt-8 md:px-8 xl:px-0" aria-busy="true" aria-label="Loading listing">
      <div className="mb-6 h-8 w-1/2 animate-pulse rounded-xs bg-surface-control" />
      <div className="aspect-[390/347] animate-pulse rounded-md bg-surface-control md:aspect-gallery" />
      <div className="mt-8 h-6 w-1/3 animate-pulse rounded-xs bg-surface-control" />
    </div>
  );
}

function ListingContent({ listing }: { listing: ListingDetail }) {
  const router = useRouter();
  const { user, requestLogin } = useAuth();
  const share = useShare(listing.title);
  const stay = useStay(listing);
  const quote = useQuote(listing.id, stay.dates, stay.guests);
  const { isNightBlocked } = useBlockedNights(listing.id);
  const [tour, setTour] = useState<number | null>(null);
  const [datesSheet, setDatesSheet] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [nav, setNav] = useState({ visible: false, active: "photos", reserveOut: false });
  const galleryRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `${listing.title} · ${listing.city} | staybnb`;
  }, [listing.title, listing.city]);

  // Scroll-driven bits: nav visibility (hysteresis), active section, reserve CTA in the nav.
  useScrollFrame(() => {
    const y = window.scrollY;
    const gallery = galleryRef.current;
    const galleryBottom = gallery ? gallery.getBoundingClientRect().bottom + y : 600;
    let active = "photos";
    for (const id of ["amenities", "reviews", "location"]) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= 140) active = id;
    }
    const col = columnRef.current?.getBoundingClientRect();
    const cardH = cardRef.current?.getBoundingClientRect().height ?? 0;
    const reserveOut = col ? col.bottom - cardH <= 100 : false;
    setNav((prev) => {
      const visible = prev.visible ? y > galleryBottom - 80 : y > galleryBottom - 20;
      return prev.visible === visible && prev.active === active && prev.reserveOut === reserveOut ? prev : { visible, active, reserveOut };
    });
  });

  const hasDates = !!(stay.dates.start && stay.dates.end);
  const stayQuery = new URLSearchParams();
  if (stay.dates.start) stayQuery.set("check_in", stay.dates.start);
  if (stay.dates.end) stayQuery.set("check_out", stay.dates.end);
  stayQuery.set("adults", String(stay.guests.adults));
  for (const k of ["children", "infants", "pets"] as const) if (stay.guests[k]) stayQuery.set(k, String(stay.guests[k]));

  const goBook = () => router.push(`/book/${listing.id}?${stayQuery.toString()}`);
  const onReserve = () => (user ? goBook() : requestLogin(goBook));
  const pickDatesDesktop = () => document.getElementById("calendar")?.scrollIntoView({ behavior: "smooth", block: "center" });
  const pickDatesMobile = () => setDatesSheet(true);

  const roomLabel = listing.room_type === "entire_home" ? "Entire home" : listing.room_type === "private_room" ? "Private room" : "Shared room";
  const stats = `${listing.max_guests} guests · ${listing.bedrooms} bedroom${listing.bedrooms === 1 ? "" : "s"} · ${listing.beds} bed${listing.beds === 1 ? "" : "s"} · ${listing.bathrooms} bathroom${listing.bathrooms === 1 ? "" : "s"}`;
  const stayProps = { listing, dates: stay.dates, guests: stay.guests, nights: stay.nights, quote, onGuests: stay.setGuests, onReserve };

  return (
    <div className="-mb-[65px] md:mb-0">
      <Header variant="plain" hideMobile />
      <SectionNav
        visible={nav.visible}
        active={nav.active}
        showReserve={nav.reserveOut}
        listing={listing}
        hasDates={hasDates}
        onReserve={hasDates ? onReserve : pickDatesDesktop}
      />

      <main className="mx-auto max-w-content pb-40 md:px-8 md:pb-0 xl:px-0">
        {/* title row + gallery (desktop) */}
        <div className="hidden pt-5 md:block">
          <div className="mb-[26px] flex items-end justify-between gap-4">
            <h1 className="text-2xl font-medium">{listing.title}</h1>
            <div className="flex shrink-0 items-center">
              <button type="button" onClick={share} className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium underline transition-colors duration-150 ease-airy hover:bg-surface-control">
                <Share size={16} /> Share
              </button>
              <SaveButton listingId={listing.id} wishlisted={listing.is_wishlisted} />
            </div>
          </div>
          <div ref={galleryRef}>
            <PhotoGrid photos={listing.photo_details} title={listing.title} onOpen={(i) => setTour(Math.max(i, 0))} />
          </div>
        </div>
        <MobileHero listing={listing} onOpen={() => setTour(0)} />

        <div className="relative -mt-6 rounded-t-modal bg-surface px-6 pt-8 md:mt-0 md:rounded-none md:px-0 md:pt-8">
          <h1 className="mb-6 text-center text-2xl font-medium md:hidden">{listing.title}</h1>

          <div className="grid gap-x-24 md:grid-cols-[minmax(0,1fr)_var(--container-reserve)]">
            <div className="min-w-0">
              <div className="border-b border-line-soft pb-6 text-center md:text-left">
                <h2 className="text-xl font-medium">
                  {roomLabel} in {listing.city}, {listing.country}
                </h2>
                <p className="mt-1 text-md text-ink-secondary">{stats}</p>
              </div>

              {(listing.is_guest_favourite || listing.review_count > 0) && (
                <div className="my-6 flex items-center justify-around rounded-md border border-line px-4 py-4 text-center">
                  {listing.is_guest_favourite && (
                    <>
                      <p className="w-24 text-lg font-bold leading-tight">Guest favourite</p>
                      <p className="hidden max-w-[220px] text-base font-medium md:block">One of the most loved homes, according to guests</p>
                    </>
                  )}
                  <div>
                    <p className="text-xl font-bold">{formatRating(listing.avg_rating)}</p>
                    <Stars5 value={listing.avg_rating} />
                  </div>
                  <div className="border-l border-line pl-6">
                    <p className="text-xl font-bold">{listing.review_count}</p>
                    <p className="text-xs">Reviews</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 border-b border-line-soft py-6">
                <Avatar name={listing.host.name} url={listing.host.avatar_url} />
                <div>
                  <p className="text-md font-medium">Hosted by {listing.host.name}</p>
                  <p className="text-base text-ink-secondary">
                    {listing.host.is_superhost ? "Superhost · " : ""}Hosting since {listing.host_since}
                  </p>
                </div>
              </div>

              <div className="border-b border-line-soft py-8">
                <p className={`whitespace-pre-line text-md ${descOpen ? "" : "line-clamp-5"}`}>{listing.description}</p>
                {!descOpen && listing.description.length > 260 && (
                  <button type="button" onClick={() => setDescOpen(true)} className="mt-3 text-md font-semibold underline">
                    Show more
                  </button>
                )}
              </div>

              <AmenitiesSection amenities={listing.amenities} />
              <AvailabilitySection listing={listing} dates={stay.dates} nights={stay.nights} onDates={stay.setDates} isNightBlocked={isNightBlocked} />
            </div>

            <div ref={columnRef} className="hidden md:block">
              <div ref={cardRef} className="sticky top-[var(--spacing-header-compact)] pb-12 pt-4">
                <ReserveCard {...stayProps} onPickDates={pickDatesDesktop} />
              </div>
            </div>
          </div>

          <ReviewsSection listing={listing} />
          <LocationSection listing={listing} />
          <HostSection listing={listing} />
          <ThingsToKnow listing={listing} />
        </div>
      </main>

      <MobileReserveBar {...stayProps} onPickDates={pickDatesMobile} />
      <MobileDatesSheet
        open={datesSheet}
        onClose={() => setDatesSheet(false)}
        listing={listing}
        dates={stay.dates}
        guests={stay.guests}
        quote={quote}
        onDates={stay.setDates}
        onGuests={stay.setGuests}
        isNightBlocked={isNightBlocked}
      />
      {tour !== null && <PhotoTour listing={listing} startIndex={tour} onClose={() => setTour(null)} />}
      <Footer />
    </div>
  );
}

function Stars5({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={10} className={i < Math.round(value) ? "fill-ink" : "fill-line stroke-line"} />
      ))}
    </span>
  );
}
