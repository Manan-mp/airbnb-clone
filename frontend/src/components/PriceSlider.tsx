"use client";

import { formatPrice } from "@/lib/format";
import type { PriceHistogram } from "@/lib/types";

const STEP = 100;

export function PriceSlider({
  histogram,
  min,
  max,
  onChange,
}: {
  histogram: PriceHistogram;
  min: number | null;
  max: number | null;
  onChange: (min: number | null, max: number | null) => void;
}) {
  const lo = Math.floor(histogram.min / STEP) * STEP;
  const hi = Math.ceil(histogram.max / STEP) * STEP;
  const curMin = min ?? lo;
  const curMax = max ?? hi;
  const span = Math.max(hi - lo, 1);
  const peak = Math.max(...histogram.buckets, 1);
  const pct = (v: number) => ((v - lo) / span) * 100;
  const emit = (a: number, b: number) => onChange(a <= lo ? null : a, b >= hi ? null : b);

  if (hi <= lo) return <p className="text-base text-ink-secondary">No price range to adjust for these results.</p>;

  return (
    <div>
      <div className="relative mx-4 h-[84px]">
        <div className="absolute inset-x-0 bottom-4 flex h-[60px] items-end gap-px" aria-hidden>
          {histogram.buckets.map((count, i) => {
            const mid = lo + ((i + 0.5) / histogram.buckets.length) * span;
            const inside = mid >= curMin && mid <= curMax;
            return (
              <div
                key={i}
                className={inside ? "flex-1 bg-brand" : "flex-1 bg-line"}
                style={{ height: `${Math.max((count / peak) * 100, count ? 6 : 2)}%` }}
              />
            );
          })}
        </div>
        <div className="absolute inset-x-0 bottom-3.5 h-px bg-line" />
        <div className="absolute bottom-3.5 h-0.5 bg-ink" style={{ left: `${pct(curMin)}%`, right: `${100 - pct(curMax)}%` }} />
        <div className="absolute inset-x-0 bottom-0 h-8">
          <input
            type="range"
            aria-label="Minimum price"
            className="range-thumb"
            min={lo}
            max={hi}
            step={STEP}
            value={curMin}
            onChange={(e) => emit(Math.min(Number(e.target.value), curMax - STEP), curMax)}
          />
          <input
            type="range"
            aria-label="Maximum price"
            className="range-thumb"
            min={lo}
            max={hi}
            step={STEP}
            value={curMax}
            onChange={(e) => emit(curMin, Math.max(Number(e.target.value), curMin + STEP))}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-4">
        <PriceBox label="Minimum" value={formatPrice(curMin)} />
        <PriceBox label="Maximum" value={`${formatPrice(curMax)}${curMax >= hi ? "+" : ""}`} align="right" />
      </div>
    </div>
  );
}

function PriceBox({ label, value, align = "left" }: { label: string; value: string; align?: "left" | "right" }) {
  return (
    <div className={`w-40 rounded-chip border border-line px-4 py-2 ${align === "right" ? "text-right" : ""}`}>
      <div className="text-xs text-ink-secondary">{label}</div>
      <div className="text-md">{value}</div>
    </div>
  );
}
