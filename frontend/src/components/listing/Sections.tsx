"use client";

import { Home, Star, UserRound } from "lucide-react";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AmenityIcon } from "@/lib/amenityIcons";
import { formatRating } from "@/lib/format";
import type { Amenity, ListingDetail, Review, ReviewPage } from "@/lib/types";
import { MapBackdrop } from "../MapBackdrop";
import { Pagination } from "../Pagination";
import { Modal } from "../ui/Modal";

export const section = "border-b border-line-soft py-8 md:py-12";
export const sectionTitle = "text-xl font-medium";

export function Avatar({ name, url, size = 48 }: { name: string; url: string | null; size?: number }) {
  return url ? (
    <img src={url} alt="" style={{ width: size, height: size }} className="shrink-0 rounded-full object-cover" />
  ) : (
    <span
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-ink font-medium text-white"
      aria-hidden
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function Stars({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size} className={i < Math.round(value) ? "fill-ink" : "fill-line stroke-line"} />
      ))}
    </span>
  );
}

/* ───────── amenities ───────── */

const GROUP_TITLES: Record<string, string> = { essentials: "Essentials", features: "Features", safety: "Safety" };

export function AmenitiesSection({ amenities }: { amenities: Amenity[] }) {
  const [open, setOpen] = useState(false);
  const shown = amenities.slice(0, 10);
  const groups = Object.entries(Object.groupBy(amenities, (a) => a.group));
  return (
    <section id="amenities" className={clsx(section, "scroll-mt-24")}>
      <h2 className={clsx(sectionTitle, "mb-6")}>What this place offers</h2>
      <ul className="grid gap-x-8 gap-y-5 md:grid-cols-2">
        {shown.map((a) => (
          <li key={a.id}>
            <AmenityRow amenity={a} />
          </li>
        ))}
      </ul>
      {amenities.length > shown.length && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-8 w-full rounded-sm bg-surface-control py-3.5 text-md font-medium transition-colors duration-200 ease-airy hover:bg-line-soft md:w-auto md:px-6"
        >
          Show all {amenities.length} amenities
        </button>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="What this place offers" variant="sheet" className="md:w-[780px]">
        <div className="px-6 pb-8 pt-6 md:px-8">
          {groups.map(([group, items]) => (
            <div key={group} className="mb-8 last:mb-0">
              <h3 className="mb-2 text-lg font-medium">{GROUP_TITLES[group] ?? group}</h3>
              <ul>
                {items?.map((a) => (
                  <li key={a.id} className="border-b border-line-soft py-4 last:border-0">
                    <AmenityRow amenity={a} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Modal>
    </section>
  );
}

function AmenityRow({ amenity }: { amenity: Amenity }) {
  return (
    <div className="flex items-center gap-4 text-md">
      <AmenityIcon name={amenity.icon_key} className="shrink-0" />
      {amenity.name}
    </div>
  );
}

/* ───────── reviews ───────── */

const monthYear = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" });
const CATEGORY_ROWS: [keyof NonNullable<ListingDetail["rating_breakdown"]>, string][] = [
  ["cleanliness", "Cleanliness"],
  ["accuracy", "Accuracy"],
  ["check_in", "Check-in"],
  ["communication", "Communication"],
  ["location", "Location"],
  ["value", "Value"],
];

export function ReviewsSection({ listing }: { listing: ListingDetail }) {
  const [first, setFirst] = useState<ReviewPage | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .reviews(listing.id, 1, 6)
      .then((p) => !cancelled && setFirst(p))
      .catch(() => !cancelled && setFirst({ items: [], total: 0, page: 1, page_size: 6 }));
    return () => {
      cancelled = true;
    };
  }, [listing.id]);

  if (listing.review_count === 0) {
    return (
      <section id="reviews" className={clsx(section, "scroll-mt-24")}>
        <h2 className={sectionTitle}>No reviews (yet)</h2>
        <p className="mt-2 text-md text-ink-secondary">Reviews appear here after guests complete a stay.</p>
      </section>
    );
  }

  return (
    <section id="reviews" className={clsx(section, "scroll-mt-24")}>
      <RatingSummary listing={listing} />
      <div className="mt-10 grid gap-x-16 gap-y-10 md:grid-cols-2">
        {first?.items.map((r) => <ReviewCard key={r.id} review={r} />)}
      </div>
      {listing.review_count > 6 && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-10 w-full rounded-sm bg-surface-control py-3.5 text-md font-medium transition-colors duration-200 ease-airy hover:bg-line-soft md:w-auto md:px-6"
        >
          Show all {listing.review_count} reviews
        </button>
      )}
      <ReviewsModal listing={listing} open={open} onClose={() => setOpen(false)} />
    </section>
  );
}

function RatingSummary({ listing }: { listing: ListingDetail }) {
  const total = Math.max(listing.review_count, 1);
  const b = listing.rating_breakdown;
  return (
    <div>
      <div className="mb-10 text-center">
        <div className="text-hero font-medium leading-none">{formatRating(listing.avg_rating)}</div>
        {listing.is_guest_favourite ? (
          <>
            <p className="mt-4 text-2xl font-bold">Guest favourite</p>
            <p className="mx-auto mt-2 max-w-[360px] text-md text-ink-secondary">
              This home is a guest favourite based on ratings, reviews and reliability
            </p>
          </>
        ) : (
          <p className="mt-4 text-xl font-medium">{listing.review_count} reviews</p>
        )}
      </div>
      <div className="grid gap-6 border-y border-line-soft py-6 md:grid-cols-[1.4fr_repeat(6,1fr)] md:gap-0">
        <div className="md:pr-6">
          <p className="mb-2 text-sm font-medium">Overall rating</p>
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-2">{star}</span>
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-line-soft">
                <span className="block h-full bg-ink" style={{ width: `${((listing.rating_counts[String(star)] ?? 0) / total) * 100}%` }} />
              </span>
            </div>
          ))}
        </div>
        {b &&
          CATEGORY_ROWS.map(([key, label]) => (
            <div key={key} className="flex items-center justify-between md:block md:border-l md:border-line-soft md:px-5">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xl font-medium md:mt-1">{b[key].toFixed(1)}</p>
            </div>
          ))}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const long = review.comment.length > 180;
  return (
    <article>
      <div className="mb-3 flex items-center gap-3">
        <Avatar name={review.author.name} url={review.author.avatar_url} />
        <div>
          <p className="text-md font-medium">{review.author.name}</p>
          <p className="text-base text-ink-secondary">Joined {new Date(review.author.created_at).getFullYear()}</p>
        </div>
      </div>
      <div className="mb-2 flex items-center gap-2 text-sm">
        <Stars value={review.rating} />
        <span aria-hidden>·</span>
        <span>{monthYear.format(new Date(review.created_at))}</span>
      </div>
      <p className={clsx("text-md", !expanded && "line-clamp-4")}>{review.comment || "No comment."}</p>
      {long && !expanded && (
        <button type="button" onClick={() => setExpanded(true)} className="mt-2 text-md font-semibold underline">
          Show more
        </button>
      )}
    </article>
  );
}

function ReviewsModal({ listing, open, onClose }: { listing: ListingDetail; open: boolean; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ReviewPage | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    api
      .reviews(listing.id, page, 10)
      .then((d) => !cancelled && setData(d))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, page, listing.id]);

  return (
    <Modal open={open} onClose={onClose} title={`${formatRating(listing.avg_rating)} · ${listing.review_count} reviews`} variant="sheet" className="md:w-[780px]">
      <div className="space-y-8 px-6 pb-10 pt-6 md:px-8">
        {data?.items.map((r) => <ReviewCard key={r.id} review={r} />)}
        {!data && <p className="text-md text-ink-secondary">Loading reviews…</p>}
        {data && <Pagination page={data.page} totalPages={Math.max(Math.ceil(data.total / data.page_size), 1)} onChange={setPage} />}
      </div>
    </Modal>
  );
}

/* ───────── location, host, things to know ───────── */

export function LocationSection({ listing }: { listing: ListingDetail }) {
  return (
    <section id="location" className={clsx(section, "scroll-mt-24")}>
      <h2 className={clsx(sectionTitle, "mb-6")}>Where you’ll be</h2>
      <p className="mb-4 text-md font-medium">
        {listing.city}, {listing.state}, {listing.country}
      </p>
      <div className="relative h-[320px] overflow-hidden rounded-md border border-line-soft bg-surface-control md:h-[480px]" role="img" aria-label={`Map placeholder for ${listing.city}`}>
        <MapBackdrop id="loc-grid" />
        <span className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-gradient text-white shadow-modal">
          <Home size={24} />
        </span>
        <span className="absolute bottom-4 left-4 rounded-chip bg-surface px-3 py-1.5 text-xs font-medium shadow-pill">
          Exact location is shared after you book
        </span>
      </div>
    </section>
  );
}

export function HostSection({ listing }: { listing: ListingDetail }) {
  const { host } = listing;
  return (
    <section className={clsx(section, "scroll-mt-24")}>
      <h2 className={clsx(sectionTitle, "mb-6")}>Meet your host</h2>
      <div className="flex flex-col gap-6 md:flex-row md:gap-12">
        <div className="flex w-full items-center gap-6 rounded-modal bg-surface p-6 shadow-modal md:w-[360px]">
          <Avatar name={host.name} url={host.avatar_url} size={96} />
          <div>
            <p className="text-2xl font-bold">{host.name}</p>
            <p className="flex items-center gap-1.5 text-base text-ink-secondary">
              <UserRound size={14} /> {host.is_superhost ? "Superhost" : "Host"}
            </p>
          </div>
        </div>
        <div className="max-w-[420px] text-md">
          {host.is_superhost && (
            <>
              <h3 className="mb-2 text-lg font-medium">{host.name} is a Superhost</h3>
              <p className="mb-6 text-ink-secondary">Superhosts are experienced, highly rated hosts committed to great stays.</p>
            </>
          )}
          <h3 className="mb-2 text-lg font-medium">Host details</h3>
          <p className="text-ink-secondary">Hosting since {listing.host_since}</p>
          <button type="button" disabled title="Messaging is coming soon" className="mt-6 rounded-md bg-ink px-6 py-3.5 text-md font-medium text-white opacity-60">
            Message host · coming soon
          </button>
        </div>
      </div>
    </section>
  );
}

export function ThingsToKnow({ listing }: { listing: ListingDetail }) {
  const cols = [
    { title: "House rules", lines: ["Check-in after 2:00 pm", "Checkout before 11:00 am", `${listing.max_guests} guests maximum`] },
    { title: "Safety & property", lines: ["Smoke alarm and first aid kit as listed in the amenities", "Not suitable for unsupervised infants"] },
    { title: "Cancellation policy", lines: ["Free cancellation until check-in", "After check-in the stay is non-refundable"] },
  ];
  return (
    <section className={clsx(section, "border-b-0")}>
      <h2 className={clsx(sectionTitle, "mb-6")}>Things to know</h2>
      <div className="grid gap-8 md:grid-cols-3">
        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="mb-3 text-md font-medium">{c.title}</h3>
            <ul className="space-y-2 text-md text-ink-secondary">
              {c.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
