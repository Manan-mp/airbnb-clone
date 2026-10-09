import { MapPin } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { ListingCard } from "@/lib/types";

/**
 * Static stand-in for the map (interactive map is a stretch goal).
 * Pins are placed by projecting each listing's lat/lng onto the pane.
 */
export function MapPlaceholder({ items, className = "" }: { items: ListingCard[]; className?: string }) {
  const pts = items.filter((i) => i.lat !== null && i.lng !== null);
  const lats = pts.map((p) => p.lat as number);
  const lngs = pts.map((p) => p.lng as number);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const place = (v: number, lo: number, hi: number) => (hi === lo ? 50 : 10 + ((v - lo) / (hi - lo)) * 80);

  return (
    <div
      className={`relative overflow-hidden rounded-card border border-line-soft bg-surface-control ${className}`}
      role="img"
      aria-label="Map placeholder showing listing prices"
    >
      <svg className="absolute inset-0 size-full text-line" aria-hidden>
        <defs>
          <pattern id="map-grid" width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M64 0H0V64" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#map-grid)" />
        <path d="M-20 80 C 120 20, 220 180, 420 90 S 640 140, 760 40" fill="none" stroke="currentColor" strokeWidth="10" opacity="0.6" />
        <path d="M60 -10 C 90 140, 40 260, 140 420" fill="none" stroke="currentColor" strokeWidth="6" opacity="0.6" />
      </svg>
      {pts.map((p) => (
        <Link
          key={p.id}
          href={`/rooms/${p.id}`}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-chip bg-surface px-3 py-1.5 text-base font-semibold shadow-pill transition-transform duration-200 ease-airy hover:z-10 hover:scale-110 hover:bg-ink hover:text-white"
          style={{ left: `${place(p.lng as number, minLng, maxLng)}%`, top: `${100 - place(p.lat as number, minLat, maxLat)}%` }}
        >
          {formatPrice(p.price_per_night)}
        </Link>
      ))}
      <span className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-chip bg-surface px-3 py-1.5 text-xs font-medium shadow-pill">
        <MapPin size={12} /> Interactive map coming soon
      </span>
    </div>
  );
}
