"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { ApiError, api } from "./api";

/** Optimistic wishlist toggle shared by the card heart and the listing page's Save button. */
export function useWishlist(listingId: number, wishlisted: boolean, onChange?: (on: boolean) => void) {
  const { user, requestLogin } = useAuth();
  const toast = useToast();
  const [on, setOn] = useState(wishlisted);
  const [pop, setPop] = useState(false);
  const [seen, setSeen] = useState(wishlisted);
  if (seen !== wishlisted) {
    // the server value changed (e.g. after logging in): follow it
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

  function toggle(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    if (!user) return requestLogin(() => void set(true));
    void set(!on);
  }

  return { on, pop, toggle };
}
