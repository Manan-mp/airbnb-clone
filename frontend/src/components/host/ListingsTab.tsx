"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { formatPrice } from "@/lib/format";
import { imgSrc } from "@/lib/img";
import type { HostListing } from "@/lib/types";
import { StatePanel } from "../StatePanel";

export function ListingsTab({ items, onDelete }: { items: HostListing[]; onDelete: (l: HostListing) => void }) {
  if (items.length === 0)
    return <StatePanel title="You have no listings yet" body="Create your first listing and start welcoming guests." action={{ label: "Create a listing", href: "/host/listings/new" }} testId="host-empty" />;

  const head = "hidden text-base text-ink-secondary md:block";
  return (
    <div data-testid="host-listings">
      <div className="hidden grid-cols-[minmax(0,1fr)_96px_120px_96px_160px] gap-6 border-b border-line-soft px-4 pb-3 md:grid">
        <span className={head}>Listing</span>
        <span className={head}>Price</span>
        <span className={head}>Status</span>
        <span className={head}>Upcoming</span>
        <span className={clsx(head, "text-right")}>Actions</span>
      </div>
      <ul className="divide-y divide-line-soft">
        {items.map((l) => (
          <li key={l.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 px-0 py-4 md:grid-cols-[minmax(0,1fr)_96px_120px_96px_160px] md:gap-6 md:px-4" data-testid="host-listing-row">
            <div className="col-span-2 flex min-w-0 items-center gap-4 md:col-span-1">
              <div className="aspect-card w-24 shrink-0 overflow-hidden rounded-sm bg-surface-control md:w-28">
                {l.photos[0] && <img src={imgSrc(l.photos[0], 320)} alt="" loading="lazy" className="size-full object-cover" />}
              </div>
              <div className="min-w-0">
                <Link href={`/rooms/${l.id}`} className="block truncate text-md font-medium hover:underline">{l.title}</Link>
                <p className="truncate text-base text-ink-secondary">{l.city}, {l.state}</p>
                <p className="mt-1 text-base md:hidden">{formatPrice(l.price_per_night)} night · {l.upcoming_bookings} upcoming</p>
              </div>
            </div>
            <p className="hidden text-md md:block">{formatPrice(l.price_per_night)}</p>
            <p className="hidden md:block">
              <span className={clsx("inline-block rounded-badge px-2.5 py-1.5 text-2xs font-semibold", l.is_active ? "bg-surface-control text-success" : "bg-surface-control text-ink-secondary")}>
                {l.is_active ? "Active" : "Archived"}
              </span>
            </p>
            <p className="hidden text-md md:block">{l.upcoming_bookings}</p>
            <div className="col-span-2 flex items-center gap-2 md:col-span-1 md:justify-end">
              <span className={clsx("mr-auto rounded-badge px-2.5 py-1.5 text-2xs font-semibold md:hidden", l.is_active ? "bg-surface-control text-success" : "bg-surface-control text-ink-secondary")}>
                {l.is_active ? "Active" : "Archived"}
              </span>
              {l.is_active ? (
                <>
                  <Link href={`/host/listings/${l.id}/edit`} className="rounded-md border border-ink px-4 py-2 text-base font-medium transition-colors duration-200 ease-airy hover:bg-surface-subtle">
                    Edit
                  </Link>
                  <button type="button" onClick={() => onDelete(l)} className="rounded-md border border-line px-4 py-2 text-base font-medium transition-colors duration-200 ease-airy hover:border-ink">
                    Delete
                  </button>
                </>
              ) : (
                <span className="text-base text-ink-secondary">Hidden from guests</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CreateListingLink() {
  return (
    <Link href="/host/listings/new" aria-label="Create listing" className="flex shrink-0 items-center gap-2 rounded-md bg-ink px-4 py-3 text-md font-medium text-white transition-transform duration-200 ease-airy active:scale-[0.98] sm:px-5">
      <Plus size={16} /> <span className="hidden sm:inline">Create listing</span><span className="sm:hidden">New</span>
    </Link>
  );
}
