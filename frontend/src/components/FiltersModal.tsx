"use client";

import { Car, Check, PawPrint, UtensilsCrossed, WashingMachine, type LucideIcon } from "lucide-react";
import { clsx } from "clsx";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { type SearchState, toQuery } from "@/lib/search";
import type { Amenity, PriceHistogram } from "@/lib/types";
import { PriceSlider } from "./PriceSlider";
import { Modal } from "./ui/Modal";

const PROPERTY_TYPES = [
  ["house", "House"],
  ["apartment", "Apartment"],
  ["villa", "Villa"],
  ["cabin", "Cabin"],
  ["farm_stay", "Farm stay"],
  ["treehouse", "Treehouse"],
];

const RECOMMENDED: [string, LucideIcon][] = [
  ["Free parking", Car],
  ["Washing machine", WashingMachine],
  ["Kitchen", UtensilsCrossed],
  ["Allows pets", PawPrint],
];

const ROOM_TYPES: [string | "", string][] = [
  ["", "Any type"],
  ["private_room", "Room"],
  ["entire_home", "Entire home"],
];

type Props = {
  open: boolean;
  onClose: () => void;
  state: SearchState;
  histogram: PriceHistogram;
  onApply: (next: SearchState) => void;
};

export function FiltersModal(props: Props) {
  // Mount only while open so the draft always starts from the applied filters.
  return props.open ? <FiltersForm {...props} /> : null;
}

