"use client";

import { clsx } from "clsx";
import { formatPrice } from "@/lib/format";
import type { ListingDetail } from "@/lib/types";

const TABS = [
  ["photos", "Photos"],
  ["amenities", "Amenities"],
  ["reviews", "Reviews"],
  ["location", "Location"],
] as const;

/**
 * Fixed bar that slides in once the gallery is scrolled past. It overlays the page (fixed +
 * transform only), so showing or hiding it never changes document layout.
 */
export function SectionNav({
  visible,
  active,
  showReserve,
  listing,
  hasDates,
  onReserve,
}: {
  visible: boolean;
  active: string;
  showReserve: boolean;
  listing: ListingDetail;
  hasDates: boolean;
  onReserve: () => void;
}) {
  const go = (id: string) => {
    if (id === "photos") window.scrollTo({ top: 0, behavior: "smooth" });
    else document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <div
      data-state={visible ? "visible" : "hidden"}
      inert={!visible}
      className={clsx(
        "fixed inset-x-0 top-0 z-40 hidden border-b border-line-soft bg-surface transition-[transform,opacity] duration-300 ease-airy md:block",
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0",
      )}
    >
      <div className="mx-auto flex h-20 max-w-content items-center justify-between px-8 xl:px-0">
        <nav aria-label="Sections" className="flex gap-6">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-current={active === id ? "true" : undefined}
              onClick={() => go(id)}
              className={clsx(
                "border-b-2 py-6 text-base font-medium transition-colors duration-150 ease-airy",
                active === id ? "border-ink text-ink" : "border-transparent text-ink-secondary hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </nav>
        <div
          data-state={showReserve ? "visible" : "hidden"}
          className={clsx("flex items-center gap-5 transition-opacity duration-300 ease-airy", showReserve ? "opacity-100" : "pointer-events-none opacity-0")}
        >
          <div className="text-right">
            <p className="text-base font-semibold">{hasDates ? `${formatPrice(listing.price_per_night)} night` : "Add dates for prices"}</p>
            <p className="text-xs text-ink-secondary">
              ★ {listing.avg_rating > 0 ? listing.avg_rating.toFixed(2) : "New"} · {listing.review_count} reviews
            </p>
          </div>
          <button
            type="button"
            onClick={onReserve}
            className="h-12 rounded-full bg-brand-gradient px-8 text-md font-medium text-white transition-transform duration-200 ease-airy active:scale-[0.98]"
          >
            {hasDates ? "Reserve" : "Check availability"}
          </button>
        </div>
      </div>
    </div>
  );
}
