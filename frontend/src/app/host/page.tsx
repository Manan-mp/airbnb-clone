"use client";

import { clsx } from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BookingsTab } from "@/components/host/BookingsTab";
import { DeleteListingModal } from "@/components/host/DeleteListingModal";
import { HostGate } from "@/components/host/HostGate";
import { CreateListingLink, ListingsTab } from "@/components/host/ListingsTab";
import { PageShell } from "@/components/PageShell";
import { StatePanel } from "@/components/StatePanel";
import { api } from "@/lib/api";
import type { HostListing } from "@/lib/types";

const TABS = [
  { key: "listings", label: "Listings" },
  { key: "bookings", label: "Bookings" },
] as const;

export default function HostPage() {
  return <HostGate>{() => <Dashboard />}</HostGate>;
}

function Dashboard() {
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get("tab") === "bookings" ? "bookings" : "listings";
  const [items, setItems] = useState<HostListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<HostListing | null>(null);

  useEffect(() => {
    document.title = "Host dashboard | staybnb";
  }, []);

  const load = useCallback(() => {
    api
      .hostListings()
      .then((l) => {
        setError(null);
        setItems(l);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  let body: React.ReactNode;
  if (error) body = <StatePanel heading="h2" title="We couldn’t load your dashboard" body={error} action={{ label: "Try again", onClick: load }} />;
  else if (!items) body = <p className="py-10 text-md text-ink-secondary" aria-busy="true">Loading…</p>;
  else if (tab === "listings") body = <ListingsTab items={items} onDelete={setToDelete} />;
  else body = <BookingsTab listings={items} />;

  return (
    <PageShell>
      <main className="mx-auto min-h-[60vh] max-w-content px-6 pb-8 pt-8 md:px-8 xl:px-0">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Host dashboard</h1>
          <CreateListingLink />
        </div>
        <div role="tablist" aria-label="Host dashboard" className="mb-8 flex gap-2 border-b border-line-soft">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => router.replace(t.key === "listings" ? "/host" : `/host?tab=${t.key}`, { scroll: false })}
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
      <DeleteListingModal
        listing={toDelete}
        onClose={() => setToDelete(null)}
        onDone={() => {
          setToDelete(null);
          load();
        }}
      />
    </PageShell>
  );
}
