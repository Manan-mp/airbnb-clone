"use client";

import { Minus, Plus } from "lucide-react";

export type Guests = { adults: number; children: number; infants: number; pets: number };

const ROWS: { key: keyof Guests; label: string; hint: string; max: number }[] = [
  { key: "adults", label: "Adults", hint: "Ages 13 or above", max: 16 },
  { key: "children", label: "Children", hint: "Ages 2–12", max: 15 },
  { key: "infants", label: "Infants", hint: "Under 2", max: 5 },
  { key: "pets", label: "Pets", hint: "Bringing a service animal?", max: 5 },
];

export function GuestStepper({
  value,
  onChange,
  maxGuests,
  minAdults = 0,
}: {
  value: Guests;
  onChange: (g: Guests) => void;
  /** Adults + children may not exceed this (infants and pets do not count). */
  maxGuests?: number;
  minAdults?: number;
}) {
  const full = maxGuests !== undefined && value.adults + value.children >= maxGuests;
  return (
    <ul className="divide-y divide-line-soft">
      {ROWS.map((row) => {
        const n = value[row.key];
        const set = (v: number) => {
          const next = { ...value, [row.key]: v };
          // children/infants imply at least one adult
          if ((row.key === "children" || row.key === "infants") && v > 0 && next.adults === 0) next.adults = 1;
          onChange(next);
        };
        return (
          <li key={row.key} className="flex items-center justify-between py-4">
            <div>
              <div className="text-md font-medium">{row.label}</div>
              <div className="text-base text-ink-secondary">{row.hint}</div>
            </div>
            <div className="flex items-center gap-4">
              <StepButton label={`Decrease ${row.label.toLowerCase()}`} disabled={n <= (row.key === "adults" ? minAdults : 0)} onClick={() => set(n - 1)}>
                <Minus size={14} />
              </StepButton>
              <span className="w-4 text-center text-md tabular-nums">{n}</span>
              <StepButton label={`Increase ${row.label.toLowerCase()}`} disabled={n >= row.max || (full && (row.key === "adults" || row.key === "children"))} onClick={() => set(n + 1)}>
                <Plus size={14} />
              </StepButton>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function StepButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-full bg-surface-control transition-transform duration-200 ease-airy hover:scale-105 disabled:cursor-not-allowed disabled:text-ink-disabled disabled:hover:scale-100"
    >
      {children}
    </button>
  );
}
