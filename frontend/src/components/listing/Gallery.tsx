"use client";

import { ChevronLeft, LayoutGrid, Share } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ListingDetail } from "@/lib/types";
import { SaveButton } from "../HeartButton";
import { useShare } from "./share";
import { SafeImg } from "@/components/ui/SafeImg";

/** Desktop: hero + four tiles. */
export function PhotoGrid({ photos, title, onOpen }: { photos: ListingDetail["photo_details"]; title: string; onOpen: (i: number) => void }) {
  const n = photos.length;
  const tiles = photos.slice(1, 5);
  // measured on the reference: 560 / 272 / 272 columns, 238 / 230 rows
  const cols = n >= 5 ? "560fr 272fr 272fr" : n >= 2 ? "560fr 272fr" : "1fr";
  return (
    <div className="relative">
      <div
        className="grid aspect-gallery gap-2 overflow-hidden rounded-md"
        style={{ gridTemplateColumns: cols, gridTemplateRows: n === 1 ? "1fr" : "238fr 230fr" }}
      >
        <button type="button" onClick={() => onOpen(0)} className="group relative row-span-2 overflow-hidden" aria-label="Open photo 1">
          <SafeImg src={photos[0].url} width={1200} alt={title} loading="lazy" className="size-full object-cover transition-[filter] duration-300 ease-airy group-hover:brightness-90" />
        </button>
        {tiles.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onOpen(i + 1)}
            aria-label={`Open photo ${i + 2}`}
            className={`group relative overflow-hidden ${n === 4 && i === 2 ? "col-span-2" : ""}`}
          >
            <SafeImg src={p.url} width={640} alt="" loading="lazy" className="size-full object-cover transition-[filter] duration-300 ease-airy group-hover:brightness-90" />
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onOpen(-1)}
        className="absolute bottom-4 right-4 flex items-center gap-2 rounded-md border border-ink bg-surface px-4 py-1.5 text-base font-medium transition-transform duration-200 ease-airy hover:scale-[1.02]"
      >
        <LayoutGrid size={16} /> Show all photos
      </button>
    </div>
  );
}

/** Phones: full-bleed swipeable hero with floating back / share / save and an "n / total" chip. */
export function MobileHero({
  listing,
  onOpen,
}: {
  listing: ListingDetail;
  onOpen: () => void;
}) {
  const router = useRouter();
  const share = useShare(listing.title);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const photos = listing.photo_details;
  return (
    <div className="relative md:hidden">
      <div ref={track} className="scrollbar-none flex aspect-[390/347] snap-x snap-mandatory overflow-x-auto bg-surface-control">
        {photos.map((p, i) => (
          <button key={p.id} type="button" onClick={onOpen} aria-label={`Open photo ${i + 1}`} className="size-full shrink-0 snap-center">
            <SafeImg src={p.url} width={900} alt={i === 0 ? listing.title : ""} loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : undefined} className="size-full object-cover" />
          </button>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3">
        <button
          type="button"
          aria-label="Back"
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
          className="pointer-events-auto flex size-10 items-center justify-center rounded-full bg-surface/90 shadow-pill"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="pointer-events-auto flex gap-2">
          <button type="button" aria-label="Share" onClick={share} className="flex size-10 items-center justify-center rounded-full bg-surface/90 shadow-pill">
            <Share size={16} />
          </button>
          <SaveButton listingId={listing.id} wishlisted={listing.is_wishlisted} variant="round" />
        </div>
      </div>
      <span className="pointer-events-none absolute bottom-10 right-4 rounded-md bg-ink/70 px-3 py-1 text-base font-medium text-white">
        {Math.min(index + 1, photos.length)} / {photos.length}
      </span>
    </div>
  );
}
