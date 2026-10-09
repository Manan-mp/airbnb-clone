"use client";

import { CheckCircle2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { bookingRef, formatPrice, formatRangeYear, guestSummary } from "@/lib/format";
import { imgSrc } from "@/lib/img";
import type { Booking } from "@/lib/types";
import { useAuth } from "../AuthProvider";
import { PageShell } from "../PageShell";
import { LoginPrompt, StatePanel } from "../StatePanel";

type State = { status: "loading" } | { status: "ready"; booking: Booking } | { status: "error"; message: string };

export function ConfirmedPage() {
  const id = useSearchParams().get("booking");
  const { user, ready } = useAuth();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    document.title = "Booking confirmed | staybnb";
  }, []);

  useEffect(() => {
    if (!user || !id) return;
    let cancelled = false;
    api
      .booking(id)
      .then((booking) => !cancelled && setState({ status: "ready", booking }))
      .catch((e: Error) => !cancelled && setState({ status: "error", message: e.message }));
    return () => {
      cancelled = true;
    };
  }, [user, id]);

  let body: React.ReactNode;
  if (!id) body = <StatePanel icon={TriangleAlert} title="No booking to show" action={{ label: "Go to my trips", href: "/trips" }} />;
  else if (!ready) body = null;
  else if (!user) body = <LoginPrompt title="Log in to see your booking" body="Your confirmation is tied to your account." />;
  else if (state.status === "error") body = <StatePanel icon={TriangleAlert} title="We couldn’t load this booking" body={state.message} action={{ label: "Go to my trips", href: "/trips" }} />;
  else if (state.status === "loading") body = null;
  else {
    const b = state.booking;
    body = (
      <div className="mx-auto max-w-[640px] px-6 py-10 md:py-16" data-testid="booking-confirmed">
        <CheckCircle2 size={48} className="text-success" />
        <h1 className="mt-4 text-2xl font-semibold">Your booking is confirmed</h1>
        <p className="mt-2 text-md text-ink-secondary">
          Booking reference <span className="font-semibold text-ink" data-testid="booking-ref">{bookingRef(b.id)}</span>
        </p>

        <div className="mt-8 overflow-hidden rounded-md border border-line">
          <div className="aspect-gallery bg-surface-control">
            {b.listing.photo && <img src={imgSrc(b.listing.photo, 1000)} alt="" className="size-full object-cover" />}
          </div>
          <div className="p-6">
            <h2 className="text-lg font-semibold">{b.listing.title}</h2>
            <p className="text-md text-ink-secondary">
              {b.listing.city}, {b.listing.state} · Hosted by {b.listing.host_name}
            </p>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-md">
              <dt className="text-ink-secondary">Dates</dt>
              <dd className="font-medium">{formatRangeYear(b.check_in, b.check_out)}</dd>
              <dt className="text-ink-secondary">Guests</dt>
              <dd>{guestSummary(b.adults, b.children, b.infants, b.pets)}</dd>
              <dt className="text-ink-secondary">Total</dt>
              <dd className="font-medium">{formatPrice(b.total_price)}</dd>
            </dl>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/trips" className="h-12 rounded-md bg-brand-gradient px-8 py-3.5 text-md font-medium text-white transition-transform duration-200 ease-airy active:scale-[0.98]">
            View my trips
          </Link>
          <Link href="/" className="h-12 rounded-md border border-ink px-8 py-3.5 text-md font-medium transition-colors duration-200 ease-airy hover:bg-surface-subtle">
            Keep exploring
          </Link>
        </div>
      </div>
    );
  }
  return <PageShell>{body ?? <div className="min-h-[60vh]" aria-busy="true" />}</PageShell>;
}
