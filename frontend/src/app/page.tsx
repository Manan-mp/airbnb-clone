import { ListingsView } from "@/components/ListingsView";
import { API_URL } from "@/lib/api";
import { stateFromParams, toQuery } from "@/lib/search";
import type { ListingPage } from "@/lib/types";

// useSearchParams makes this route dynamic anyway; say so, so the first page is really server-rendered.
export const dynamic = "force-dynamic";

/** The first page is rendered on the server so its photos are in the initial HTML (faster first paint). */
async function firstPage(): Promise<{ qs: string; data: ListingPage } | null> {
  const qs = toQuery(stateFromParams(new URLSearchParams()), { page: 1, page_size: 24 });
  try {
    const res = await fetch(`${API_URL}/api/listings?${qs}`, { next: { revalidate: 30 } });
    return res.ok ? { qs, data: (await res.json()) as ListingPage } : null;
  } catch {
    return null; // API down at render time: the client will fetch and show its own retry
  }
}

export default async function HomePage() {
  return <ListingsView variant="home" initial={await firstPage()} />;
}
