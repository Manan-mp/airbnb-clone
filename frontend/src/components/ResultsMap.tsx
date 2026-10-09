"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { ListingCard } from "@/lib/types";
import { MapPlaceholder } from "./MapPlaceholder";

// Leaflet touches `window`, so it is only loaded in the browser, and only on pages that show a map.
const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

/**
 * Interactive results map. The static placeholder is the fallback: it is shown while Leaflet loads
 * and stays if the map tiles cannot be fetched.
 */
export function ResultsMap({
  items,
  activeId = null,
  wheelZoom = false,
  className = "",
}: {
  items: ListingCard[];
  activeId?: number | null;
  wheelZoom?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <MapPlaceholder items={items} className={className} note="Map tiles couldn’t load, showing approximate positions" />;
  return (
    <div className={`relative isolate overflow-hidden rounded-card border border-line-soft bg-surface-control ${className}`} data-testid="results-map">
      {/* shown until Leaflet has loaded; its container covers it afterwards */}
      <MapPlaceholder items={items} className="absolute inset-0 rounded-none border-0" />
      <div className="absolute inset-0"><LeafletMap items={items} activeId={activeId} wheelZoom={wheelZoom} onTilesFailed={() => setFailed(true)} /></div>
    </div>
  );
}
