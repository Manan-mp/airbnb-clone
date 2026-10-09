"use client";

import { Heart } from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ui/Toast";

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
  const { user, requestLogin } = useAuth();
  const toast = useToast();
  const [on, setOn] = useState(wishlisted);
  const [pop, setPop] = useState(false);
  const [seen, setSeen] = useState(wishlisted);
  if (seen !== wishlisted) {
    // server value changed (e.g. after login): follow it
    setSeen(wishlisted);
    setOn(wishlisted);
  }

  async function set(next: boolean) {
    setOn(next);
    setPop(true);
    setTimeout(() => setPop(false), 250);
    try {
      await (next ? api.addWishlist(listingId) : api.removeWishlist(listingId));
      onChange?.(next);
      toast.show(next ? "Saved to wishlist" : "Removed from wishlist");
    } catch (e) {
      setOn(!next);
      toast.show(e instanceof ApiError ? e.message : "Couldn’t update your wishlist", "error");
    }
  }

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return requestLogin(() => void set(true));
    void set(!on);
  }

  return (
    <button
      type="button"
      aria-label={on ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={on}
      onClick={onClick}
      className={clsx(
        "flex size-8 items-center justify-center transition-transform duration-[250ms] ease-airy hover:scale-110",
        pop && "scale-125",
        className,
      )}
    >
      <Heart
        size={24}
        strokeWidth={2}
        className={clsx("stroke-white", on ? "fill-brand" : "fill-heart-idle")}
      />
    </button>
  );
}
