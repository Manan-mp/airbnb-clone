"use client";

import { Star } from "lucide-react";
import { clsx } from "clsx";

/** Five tappable stars. `value` 0 means unset. */
export function StarInput({ label, value, onChange, size = 24 }: { label: string; value: number; onChange: (n: number) => void; size?: number }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          onClick={() => onChange(n)}
          className="rounded-full p-0.5 transition-transform duration-200 ease-airy hover:scale-110"
        >
          <Star size={size} className={clsx(n <= value ? "fill-ink stroke-ink" : "stroke-ink-disabled")} />
        </button>
      ))}
    </div>
  );
}
