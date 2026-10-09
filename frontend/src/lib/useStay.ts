"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DateRange } from "@/components/DateRangeCalendar";
import type { Guests } from "@/components/GuestStepper";
import { api } from "./api";
import { fromISO, toISO } from "./format";
import type { Availability, ListingDetail, Quote } from "./types";

/** The selected stay (dates + guests) lives in the URL so it can be shared and survives reloads. */
export function useStay(listing: Pick<ListingDetail, "max_guests"> | null) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const dates: DateRange = useMemo(
    () => ({ start: params.get("check_in"), end: params.get("check_out") }),
    [params],
  );
  const guests: Guests = useMemo(
    () => ({
      adults: Math.max(1, Number(params.get("adults")) || 1),
      children: Number(params.get("children")) || 0,
      infants: Number(params.get("infants")) || 0,
      pets: Number(params.get("pets")) || 0,
    }),
    [params],
  );

  const write = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const setDates = useCallback(
    (range: DateRange) => write({ check_in: range.start, check_out: range.end }),
    [write],
  );

  const setGuests = useCallback(
    (g: Guests) => {
      const cap = listing?.max_guests ?? 16;
      let { adults, children } = g;
      // keep adults + children within capacity (infants and pets don't count)
      while (adults + children > cap) {
        if (children > 0) children--;
        else adults--;
      }
      write({
        adults: String(Math.max(1, adults)),
        children: children ? String(children) : null,
        infants: g.infants ? String(g.infants) : null,
        pets: g.pets ? String(g.pets) : null,
      });
    },
    [listing?.max_guests, write],
  );

  const nights = dates.start && dates.end ? Math.round((fromISO(dates.end).getTime() - fromISO(dates.start).getTime()) / 86_400_000) : 0;
  return { dates, guests, nights, setDates, setGuests };
}

export type QuoteState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; quote: Quote }
  | { status: "error"; message: string };

/** Live price from the backend for the selected stay. The client never computes the total. */
export function useQuote(listingId: number | null, dates: DateRange, guests: Guests): QuoteState {
  const qs =
    listingId && dates.start && dates.end
      ? new URLSearchParams({
          check_in: dates.start,
          check_out: dates.end,
          adults: String(guests.adults),
          children: String(guests.children),
          infants: String(guests.infants),
          pets: String(guests.pets),
        }).toString()
      : null;
  const [result, setResult] = useState<{ qs: string; state: QuoteState } | null>(null);

  useEffect(() => {
    if (!qs || !listingId) return;
    const ctrl = new AbortController();
    api
      .quote(listingId, qs, ctrl.signal)
      .then((quote) => setResult({ qs, state: { status: "ready", quote } }))
      .catch((e: Error) => {
        if (e.name !== "AbortError") setResult({ qs, state: { status: "error", message: e.message } });
      });
    return () => ctrl.abort();
  }, [listingId, qs]);

  if (!qs) return { status: "idle" };
  if (result?.qs !== qs) return { status: "loading" };
  return result.state;
}

/** Nights that are already booked, as a lookup for the calendar. */
export function useBlockedNights(listingId: number | null): { isNightBlocked: (iso: string) => boolean; ready: boolean } {
  const [data, setData] = useState<{ id: number; booked: Availability["booked"] } | null>(null);

  useEffect(() => {
    if (!listingId) return;
    const from = toISO(new Date());
    const to = toISO(new Date(Date.now() + 400 * 86_400_000));
    let cancelled = false;
    api
      .availability(listingId, from, to)
      .then((a) => !cancelled && setData({ id: listingId, booked: a.booked }))
      .catch(() => !cancelled && setData({ id: listingId, booked: [] }));
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  const blocked = useMemo(() => {
    const set = new Set<string>();
    if (data && data.id === listingId) {
      for (const b of data.booked) {
        const d = fromISO(b.check_in);
        const end = fromISO(b.check_out);
        while (d < end) {
          set.add(toISO(d));
          d.setDate(d.getDate() + 1);
        }
      }
    }
    return set;
  }, [data, listingId]);

  return { isNightBlocked: (iso: string) => blocked.has(iso), ready: data !== null && data.id === listingId };
}
