"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

function pages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const lo = Math.max(2, current - 1);
  const hi = Math.min(total - 1, current + 1);
  if (lo > 2) out.push("…");
  for (let p = lo; p <= hi; p++) out.push(p);
  if (hi < total - 1) out.push("…");
  out.push(total);
  return out;
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const btn = "flex size-8 items-center justify-center rounded-full text-base transition-colors duration-150 ease-airy";
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1">
      <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => onChange(page - 1)} className={clsx(btn, "hover:bg-surface-control disabled:opacity-30 disabled:hover:bg-transparent")}>
        <ChevronLeft size={16} />
      </button>
      {pages(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="flex size-8 items-center justify-center text-ink-secondary">…</span>
        ) : (
          <button
            key={p}
            type="button"
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
            className={clsx(btn, p === page ? "bg-ink font-medium text-white" : "hover:bg-surface-control")}
          >
            {p}
          </button>
        ),
      )}
      <button type="button" aria-label="Next page" disabled={page >= totalPages} onClick={() => onChange(page + 1)} className={clsx(btn, "hover:bg-surface-control disabled:opacity-30 disabled:hover:bg-transparent")}>
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