function FiltersForm({ open, onClose, state, histogram, onApply }: Props) {
  const [draft, setDraft] = useState<SearchState>(state);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  useEffect(() => {
    if (open && amenities.length === 0) api.amenities().then(setAmenities).catch(() => {});
  }, [open, amenities.length]);

  // Live "Show N places" count for the draft filters.
  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      api.listings(toQuery(draft, { page_size: 1 }), ctrl.signal).then((d) => setCount(d.total)).catch(() => {});
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [open, draft]);

  const byName = useMemo(() => new Map(amenities.map((a) => [a.name, a])), [amenities]);
  const selectedAmenities = useMemo(() => new Set((draft.amenities ?? "").split(",").filter(Boolean).map(Number)), [draft.amenities]);
  const selectedTypes = useMemo(() => new Set((draft.property_type ?? "").split(",").filter(Boolean)), [draft.property_type]);

  const set = (patch: SearchState) => setDraft((d) => ({ ...d, ...patch }));
  const toggleAmenity = (id: number) => {
    const next = new Set(selectedAmenities);
    if (!next.delete(id)) next.add(id);
    set({ amenities: [...next].join(",") });
  };
  const toggleType = (t: string) => {
    const next = new Set(selectedTypes);
    if (!next.delete(t)) next.add(t);
    set({ property_type: [...next].join(",") });
  };
  const dirty = draft.min_price || draft.max_price || draft.room_type || draft.property_type || draft.amenities || draft.min_bedrooms || draft.min_beds || draft.min_bathrooms;
  const clear = () => setDraft((d) => ({ ...d, min_price: undefined, max_price: undefined, room_type: undefined, property_type: undefined, amenities: undefined, min_bedrooms: undefined, min_beds: undefined, min_bathrooms: undefined }));

  const section = "border-b border-line-soft px-6 py-8";
  const heading = "mb-6 text-lg font-medium";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filters"
      variant="sheet"
      className="md:w-[568px]"
      footer={
        <div className="flex items-center justify-between px-6 py-4">
          <button type="button" disabled={!dirty} onClick={clear} className="rounded-md px-3 py-3 text-base font-medium underline disabled:text-ink-disabled disabled:no-underline">
            Clear all
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="rounded-md bg-ink px-6 py-3.5 text-md font-medium text-white transition-transform duration-200 ease-airy active:scale-[0.98]"
          >
            {count === null ? "Show places" : count === 0 ? "No exact matches" : `Show ${count} place${count === 1 ? "" : "s"}`}
          </button>
        </div>
      }
    >
      <section className={section}>
        <h3 className={heading}>Recommended for you</h3>
        <div className="grid grid-cols-4 gap-3">
          {RECOMMENDED.map(([name, Icon]) => {
            const a = byName.get(name);
            const on = !!a && selectedAmenities.has(a.id);
            return (
              <button
                key={name}
                type="button"
                disabled={!a}
                aria-pressed={on}
                onClick={() => a && toggleAmenity(a.id)}
                className="group flex flex-col items-center gap-2 text-center text-sm"
              >
                <span
                  className={clsx(
                    "flex aspect-[1.05] w-full items-center justify-center rounded-md border transition-colors duration-200 ease-airy",
                    on ? "border-2 border-ink bg-surface-subtle" : "border-line group-hover:border-ink",
                  )}
                >
                  <Icon size={32} strokeWidth={1.5} />
                </span>
                {name}
              </button>
            );
          })}
        </div>
      </section>

      <section className={section}>
        <h3 className={heading}>Type of place</h3>
        <div className="flex rounded-md border border-line p-1" role="radiogroup" aria-label="Type of place">
          {ROOM_TYPES.map(([value, label]) => {
            const on = (draft.room_type ?? "") === value;
            return (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => set({ room_type: value || undefined })}
                className={clsx(
                  "flex-1 rounded-sm py-3.5 text-base font-medium transition-colors duration-200 ease-airy",
                  on ? "border-2 border-ink bg-surface-subtle" : "border-2 border-transparent hover:bg-surface-subtle",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section className={section}>
        <h3 className="mb-1 text-lg font-medium">Price range</h3>
        <p className="mb-4 text-base text-ink-secondary">Nightly price before fees</p>
        <PriceSlider
          histogram={histogram}
          min={draft.min_price ? Number(draft.min_price) : null}
          max={draft.max_price ? Number(draft.max_price) : null}
          onChange={(a, b) => set({ min_price: a ? String(a) : undefined, max_price: b ? String(b) : undefined })}
        />
      </section>

      <section className={section}>
        <h3 className={heading}>Rooms and beds</h3>
        {(
          [
            ["Bedrooms", "min_bedrooms"],
            ["Beds", "min_beds"],
            ["Bathrooms", "min_bathrooms"],
          ] as const
        ).map(([label, key]) => (
          <div key={key} className="mb-5 last:mb-0">
            <div className="mb-3 text-md">{label}</div>
            <div className="flex flex-wrap gap-2">
              {["", "1", "2", "3", "4", "5"].map((v) => {
                const on = (draft[key] ?? "") === v;
                return (
                  <button
                    key={v || "any"}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set({ [key]: v || undefined })}
                    className={clsx(
                      "min-w-16 rounded-chip border px-5 py-2.5 text-base transition-colors duration-200 ease-airy",
                      on ? "border-ink bg-ink text-white" : "border-line hover:border-ink",
                    )}
                  >
                    {v === "" ? "Any" : v === "5" ? "5+" : v}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className={section}>
        <h3 className={heading}>Property type</h3>
        <div className="grid grid-cols-2 gap-3">
          {PROPERTY_TYPES.map(([value, label]) => {
            const on = selectedTypes.has(value);
            return (
              <button
                key={value}
                type="button"
                aria-pressed={on}
                onClick={() => toggleType(value)}
                className={clsx(
                  "rounded-md border px-4 py-4 text-left text-base font-medium transition-colors duration-200 ease-airy",
                  on ? "border-2 border-ink bg-surface-subtle" : "border-line hover:border-ink",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="px-6 py-8">
        <h3 className={heading}>Amenities</h3>
        <ul className="grid gap-4">
          {(showAllAmenities ? amenities : amenities.slice(0, 8)).map((a) => {
            const on = selectedAmenities.has(a.id);
            return (
              <li key={a.id}>
                <label className="flex cursor-pointer items-center gap-4 text-md">
                  <input type="checkbox" checked={on} onChange={() => toggleAmenity(a.id)} className="peer sr-only" />
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-xs border border-ink-muted text-white transition-colors duration-150 peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2">
                    {on && <Check size={14} strokeWidth={3} />}
                  </span>
                  {a.name}
                </label>
              </li>
            );
          })}
        </ul>
        {amenities.length > 8 && (
          <button type="button" onClick={() => setShowAllAmenities((v) => !v)} className="mt-5 text-base font-semibold underline">
            {showAllAmenities ? "Show less" : `Show all ${amenities.length}`}
          </button>
        )}
      </section>
    </Modal>
  );
}
