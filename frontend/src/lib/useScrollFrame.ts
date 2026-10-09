"use client";

import { useEffect, useRef } from "react";

/**
 * Runs `callback` at most once per animation frame while the page scrolls (and once on mount).
 * Passive listener; a timer backs up requestAnimationFrame for tabs where frames are paused.
 */
export function useScrollFrame(callback: () => void): void {
  const latest = useRef(callback);
  useEffect(() => {
    latest.current = callback;
  });

  useEffect(() => {
    let pending = false;
    let raf = 0;
    let timer = 0;
    const run = () => {
      pending = false;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      latest.current();
    };
    const schedule = () => {
      if (pending) return;
      pending = true;
      raf = requestAnimationFrame(run);
      timer = window.setTimeout(run, 100);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);
}
