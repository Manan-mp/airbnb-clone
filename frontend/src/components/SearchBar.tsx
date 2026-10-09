"use client";

import { Navigation, Search } from "lucide-react";
import { clsx } from "clsx";
import { useEffect, useRef, useState } from "react";
import { DESTINATIONS } from "@/lib/destinations";
import { formatRange, guestSummary } from "@/lib/format";
import type { useSearchDraft } from "@/lib/useSearchDraft";
import { DateRangeCalendar } from "./DateRangeCalendar";
import { GuestStepper } from "./GuestStepper";

export type Segment = "where" | "when" | "who";
type DraftApi = ReturnType<typeof useSearchDraft>;

type Props = DraftApi & {
  /** Opens a segment when `id` changes (used when expanding from the compact pill). */
  focusRequest?: { segment: Segment; id: number } | null;
  onOpenChange?: (open: boolean) => void;
};

/** Expanded desktop search pill with Where / When / Who popovers. */
export function SearchBar({ draft, setDraft, submit, focusRequest = null, onOpenChange }: Props) {
  const [active, setActive] = useState<Segment | null>(null);
  const [handled, setHandled] = useState(0);
  if (focusRequest && focusRequest.id !== handled) {
    setHandled(focusRequest.id);
    setActive(focusRequest.segment);
  }
  const root = useRef<HTMLDivElement>(null);
  const whereInput = useRef<HTMLInputElement>(null);

  useEffect(() => onOpenChange?.(active !== null), [active, onOpenChange]);

  useEffect(() => {
    if (active === "where") whereInput.current?.focus();
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const close = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setActive(null);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [active]);

  const { start, end } = draft.dates;
  const guestText = guestSummary(draft.guests.adults, draft.guests.children, draft.guests.infants, draft.guests.pets);
  const suggestions = DESTINATIONS.filter((d) => d.name.toLowerCase().includes(draft.location.trim().toLowerCase()));

  const segment = (key: Segment) =>
    clsx(
      "relative flex h-full min-w-0 flex-col justify-center rounded-pill px-8 text-left transition-colors duration-200 ease-airy",
      active === key ? "bg-surface shadow-pill" : active ? "hover:bg-line-soft" : "hover:bg-surface-control",
    );

  return (
    <div ref={root} className="relative mx-auto w-full max-w-search">
      <div
        className={clsx(
          "flex h-[66px] items-center rounded-pill border border-line shadow-pill transition-colors duration-200 ease-airy",
          active ? "bg-surface-control" : "bg-surface",
        )}
      >
        <div className="grid h-full flex-1 grid-cols-[1.25fr_1fr_1fr]">
          <label className={segment("where")} onClick={() => setActive("where")}>
            <span className="text-xs font-semibold">Where</span>
            <input
              ref={whereInput}
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              onFocus={() => setActive("where")}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Search destinations"
              className="w-full truncate bg-transparent text-base font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-secondary"
            />
          </label>
          <button type="button" className={segment("when")} onClick={() => setActive("when")}>
            <span className="text-xs font-semibold">When</span>
            <span className={clsx("truncate text-base", start ? "font-medium" : "text-ink-secondary")}>
              {start && end ? formatRange(start, end) : start ? "Add checkout" : "Add dates"}
            </span>
          </button>
          <button type="button" className={clsx(segment("who"), "pr-[88px]")} onClick={() => setActive("who")}>
            <span className="text-xs font-semibold">Who</span>
            <span className={clsx("truncate text-base", guestText ? "font-medium" : "text-ink-secondary")}>
              {guestText || "Add guests"}
            </span>
          </button>
        </div>
        <button
          type="button"
          aria-label="Search"
          onClick={() => {
            setActive(null);
            submit();
          }}
          className={clsx(
            "absolute right-[9px] top-[9px] flex h-12 items-center justify-center gap-2 rounded-chip bg-brand-gradient font-medium text-white transition-all duration-200 ease-airy",
            active ? "px-6" : "w-12",
          )}
        >
          <Search size={16} strokeWidth={2.5} />
          {active && <span className="text-md">Search</span>}
        </button>
      </div>

      {active === "where" && (
        <div className="absolute left-0 top-[78px] z-50 max-h-[420px] w-[427px] animate-[fade-in_150ms_var(--ease-airy)] overflow-y-auto rounded-modal bg-surface p-6 shadow-modal">
          <p className="mb-3 text-xs font-semibold">Suggested destinations</p>
          <ul>
            <li>
              <SuggestionRow
                icon={<Navigation size={22} className="text-ink-secondary" />}
                title="Nearby"
                note="Find what’s around you"
                onClick={() => {
                  setDraft({ ...draft, location: "" });
                  setActive("when");
                }}
              />
            </li>
            {suggestions.map((d) => (
              <li key={d.name}>
                <SuggestionRow
                  title={d.name}
                  note={d.note}
                  onClick={() => {
                    setDraft({ ...draft, location: d.name });
                    setActive("when");
                  }}
                />
              </li>
            ))}
            {suggestions.length === 0 && <li className="py-3 text-base text-ink-secondary">No matching destinations</li>}
          </ul>
        </div>
      )}

      {active === "when" && (
        <div className="absolute left-1/2 top-[78px] z-50 -translate-x-1/2 animate-[fade-in_150ms_var(--ease-airy)] rounded-modal bg-surface px-6 pb-6 pt-8 shadow-modal">
          <DateRangeCalendar
            value={draft.dates}
            onChange={(dates) => {
              setDraft({ ...draft, dates });
              if (dates.end) setActive("who");
            }}
            cell={32}
          />
          {(start || end) && (
            <div className="mt-4 text-right">
              <button
                type="button"
                className="text-base font-semibold underline"
                onClick={() => setDraft({ ...draft, dates: { start: null, end: null } })}
              >
                Clear dates
              </button>
            </div>
          )}
        </div>
      )}

      {active === "who" && (
        <div className="absolute right-0 top-[78px] z-50 w-full animate-[fade-in_150ms_var(--ease-airy)] rounded-modal bg-surface px-6 py-4 shadow-modal">
          <div className="mx-auto max-w-[384px]">
            <GuestStepper value={draft.guests} onChange={(guests) => setDraft({ ...draft, guests })} />
          </div>
        </div>
      )}
    </div>
  );
}

function SuggestionRow({
  title,
  note,
  icon,
  onClick,
}: {
  title: string;
  note: string;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-md px-2 py-2 text-left transition-colors duration-150 ease-airy hover:bg-surface-control"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-sm bg-surface-control">
        {icon ?? <span className="text-md font-semibold text-brand">{title[0]}</span>}
      </span>
      <span>
        <span className="block text-md">{title}</span>
        <span className="block text-base text-ink-secondary">{note}</span>
      </span>
    </button>
  );
}
