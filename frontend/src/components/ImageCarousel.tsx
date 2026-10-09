"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { SafeImg } from "./ui/SafeImg";

/** Scroll-snap photo strip with hover arrows and dots. Navigation never follows the card link. */
export function ImageCarousel({ photos, alt, priority, aspect }: { photos: string[]; alt: string; priority?: boolean; aspect: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const go = useCallback((delta: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = track.current;
    if (el) el.scrollBy({ left: delta * el.clientWidth, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const arrow =
    "absolute top-1/2 z-10 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-surface shadow-pill opacity-0 transition-opacity duration-200 ease-airy group-hover:opacity-100 md:flex";

  return (
    <div className="group relative overflow-hidden rounded-card" style={{ aspectRatio: aspect }}>
      <div ref={track} className="scrollbar-none flex h-full snap-x snap-mandatory overflow-x-auto">
        {photos.map((url, i) => (
          <SafeImg
            key={url}
            src={url}
            width={640}
            widths={[240, 360, 480, 640]}
            sizes="(min-width:1440px) 16vw, (min-width:1128px) 20vw, (min-width:744px) 33vw, calc(50vw - 24px)"
            fetchPriority={priority && i === 0 ? "high" : undefined}
            alt={i === 0 ? alt : ""}
            loading={priority && i === 0 ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
            className="h-full w-full shrink-0 snap-center object-cover transition-transform duration-300 ease-airy md:group-hover:scale-[1.02]"
          />
        ))}
      </div>
      {photos.length > 1 && (
        <>
          {index > 0 && (
            <button type="button" aria-label="Previous photo" onClick={(e) => go(-1, e)} className={clsx(arrow, "left-2")}>
              <ChevronLeft size={16} />
            </button>
          )}
          {index < photos.length - 1 && (
            <button type="button" aria-label="Next photo" onClick={(e) => go(1, e)} className={clsx(arrow, "right-2")}>
              <ChevronRight size={16} />
            </button>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1">
            {photos.slice(0, 5).map((_, i) => (
              <span key={i} className={clsx("size-1.5 rounded-full transition-colors", i === Math.min(index, 4) ? "bg-surface" : "bg-surface/60")} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
