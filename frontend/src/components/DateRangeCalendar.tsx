"use client";

import { addMonths, format, getDaysInMonth, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { useMemo, useState } from "react";
import { fromISO, toISO } from "@/lib/format";

export type DateRange = { start: string | null; end: string | null };

type Props = {
  value: DateRange;
  onChange: (range: DateRange) => void;
  /** First selectable day (ISO). Defaults to today. */
  minDate?: string;
  /** Returns true when the *night* starting on this ISO date is already booked. */
  isNightBlocked?: (iso: string) => boolean;
  /** Months shown side by side (desktop) — ignored when `vertical`. */
  months?: number;
  /** Stacked, scrollable months (mobile sheets). */
  vertical?: boolean;
  /** Day cell size in px. */
  cell?: number;
  className?: string;
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function DateRangeCalendar({
  value,
  onChange,
  minDate,
  isNightBlocked,
  months = 2,
  vertical = false,
  cell = 42,
  className,
}: Props) {
  const today = useMemo(() => toISO(new Date()), []);
  const min = minDate ?? today;
  const [first, setFirst] = useState(() => startOfMonth(value.start ? fromISO(value.start) : new Date()));
  const [hover, setHover] = useState<string | null>(null);

  const blocked = isNightBlocked ?? (() => false);
  const selectingEnd = value.start !== null && value.end === null;

  // While picking a check-out, nothing beyond the first booked night after check-in is reachable.
  const lastReachable = useMemo(() => {
    if (!selectingEnd || !value.start) return null;
    const d = fromISO(value.start);
    for (let i = 0; i < 400; i++) {
      if (blocked(toISO(d))) return toISO(d);
      d.setDate(d.getDate() + 1);
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectingEnd, value.start, isNightBlocked]);

  function disabled(iso: string): boolean {
    if (iso < min) return true;
    if (selectingEnd && value.start) {
      if (iso <= value.start) return false;
      return lastReachable !== null && iso > lastReachable;
    }
    return blocked(iso);
  }

  function pick(iso: string) {
    if (disabled(iso)) return;
    if (!selectingEnd || !value.start || iso <= value.start) {
      if (blocked(iso)) return;
      onChange({ start: iso, end: null });
    } else {
      onChange({ start: value.start, end: iso });
    }
  }

  const previewEnd = value.end ?? (selectingEnd && hover && value.start && hover > value.start ? hover : null);
  const monthList = vertical ? Array.from({ length: 12 }, (_, i) => addMonths(first, i)) : Array.from({ length: months }, (_, i) => addMonths(first, i));
  const canGoBack = startOfMonth(first) > startOfMonth(new Date());

  return (
    <div className={clsx("relative", className)}>
      {!vertical && (
        <>
          <button
            type="button"
            aria-label="Previous month"
            disabled={!canGoBack}
            onClick={() => setFirst(addMonths(first, -1))}
            className="absolute left-0 top-0 flex size-8 items-center justify-center rounded-full transition-colors duration-200 ease-airy hover:bg-surface-control disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setFirst(addMonths(first, 1))}
            className="absolute right-0 top-0 flex size-8 items-center justify-center rounded-full transition-colors duration-200 ease-airy hover:bg-surface-control"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}
      <div className={clsx(vertical ? "flex flex-col gap-8" : "flex justify-center gap-10")}>
        {monthList.map((m) => (
          <Month
            key={m.toISOString()}
            month={m}
            cell={cell}
            vertical={vertical}
            start={value.start}
            end={previewEnd}
            confirmedEnd={value.end}
            disabled={disabled}
            onPick={pick}
            onHover={setHover}
          />
        ))}
      </div>
    </div>
  );
}

function Month(props: {
  month: Date;
  cell: number;
  vertical: boolean;
  start: string | null;
  end: string | null;
  confirmedEnd: string | null;
  disabled: (iso: string) => boolean;
  onPick: (iso: string) => void;
  onHover: (iso: string | null) => void;
}) {
  const { month, cell, start, end } = props;
  const lead = month.getDay();
  const days = getDaysInMonth(month);
  const cells: (string | null)[] = [...Array(lead).fill(null)];
  for (let d = 1; d <= days; d++) cells.push(toISO(new Date(month.getFullYear(), month.getMonth(), d)));

  return (
    <div style={{ width: cell * 7 }}>
      <div className={clsx("mb-4 font-medium", props.vertical ? "text-md" : "text-center text-base")}>
        {format(month, "MMMM yyyy")}
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-ink-secondary" aria-hidden>
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="pb-2">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7" role="grid">
        {cells.map((iso, i) => {
          if (!iso) return <div key={`b${i}`} style={{ height: cell }} />;
          const isStart = iso === start;
          const isEnd = iso === end;
          const inRange = !!start && !!end && iso > start && iso < end;
          const off = props.disabled(iso);
          const col = i % 7;
          const bandLeft = inRange || isEnd;
          const bandRight = inRange || (isStart && !!end);
          return (
            <div
              key={iso}
              className="relative"
              style={{ height: cell }}
              onMouseEnter={() => props.onHover(iso)}
              onMouseLeave={() => props.onHover(null)}
            >
              {(bandLeft || bandRight) && (
                <div
                  className={clsx(
                    "absolute inset-y-0 bg-surface-subtle",
                    bandLeft && bandRight ? "inset-x-0" : bandRight ? "left-1/2 right-0" : "left-0 right-1/2",
                    (col === 0 && (inRange || isEnd)) && "rounded-l-full",
                    (col === 6 && (inRange || (isStart && !!end))) && "rounded-r-full",
                  )}
                />
              )}
              <button
                type="button"
                disabled={off}
                aria-label={format(fromISO(iso), "EEEE, d MMMM yyyy")}
                aria-pressed={isStart || (isEnd && !!props.confirmedEnd)}
                onClick={() => props.onPick(iso)}
                className={clsx(
                  "relative z-10 mx-auto flex items-center justify-center rounded-full border-[1.5px] text-base transition-colors duration-150 ease-airy",
                  isStart || (isEnd && props.confirmedEnd)
                    ? "border-ink bg-ink font-medium text-white"
                    : off
                      ? "cursor-default border-transparent text-ink-muted line-through"
                      : "border-transparent font-medium hover:border-ink",
                  isEnd && !props.confirmedEnd && "border-ink font-medium",
                )}
                style={{ width: cell, height: cell }}
              >
                {Number(iso.slice(8))}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
