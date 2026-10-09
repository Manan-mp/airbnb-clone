"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import type { ListingPage } from "./types";

export type ListingsState =
  | { status: "loading"; data: ListingPage | null }
  | { status: "ready"; data: ListingPage }
  | { status: "error"; data: ListingPage | null; message: string };

type Result = { key: string; error?: string };

/** Fetches a listing page for a query string; keeps previous data visible while refetching. */
export function useListings(qs: string, refreshKey: unknown = null): ListingsState {
  const key = `${qs}|${String(refreshKey)}`;
  const [data, setData] = useState<ListingPage | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
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
