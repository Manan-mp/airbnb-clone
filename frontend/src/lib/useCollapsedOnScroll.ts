"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-driven collapsed flag with hysteresis: collapses past `collapseAt`, expands again only
 * below `expandAt`, so it can never oscillate around a single threshold.
 *
 * Reads scrollY once per animation frame (rAF-throttled) from a passive listener and only sets state when the
 * value actually changes. `onCollapse` runs (inside the frame callback) on every expanded→collapsed switch.
 */
export function useCollapsedOnScroll({
  collapseAt = 80,
  expandAt = 20,
  onCollapse,
}: { collapseAt?: number; expandAt?: number; onCollapse?: () => void } = {}): boolean {
  const [collapsed, setCollapsed] = useState(false);
  const current = useRef(false);
  const callback = useRef(onCollapse);
  useEffect(() => {
    callback.current = onCollapse;
  });

  useEffect(() => {
    let pending = false;
    let raf = 0;
    let timer = 0;
    const update = () => {
      pending = false;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      const y = window.scrollY;
      const next = current.current ? y >= expandAt : y > collapseAt;
      if (next === current.current) return;
      current.current = next;
      setCollapsed(next);
      if (next) callback.current?.();
    };
    // One update per frame. The timer is only a fallback for tabs where frames are paused
    // (background tabs, headless capture), whichever fires first runs the single update.
    const schedule = () => {
      if (pending) return;
      pending = true;
      raf = requestAnimationFrame(update);
      timer = window.setTimeout(update, 100);
    };
    window.addEventListener("scroll", onScrollPassive, { passive: true });
    function onScrollPassive() {
      schedule();
    }
    schedule(); // pick up restored scroll positions
    return () => {
      window.removeEventListener("scroll", onScrollPassive);
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [collapseAt, expandAt]);

  return collapsed;
}
