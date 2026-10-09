"use client";

import { Navigation, Search, X } from "lucide-react";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DESTINATIONS } from "@/lib/destinations";
import { formatRange, guestSummary } from "@/lib/format";
import type { useSearchDraft } from "@/lib/useSearchDraft";
import { DateRangeCalendar } from "./DateRangeCalendar";
import { GuestStepper } from "./GuestStepper";
import type { Segment } from "./SearchBar";

type DraftApi = ReturnType<typeof useSearchDraft>;

/** Full-screen search on phones: stacked Where? / When? / Who? steps. */
export function MobileSearchSheet(props: DraftApi & { open: boolean; onClose: () => void }) {
  // Mount only while open so every opening starts at the "Where?" step.
  // Portal: the header is a z-50 stacking context and would otherwise trap the sheet under the bottom nav.
  return props.open ? createPortal(<SheetBody {...props} />, document.body) : null;
}

function SheetBody({ onClose, draft, setDraft, submit, clear }: DraftApi & { onClose: () => void }) {
  const [step, setStep] = useState<Segment>("where");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const { start, end } = draft.dates;
  const guestText = guestSummary(draft.guests.adults, draft.guests.children, draft.guests.infants, draft.guests.pets);
  const suggestions = DESTINATIONS.filter((d) => d.name.toLowerCase().includes(draft.location.trim().toLowerCase()));

  return (
    <div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-[110] flex animate-[fade-in_200ms_var(--ease-airy)] flex-col bg-surface-subtle">
      <div className="relative flex shrink-0 items-start justify-center px-4 pb-4 pt-5">
        <div className="flex gap-8 text-base">
          <span className="border-b-2 border-ink pb-1 font-semibold">Homes</span>
          <span className="pb-1 text-ink-secondary">Experiences</span>
          <span className="pb-1 text-ink-secondary">Services</span>
        </div>
        <button
          type="button"
          aria-label="Close search"
          onClick={onClose}
          className="absolute right-4 top-3 flex size-10 items-center justify-center rounded-full bg-surface shadow-pill"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-4">
        <Step
          open={step === "where"}
          title="Where?"
          label="Where"
          value={draft.location || "I’m flexible"}
          onOpen={() => setStep("where")}
        >
          <div className="mt-4 flex h-14 items-center gap-3 rounded-md border border-ink-muted px-4">
            <Search size={18} />
            <input
              autoFocus
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              placeholder="Search destinations"
              className="w-full bg-transparent text-md outline-none placeholder:text-ink-secondary"
            />
          </div>
          <p className="mb-2 mt-5 text-base">Suggested destinations</p>
          <ul className="max-h-[300px] overflow-y-auto">
            <li>
              <Row
                icon={<Navigation size={22} className="text-ink-secondary" />}
                title="Nearby"
                note="Find what’s around you"
                onClick={() => {
                  setDraft({ ...draft, location: "" });
                  setStep("when");
                }}
              />
            </li>
            {suggestions.map((d) => (
              <li key={d.name}>
                <Row
                  title={d.name}
                  note={d.note}
                  onClick={() => {
                    setDraft({ ...draft, location: d.name });
                    setStep("when");
                  }}
                />
              </li>
            ))}
          </ul>
        </Step>

        <Step
          open={step === "when"}
          title="When?"
          label="When"
          value={start && end ? formatRange(start, end) : "Add dates"}
          onOpen={() => setStep("when")}
        >
          <div className="mt-4 max-h-[52dvh] overflow-y-auto">
            <DateRangeCalendar value={draft.dates} onChange={(dates) => setDraft({ ...draft, dates })} vertical cell={44} className="mx-auto w-fit" />
          </div>
        </Step>

        <Step open={step === "who"} title="Who?" label="Who" value={guestText || "Add guests"} onOpen={() => setStep("who")}>
          <GuestStepper value={draft.guests} onChange={(guests) => setDraft({ ...draft, guests })} />
        </Step>
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-line-soft bg-surface-subtle px-6 py-4">
        {step === "when" ? (
          <>
            <button type="button" className="text-md font-medium underline" onClick={() => setDraft({ ...draft, dates: { start: null, end: null } })}>
              Reset
            </button>
            <button type="button" className="h-12 rounded-md bg-ink px-8 text-md font-medium text-white" onClick={() => setStep("who")}>
              Next
            </button>
          </>
        ) : (
          <>
            <button type="button" className="text-md font-medium underline" onClick={clear}>
              Clear all
            </button>
            <button
              type="button"
              className="flex h-12 items-center gap-2 rounded-md bg-brand-gradient px-6 text-md font-medium text-white"
              onClick={() => {
                onClose();
                submit();
              }}
            >
              <Search size={16} strokeWidth={2.5} /> Search
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Step({
  open,
  title,
  label,
  value,
  onOpen,
  children,
}: {
  open: boolean;
  title: string;
  label: string;
  value: string;
  onOpen: () => void;
  children: React.ReactNode;
}) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="flex h-14 shrink-0 items-center justify-between rounded-card bg-surface px-6 text-base shadow-pill"
      >
        <span className="text-ink-secondary">{label}</span>
        <span className="font-medium">{value}</span>
      </button>
    );
  }
  return (
    <section className={clsx("shrink-0 rounded-modal bg-surface p-6 shadow-sheet-card")}>
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ title, note, icon, onClick }: { title: string; note: string; icon?: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-4 py-2 text-left">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-surface-control">
        {icon ?? <span className="text-lg font-semibold text-brand">{title[0]}</span>}
      </span>
      <span>
        <span className="block text-md font-medium">{title}</span>
        <span className="block text-md text-ink-secondary">{note}</span>
      </span>
    </button>
  );
}
