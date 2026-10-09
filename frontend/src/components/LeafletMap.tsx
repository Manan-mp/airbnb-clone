"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { formatPrice, formatRating } from "@/lib/format";
import { imgSrc } from "@/lib/img";
import type { ListingCard } from "@/lib/types";

const INDIA: L.LatLngExpression = [22.5, 79];

function priceIcon(price: number, active: boolean) {
  return L.divIcon({
    className: "price-pin-wrap",
    html: `<span class="price-pin" data-active="${active}">${formatPrice(price)}</span>`,
    iconSize: [0, 0],
  });
}

/** Keeps the viewport on the pins whenever the result set changes. */
function FitToPins({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = points.map((p) => p.join(",")).join("|");
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) map.setView(points[0], 11);
    else map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 13 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

/** Leaflet map with a price pin per listing. Calls `onTilesFailed` if no tile ever loads (offline, blocked). */
export default function LeafletMap({
  items,
  activeId,
  wheelZoom,
  onTilesFailed,
  className = "",
}: {
  items: ListingCard[];
  activeId: number | null;
  wheelZoom: boolean;
  onTilesFailed: () => void;
  className?: string;
}) {
  const pts = useMemo(() => items.filter((i) => i.lat !== null && i.lng !== null), [items]);
  const points = useMemo(() => pts.map((p) => [p.lat as number, p.lng as number] as [number, number]), [pts]);
  const loaded = useRef(0);
  const failed = useRef(0);

  return (
    <MapContainer center={INDIA} zoom={4} scrollWheelZoom={wheelZoom} className={`size-full ${className}`} attributionControl>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        eventHandlers={{
          tileload: () => {
            loaded.current += 1;
          },
          tileerror: () => {
            failed.current += 1;
            if (loaded.current === 0 && failed.current >= 4) onTilesFailed();
          },
        }}
      />
      <FitToPins points={points} />
      {pts.map((p) => (
        <Marker key={p.id} position={[p.lat as number, p.lng as number]} icon={priceIcon(p.price_per_night, p.id === activeId)} zIndexOffset={p.id === activeId ? 1000 : 0}>
          <Popup closeButton={false} className="listing-popup">
            <Link href={`/rooms/${p.id}`} className="block w-48">
              {p.photos[0] && <img src={imgSrc(p.photos[0], 400)} alt="" className="aspect-card w-full rounded-sm object-cover" />}
              <span className="mt-2 block truncate text-base font-medium">{p.title}</span>
              <span className="block text-base text-ink-secondary">
                {formatPrice(p.price_per_night)} night · ★ {formatRating(p.avg_rating)}
              </span>
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
