import { useSyncExternalStore } from "react";

// Matches Tailwind's `md` breakpoint (--breakpoint-md: 744px).
const QUERY = "(max-width: 743.98px)";

export const isPhoneNow = () => typeof window !== "undefined" && window.matchMedia(QUERY).matches;

/** True below the `md` breakpoint. Renders as desktop on the server. */
export function useIsPhone(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    isPhoneNow,
    () => false,
  );
}

/** True when the viewport is at least the width where the results page shows its side map (--breakpoint-map). */
export function useShowsSideMap(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(min-width: 1280px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 1280px)").matches,
    () => false,
  );
}
