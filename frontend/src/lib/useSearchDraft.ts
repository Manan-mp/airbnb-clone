"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import type { Guests } from "@/components/GuestStepper";
import type { DateRange } from "@/components/DateRangeCalendar";
import { SEARCH_KEYS, num, stateFromParams, toQuery } from "./search";

export type Draft = { location: string; dates: DateRange; guests: Guests };

/** Where / When / Who draft state, seeded from the URL, committed to /s on submit. */
export function useSearchDraft() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = stateFromParams(params);
  const [draft, setDraft] = useState<Draft>({
    location: initial.location ?? "",
    dates: { start: initial.check_in ?? null, end: initial.check_out ?? null },
    guests: {
      adults: num(initial.adults),
      children: num(initial.children),
      infants: num(initial.infants),
      pets: num(initial.pets),
    },
  });

  const submit = useCallback(() => {
    // Keep existing filters (price, amenities…), replace the search triple, reset to page 1.
    const state = stateFromParams(params);
    for (const k of ["location", "check_in", "check_out", "adults", "children", "infants", "pets"] as const) delete state[k];
    const next: Record<string, string> = {};
    if (draft.location.trim()) next.location = draft.location.trim();
    if (draft.dates.start && draft.dates.end) {
      next.check_in = draft.dates.start;
      next.check_out = draft.dates.end;
    }
    const { adults, children, infants, pets } = draft.guests;
    if (adults) next.adults = String(adults);
    if (children) next.children = String(children);
    if (infants) next.infants = String(infants);
    if (pets) next.pets = String(pets);
    delete (state as Record<string, unknown>).page;
    router.push(`/s?${toQuery({ ...state, ...next })}`);
  }, [draft, params, router]);

  const clear = useCallback(
    () => setDraft({ location: "", dates: { start: null, end: null }, guests: { adults: 0, children: 0, infants: 0, pets: 0 } }),
    [],
  );

  return { draft, setDraft, submit, clear, keys: SEARCH_KEYS };
}
