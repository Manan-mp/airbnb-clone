import { Star } from "lucide-react";
import Link from "next/link";
import { formatPrice, formatRating } from "@/lib/format";
import type { ListingCard as Listing } from "@/lib/types";
import { HeartButton } from "./HeartButton";
import { ImageCarousel } from "./ImageCarousel";

export function ListingCard({
  listing,
  priority,
  aspect = "var(--aspect-card)",
  query = "",
  dateLabel = "",
  onWishlistChange,
}: {
  listing: Listing;
  priority?: boolean;
  aspect?: string;
  /** Carry the stay dates/guests into the listing page. */
  query?: string;
  /** e.g. "19–23 Oct", shown when the search has dates. */
  dateLabel?: string;
  onWishlistChange?: (id: number, on: boolean) => void;
}) {
  const href = `/rooms/${listing.id}${query ? `?${query}` : ""}`;
  const badge = listing.is_guest_favourite ? "Guest favourite" : listing.host.is_superhost ? "Superhost" : null;

  return (
    <article className="relative">
      <Link href={href} className="block outline-offset-4">
        <ImageCarousel photos={listing.photos} alt={listing.title} priority={priority} aspect={aspect} />
        <div className="mt-3 flex items-start justify-between gap-3">
          <h3 className="truncate text-sm font-medium">
            {listing.room_type === "entire_home" ? capitalize(listing.property_type) : "Room"} in {listing.city}
          </h3>
          <span className="hidden shrink-0 items-center gap-1 text-sm sm:flex">
            <Star size={12} className="fill-ink" />
            {formatRating(listing.avg_rating)}
            {listing.review_count > 0 && <span className="text-ink-secondary">({listing.review_count})</span>}
          </span>
        </div>
        <p className="truncate text-xs text-ink-secondary">{listing.title}</p>
        <p className="text-xs text-ink-secondary">
          {listing.bedrooms} bedroom{listing.bedrooms === 1 ? "" : "s"} · {listing.beds} bed{listing.beds === 1 ? "" : "s"}
        </p>
        {dateLabel && listing.quote && <p className="text-xs text-ink-secondary">{dateLabel}</p>}
        <p className="mt-1 text-sm">
          {listing.quote ? (
            <>
              <span className="font-semibold">{formatPrice(listing.quote.total)}</span> for {listing.quote.nights} night
              {listing.quote.nights === 1 ? "" : "s"}
            </>
          ) : (
            <>
              <span className="font-semibold">{formatPrice(listing.price_per_night)}</span> night
            </>
          )}
          {/* narrow cards: rating moves into the price line */}
          <span className="sm:hidden">
            {" "}· <Star size={11} className="-mt-0.5 inline fill-ink" /> {formatRating(listing.avg_rating)}
          </span>
        </p>
      </Link>
      {badge && (
        <span className="pointer-events-none absolute left-3 top-3 rounded-badge bg-badge px-2.5 py-1.5 text-2xs font-semibold shadow-badge">
          {badge}
        </span>
      )}
      <HeartButton
        listingId={listing.id}
        wishlisted={listing.is_wishlisted}
        onChange={(on) => onWishlistChange?.(listing.id, on)}
        className="absolute right-2 top-2"
      />
    </article>
  );
}

const capitalize = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
