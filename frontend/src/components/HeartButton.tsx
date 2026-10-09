"use client";

import { Heart } from "lucide-react";
import { clsx } from "clsx";
import { useWishlist } from "@/lib/useWishlist";

/** Circular heart over a card photo. */
export function HeartButton({
  listingId,
  wishlisted,
  onChange,
  className,
}: {
  listingId: number;
  wishlisted: boolean;
  onChange?: (v: boolean) => void;
  className?: string;
}) {
  const { on, pop, toggle } = useWishlist(listingId, wishlisted, onChange);
  return (
    <button
      type="button"
      aria-label={on ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={on}
      onClick={toggle}
      className={clsx(
        "flex size-8 items-center justify-center transition-transform duration-[250ms] ease-airy hover:scale-110",
        pop && "scale-125",
        className,
      )}
    >
      <Heart size={24} strokeWidth={2} className={clsx("stroke-white", on ? "fill-brand" : "fill-heart-idle")} />
    </button>
  );
}

/** Text "Save" control for the listing page title row (and a round icon variant for the phone hero). */
export function SaveButton({
  listingId,
  wishlisted,
  variant = "text",
}: {
  listingId: number;
  wishlisted: boolean;
  variant?: "text" | "round";
}) {
  const { on, pop, toggle } = useWishlist(listingId, wishlisted);
  const icon = <Heart size={16} className={clsx(on ? "fill-brand stroke-brand" : "stroke-ink", "transition-transform", pop && "scale-125")} />;
  if (variant === "round") {
    return (
      <button
        type="button"
        aria-label={on ? "Remove from wishlist" : "Save to wishlist"}
        aria-pressed={on}
        onClick={toggle}
        className="flex size-10 items-center justify-center rounded-full bg-surface/90 shadow-pill"
      >
        {icon}
      </button>
    );
  }
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={toggle}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium underline transition-colors duration-150 ease-airy hover:bg-surface-control"
    >
      {icon} {on ? "Saved" : "Save"}
    </button>
  );
}
