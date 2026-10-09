"use client";

import { ChevronLeft, ChevronRight, Share, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ListingDetail } from "@/lib/types";
import { SaveButton } from "../HeartButton";
import { useShare } from "./share";
import { SafeImg } from "@/components/ui/SafeImg";

type Photo = ListingDetail["photo_details"][number];

/** Full-screen "Photo tour": room thumbnails, then every photo large. Click a photo for the lightbox. */
export function PhotoTour({ listing, startIndex, onClose }: { listing: ListingDetail; startIndex: number; onClose: () => void }) {
  const photos = listing.photo_details;
  const share = useShare(listing.title);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const sections = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && lightbox === null && onClose();
    document.addEventListener("keydown", onKey);
    if (startIndex > 0) sections.current[startIndex]?.scrollIntoView();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, lightbox, startIndex]);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Photo tour" className="fixed inset-0 z-[100] animate-[fade-in_200ms_var(--ease-airy)] overflow-y-auto bg-surface">
      <div className="sticky top-0 z-10 flex h-16 items-center justify-between bg-surface px-4 md:px-8">
        <button type="button" aria-label="Close photo tour" onClick={onClose} className="flex size-10 items-center justify-center rounded-full hover:bg-surface-control">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-1">
          <button type="button" onClick={share} className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium underline hover:bg-surface-control">
            <Share size={16} /> Share
          </button>
          <SaveButton listingId={listing.id} wishlisted={listing.is_wishlisted} />
        </div>
      </div>

      <div className="mx-auto max-w-content px-6 pb-16 pt-4 md:px-8 xl:px-0">
        <h2 className="mb-6 text-2xl font-medium">Photo tour</h2>
        <div className="scrollbar-none mb-12 flex gap-3 overflow-x-auto pb-2">
          {photos.map((p, i) => (
            <button key={p.id} type="button" onClick={() => sections.current[i]?.scrollIntoView({ behavior: "smooth" })} className="w-[148px] shrink-0 text-left">
              <SafeImg src={p.url} width={320} alt="" className="aspect-[4/3] w-full rounded-xs object-cover shadow-badge" />
              <span className="mt-2 block truncate text-sm">{p.caption ?? `Photo ${i + 1}`}</span>
            </button>
          ))}
        </div>

        <div className="space-y-12">
          {photos.map((p, i) => (
            <section key={p.id} ref={(el) => void (sections.current[i] = el)} className="grid gap-4 scroll-mt-20 md:grid-cols-[378px_1fr] md:gap-0">
              <h3 className="text-xl font-medium">{p.caption ?? `Photo ${i + 1}`}</h3>
              <button type="button" onClick={() => setLightbox(i)} aria-label={`Open ${p.caption ?? `photo ${i + 1}`} full screen`} className="block overflow-hidden rounded-xs">
                <SafeImg src={p.url} width={1200} alt={p.caption ?? listing.title} loading="lazy" className="w-full object-cover" />
              </button>
            </section>
          ))}
        </div>
      </div>

      {lightbox !== null && <Lightbox photos={photos} index={lightbox} onChange={setLightbox} onClose={() => setLightbox(null)} />}
    </div>,
    document.body,
  );
}

/** Black full-screen viewer with counter, arrows and arrow-key navigation. */
export function Lightbox({ photos, index, onChange, onClose }: { photos: Photo[]; index: number; onChange: (i: number) => void; onClose: () => void }) {
  const go = useCallback((d: number) => onChange((index + d + photos.length) % photos.length), [index, onChange, photos.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  const p = photos[index];
  return (
    <div role="dialog" aria-modal="true" aria-label="Photo viewer" className="fixed inset-0 z-[120] flex flex-col bg-black">
      <div className="flex h-16 shrink-0 items-center justify-between px-4 text-white">
        <button type="button" aria-label="Close viewer" onClick={onClose} className="flex size-10 items-center justify-center rounded-full hover:bg-white/15">
          <X size={20} />
        </button>
        <span className="text-base">
          {index + 1} / {photos.length}
        </span>
        <span className="w-10" />
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-8 md:px-20">
        <button type="button" aria-label="Previous photo" onClick={() => go(-1)} className="absolute left-3 flex size-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 md:left-6">
          <ChevronLeft size={20} />
        </button>
        <SafeImg src={p.url} width={1600} alt={p.caption ?? ""} className="max-h-full max-w-full object-contain" />
        <button type="button" aria-label="Next photo" onClick={() => go(1)} className="absolute right-3 flex size-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 md:right-6">
          <ChevronRight size={20} />
        </button>
      </div>
      {p.caption && <p className="pb-6 text-center text-base text-white">{p.caption}</p>}
    </div>
  );
}
