"use client";

import { Luggage } from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Pagination } from "@/components/Pagination";
import { PageShell } from "@/components/PageShell";
import { LoginPrompt, StatePanel } from "@/components/StatePanel";
import { CancelModal } from "@/components/trips/CancelModal";
import { ReviewModal } from "@/components/trips/ReviewModal";
import { api } from "@/lib/api";
import { bookingRef, formatPrice, formatRangeYear, guestSummary, toISO } from "@/lib/format";
import { imgSrc } from "@/lib/img";
import type { Booking, TripTab } from "@/lib/types";

const PAGE_SIZE = 10;

const TABS: { key: TripTab; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

const EMPTY: Record<TripTab, { title: string; body: string }> = {
  upcoming: { title: "No trips booked… yet", body: "Time to dust off your bags and start planning your next adventure." },
  past: { title: "No past stays", body: "Once you’ve completed a stay it will show up here, ready for a review." },
  cancelled: { title: "No cancelled bookings", body: "Bookings you cancel will be listed here." },
};

type Data = Partial<Record<TripTab, Booking[]>>;

export default function TripsPage() {
  const { user, ready } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const tab: TripTab = TABS.some((t) => t.key === params.get("tab")) ? (params.get("tab") as TripTab) : "upcoming";
  const requestedPage = Math.max(1, Number(params.get("page")) || 1);
  const [data, setData] = useState<Data>({});
  const [error, setError] = useState<string | null>(null);
  const [toCancel, setToCancel] = useState<Booking | null>(null);
  const [toReview, setToReview] = useState<Booking | null>(null);

  useEffect(() => {
    document.title = "Trips | staybnb";
  }, []);

  const load = useCallback((t: TripTab) => {
    api
      .trips(t)
      .then((items) => {
        setError(null);
        setData((d) => ({ ...d, [t]: items }));
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (user && data[tab] === undefined) load(tab);
  }, [user, tab, data, load]);

  const refresh = () => {
    setData({});
    setToCancel(null);
    setToReview(null);
  };

  const items = data[tab];
  const today = toISO(new Date());

  let body: React.ReactNode;
  if (!ready) body = <Skeleton />;
  else if (!user) body = <LoginPrompt icon={Luggage} title="Log in to see your trips" body="Your upcoming, past and cancelled stays live here." />;
  else if (error) body = <StatePanel title="We couldn’t load your trips" body={error} action={{ label: "Try again", onClick: () => load(tab) }} />;
  else if (items === undefined) body = <Skeleton />;
  else if (items.length === 0)
    body = <StatePanel icon={Luggage} title={EMPTY[tab].title} body={EMPTY[tab].body} action={tab === "upcoming" ? { label: "Start searching", href: "/" } : undefined} testId="trips-empty" />;
  else {
    const totalPages = Math.ceil(items.length / PAGE_SIZE);
    const page = Math.min(requestedPage, totalPages);
    const go = (p: number) => {
      router.replace(`/trips?${tab === "upcoming" ? "" : `tab=${tab}&`}${p > 1 ? `page=${p}` : ""}`.replace(/[?&]$/, "") || "/trips", { scroll: false });
      window.scrollTo({ top: 0 });
    };
    body = (
      <>
      <p className="mb-6 text-md text-ink-secondary">
        {items.length} trip{items.length === 1 ? "" : "s"}
      </p>
      <ul className="space-y-6" data-testid="trips-list">
        {items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((b) => (
          <TripCard key={b.id} booking={b} cancellable={b.status === "confirmed" && b.check_in > today} onCancel={() => setToCancel(b)} onReview={() => setToReview(b)} />
        ))}
      </ul>
      <Pagination page={page} totalPages={totalPages} onChange={go} />
      </>
    );
  }

  return (
    <PageShell>
      <main className="mx-auto min-h-[60vh] max-w-content px-6 pb-8 pt-8 md:px-8 xl:px-0">
        <h1 className="mb-6 text-2xl font-semibold">Trips</h1>
        <div role="tablist" aria-label="Trips" className="mb-8 flex gap-2 border-b border-line-soft">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => router.replace(t.key === "upcoming" ? "/trips" : `/trips?tab=${t.key}`, { scroll: false })}
              className={clsx(
                "-mb-px border-b-2 px-4 pb-3 pt-2 text-md transition-colors duration-200 ease-airy",
                tab === t.key ? "border-ink font-medium text-ink" : "border-transparent text-ink-secondary hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {body}
      </main>
      <CancelModal booking={toCancel} onClose={() => setToCancel(null)} onDone={refresh} />
      <ReviewModal key={toReview?.id ?? 0} booking={toReview} onClose={() => setToReview(null)} onDone={refresh} />
    </PageShell>
  );
}

function TripCard({ booking: b, cancellable, onCancel, onReview }: { booking: Booking; cancellable: boolean; onCancel: () => void; onReview: () => void }) {
  const guests = guestSummary(b.adults, b.children, b.infants, b.pets);
  return (
    <li className="flex flex-col gap-4 md:flex-row md:gap-6" data-testid="trip-card">
      <Link href={`/rooms/${b.listing.id}`} className="block shrink-0 md:w-72" aria-label={b.listing.title}>
        <div className="aspect-card overflow-hidden rounded-card bg-surface-control">
          {b.listing.photo && <img src={imgSrc(b.listing.photo, 640)} alt="" loading="lazy" className="size-full object-cover" />}
        </div>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{b.listing.title}</h2>
            <p className="text-md text-ink-secondary">
              {b.listing.city}, {b.listing.state} · Hosted by {b.listing.host_name}
            </p>
          </div>
          {b.status === "cancelled" && <span className="shrink-0 rounded-badge bg-surface-control px-2.5 py-1.5 text-2xs font-semibold">Cancelled</span>}
        </div>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-md">
          <dt className="text-ink-secondary">Dates</dt>
          <dd className="font-medium">{formatRangeYear(b.check_in, b.check_out)} · {b.nights} night{b.nights === 1 ? "" : "s"}</dd>
          <dt className="text-ink-secondary">Guests</dt>
          <dd>{guests}</dd>
          <dt className="text-ink-secondary">Total</dt>
          <dd className="font-medium">{formatPrice(b.total_price)}</dd>
          <dt className="text-ink-secondary">Reference</dt>
          <dd>{bookingRef(b.id)}</dd>
        </dl>
        <div className="mt-5 flex flex-wrap gap-3 md:mt-auto md:pt-5">
          {cancellable && (
            <button type="button" onClick={onCancel} className="rounded-md border border-ink px-5 py-3 text-md font-medium transition-colors duration-200 ease-airy hover:bg-surface-subtle">
              Cancel booking
            </button>
          )}
          {b.can_review && (
            <button type="button" onClick={onReview} className="rounded-md bg-ink px-5 py-3 text-md font-medium text-white transition-transform duration-200 ease-airy active:scale-[0.98]">
              Leave a review
            </button>
          )}
          {b.has_review && <span className="py-3 text-md text-ink-secondary">You reviewed this stay</span>}
        </div>
      </div>
    </li>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading trips">
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-4 md:flex-row md:gap-6">
          <div className="aspect-card animate-pulse rounded-card bg-surface-control md:w-72" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-1/2 animate-pulse rounded-xs bg-surface-control" />
            <div className="h-4 w-1/3 animate-pulse rounded-xs bg-surface-control" />
          </div>
        </div>
      ))}
    </div>
  );
}
