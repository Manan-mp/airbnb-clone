"use client";

import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { bookingRef, formatPrice, formatRangeYear, guestSummary, toISO } from "@/lib/format";
import type { Booking, HostListing } from "@/lib/types";
import { Pagination } from "../Pagination";
import { StatePanel } from "../StatePanel";

const PAGE_SIZE = 10;
const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "cancelled", label: "Cancelled" },
];

function statusOf(b: Booking, today: string): { label: string; tone: string } {
  if (b.status === "cancelled") return { label: "Cancelled", tone: "text-brand-deep" };
  if (b.check_out < today) return { label: "Completed", tone: "text-ink-secondary" };
  return { label: b.check_in > today ? "Upcoming" : "In progress", tone: "text-success" };
}

type State = { key: string; status: "ready"; items: Booking[] } | { key: string; status: "error"; message: string };

export function BookingsTab({ listings }: { listings: HostListing[] }) {
  const [listingId, setListingId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [state, setState] = useState<State | null>(null);
  const key = `${listingId}|${status}`;

  useEffect(() => {
    let cancelled = false;
    const qs = new URLSearchParams();
    if (listingId) qs.set("listing_id", listingId);
    if (status) qs.set("status", status);
    api
      .hostBookings(qs.toString())
      .then((items) => !cancelled && setState({ key, status: "ready", items }))
      .catch((e: Error) => !cancelled && setState({ key, status: "error", message: e.message }));
    return () => {
      cancelled = true;
    };
  }, [key, listingId, status]);

  const today = toISO(new Date());
  const select = "h-12 rounded-md border border-line bg-surface px-4 text-md outline-none transition-colors duration-200 ease-airy hover:border-ink focus:border-ink";
  const current = state?.key === key ? state : null;

  let body: React.ReactNode;
  if (!current) body = <p className="py-10 text-md text-ink-secondary" aria-busy="true">Loading bookings…</p>;
  else if (current.status === "error") body = <StatePanel title="We couldn’t load bookings" body={current.message} />;
  else if (current.items.length === 0) body = <StatePanel title="No bookings found" body="Try a different listing or status." testId="host-bookings-empty" />;
  else {
    const totalPages = Math.ceil(current.items.length / PAGE_SIZE);
    const p = Math.min(page, totalPages);
    const rows = current.items.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
    body = (
      <>
        <p className="mb-3 text-base text-ink-secondary">{current.items.length} booking{current.items.length === 1 ? "" : "s"}</p>
        <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,1.2fr)_96px_96px] gap-6 border-b border-line-soft px-4 pb-3 text-base text-ink-secondary md:grid">
          <span>Guest</span>
          <span>Listing</span>
          <span>Dates</span>
          <span>Total</span>
          <span>Status</span>
        </div>
        <ul className="divide-y divide-line-soft" data-testid="host-bookings">
          {rows.map((b) => {
            const st = statusOf(b, today);
            return (
              <li key={b.id} className="grid grid-cols-2 gap-x-6 gap-y-1 py-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,1.2fr)_96px_96px] md:items-center md:px-4" data-testid="host-booking-row">
                <div className="min-w-0">
                  <p className="truncate text-md font-medium">{b.guest_name}</p>
                  <p className="text-base text-ink-secondary">{guestSummary(b.adults, b.children, b.infants, b.pets)} · {bookingRef(b.id)}</p>
                </div>
                <p className={clsx("text-right text-base font-semibold md:order-last md:text-left", st.tone)}>{st.label}</p>
                <p className="col-span-2 truncate text-base md:order-2 md:col-span-1">{b.listing.title}</p>
                <p className="text-base md:order-3">{formatRangeYear(b.check_in, b.check_out)}</p>
                <p className="text-right text-md font-medium md:order-4 md:text-left">{formatPrice(b.total_price)}</p>
              </li>
            );
          })}
        </ul>
        <Pagination page={p} totalPages={totalPages} onChange={(n) => { setPage(n); window.scrollTo({ top: 0 }); }} />
      </>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-3">
        <select aria-label="Filter by listing" value={listingId} onChange={(e) => { setListingId(e.target.value); setPage(1); }} className={clsx(select, "min-w-0 max-w-full")}>
          <option value="">All listings</option>
          {listings.map((l) => (
            <option key={l.id} value={l.id}>{l.title}{l.is_active ? "" : " (archived)"}</option>
          ))}
        </select>
        <select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={select}>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      {body}
    </div>
  );
}
