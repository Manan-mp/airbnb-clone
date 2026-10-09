"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import type { ListingPage } from "./types";

export type ListingsState =
  | { status: "loading"; data: ListingPage | null }
  | { status: "ready"; data: ListingPage }
  | { status: "error"; data: ListingPage | null; message: string };

type Result = { key: string; error?: string };

/** Fetches a listing page for a query string; keeps previous data visible while refetching. */
export function useListings(qs: string, refreshKey: unknown = null, initial?: { qs: string; data: ListingPage } | null): ListingsState {
  const key = `${qs}|${String(refreshKey)}`;
  // Server-rendered first page: used for the very first render of the matching query, then refetched on change.
  const seeded = initial && initial.qs === qs ? initial : null;
  const [data, setData] = useState<ListingPage | null>(seeded?.data ?? null);
  const [result, setResult] = useState<Result | null>(seeded ? { key } : null);
  const seededKey = useRef(seeded ? key : null);

  useEffect(() => {
    if (seededKey.current === key) return; // already have this page from the server
    const ctrl = new AbortController();
    api
      .listings(qs, ctrl.signal)
      .then((d) => {
        setData(d);
        setResult({ key });
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setResult({ key, error: e.message });
      });
    return () => ctrl.abort();
  }, [qs, key]);

  if (result?.key !== key) return { status: "loading", data };
  if (result.error) return { status: "error", data, message: result.error };
  return { status: "ready", data: data as ListingPage };
}
