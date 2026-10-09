import type { Metadata } from "next";
import { ListingPage } from "@/components/listing/ListingPage";
import { API_URL } from "@/lib/api";
import type { ListingDetail } from "@/lib/types";

/** Render the listing on the server so the photos are in the first HTML; the client takes over after hydration. */
async function load(id: string): Promise<ListingDetail | null> {
  if (!/^\d+$/.test(id)) return null;
  try {
    const res = await fetch(`${API_URL}/api/listings/${id}`, { next: { revalidate: 30 } });
    return res.ok ? ((await res.json()) as ListingDetail) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const listing = await load((await params).id);
  return { title: listing ? `${listing.title} · ${listing.city}` : "Listing" };
}

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingPage id={id} initial={await load(id)} />;
}
