"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ListingCard } from "@/components/ListingCard";
import { PageShell } from "@/components/PageShell";
import { LoginPrompt, StatePanel } from "@/components/StatePanel";
import { api } from "@/lib/api";
import type { ListingCard as Listing } from "@/lib/types";

type State = { status: "loading" } | { status: "ready"; items: Listing[] } | { status: "error"; message: string };

export default function WishlistsPage() {
  const { user, ready } = useAuth();
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    document.title = "Wishlists | staybnb";
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api
      .wishlist()
      .then((items) => !cancelled && setState({ status: "ready", items }))
      .catch((e: Error) => !cancelled && setState({ status: "error", message: e.message }));
    return () => {
      cancelled = true;
    };
  }, [user, attempt]);

  let body: React.ReactNode;
  if (!ready) body = <Skeleton />;
  else if (!user) body = <LoginPrompt heading="h2" icon={Heart} title="Log in to see your wishlists" body="Save the places you love and find them here later." />;
  else if (state.status === "loading") body = <Skeleton />;
  else if (state.status === "error")
    body = <StatePanel heading="h2" title="We couldn’t load your wishlist" body={state.message} action={{ label: "Try again", onClick: () => { setState({ status: "loading" }); setAttempt((n) => n + 1); } }} />;
  else if (state.items.length === 0)
    body = <StatePanel heading="h2" icon={Heart} title="No saved places yet" body="As you search, tap the heart on any listing to save it here." action={{ label: "Start exploring", href: "/" }} testId="wishlist-empty" />;
  else
    body = (
      <>
        <p className="mb-6 text-md text-ink-secondary">
          {state.items.length} saved place{state.items.length === 1 ? "" : "s"}
        </p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4 xl:grid-cols-5" data-testid="wishlist-grid">
          {state.items.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              aspect="var(--aspect-card-home)"
              onWishlistChange={(id, on) => {
                if (!on) setState((s) => (s.status === "ready" ? { status: "ready", items: s.items.filter((x) => x.id !== id) } : s));
              }}
            />
          ))}
        </div>
      </>
    );

  return (
    <PageShell>
      <main className="min-h-[60vh] px-6 pb-8 pt-8 md:px-8 xl:px-12">
        <h1 className="mb-2 text-2xl font-semibold">Wishlists</h1>
        {body}
      </main>
    </PageShell>
  );
}

function Skeleton() {
  return (
    <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" aria-busy="true" aria-label="Loading wishlist">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i}>
          <div className="aspect-card-home animate-pulse rounded-card bg-surface-control" />
          <div className="mt-3 h-4 w-2/3 animate-pulse rounded-xs bg-surface-control" />
        </div>
      ))}
    </div>
  );
}
