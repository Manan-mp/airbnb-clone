import { MapPin } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { MapBackdrop } from "./MapBackdrop";
import type { ListingCard } from "@/lib/types";

/**
 * Static fallback for the interactive map (used while it loads or when tiles fail).
 * Pins are placed by projecting each listing's lat/lng onto the pane.
 */
export function MapPlaceholder({ items, className = "", note = "Map unavailable, showing approximate positions" }: { items: ListingCard[]; className?: string; note?: string }) {
  const pts = items.filter((i) => i.lat !== null && i.lng !== null);
  const lats = pts.map((p) => p.lat as number);
  const lngs = pts.map((p) => p.lng as number);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const place = (v: number, lo: number, hi: number) => (hi === lo ? 50 : 10 + ((v - lo) / (hi - lo)) * 80);

  return (
    <div
      className={`relative overflow-hidden rounded-card border border-line-soft bg-surface-control ${className}`}
      role="img"
      aria-label="Approximate map of listing prices"
    >
      <MapBackdrop />
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
        <MapPin size={12} /> {note}
      </span>
    </div>
  );
}
