"use client";

import { SlidersHorizontal } from "lucide-react";
import { clsx } from "clsx";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "./AuthProvider";
import { formatRange } from "@/lib/format";
import { CategoryRow } from "./CategoryRow";
import { FiltersModal } from "./FiltersModal";
import { Footer } from "./Footer";
import { FiltersButtonMobile, Header } from "./Header";
import { ListingCard } from "./ListingCard";
import { MapPlaceholder } from "./MapPlaceholder";
import { Pagination } from "./Pagination";
import { activeFilterCount, stateFromParams, toQuery, type SearchState } from "@/lib/search";
import { useCatalog } from "@/lib/useCatalog";
import { useListings } from "@/lib/useListings";

const QUICK_CHIPS = ["Wifi", "Free parking", "Washing machine", "Kitchen", "Air conditioning"];

export function ListingsView({ variant }: { variant: "home" | "search" }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { categories, amenities } = useCatalog();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const state = useMemo(() => stateFromParams(params), [params]);
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = variant === "home" ? 24 : 20;
  const qs = useMemo(() => toQuery(state, { page, page_size: pageSize }), [state, page, pageSize]);
  const listings = useListings(qs, user?.id);
  const data = listings.data;

  const push = useCallback(
    (next: SearchState, nextPage = 1) => router.push(`${pathname}?${toQuery(next, { page: nextPage > 1 ? nextPage : undefined })}`, { scroll: false }),
    [router, pathname],
  );

  const filterCount = activeFilterCount(state);
  const stayQuery = toQuery({
    check_in: state.check_in,
    check_out: state.check_out,
    adults: state.adults,
    children: state.children,
    infants: state.infants,
    pets: state.pets,
  });
  const histogram = data?.price_histogram ?? { min: 0, max: 0, buckets: [] };
  const amenityIds = new Set((state.amenities ?? "").split(",").filter(Boolean));

  const filtersButton = (
    <button
      type="button"
      onClick={() => setFiltersOpen(true)}
      className={clsx(
        "flex shrink-0 items-center gap-2 rounded-chip border px-4 py-2.5 text-base font-medium transition-colors duration-200 ease-airy hover:border-ink",
        filterCount ? "border-2 border-ink bg-surface-subtle" : "border-line",
      )}
    >
      <SlidersHorizontal size={16} /> Filters{filterCount ? ` · ${filterCount}` : ""}
    </button>
  );

  const bottom =
    variant === "home" ? (
      <div className="flex h-[72px] items-center gap-6">
        <CategoryRow categories={categories} selected={state.category} onSelect={(c) => push({ ...state, category: c })} />
        <div className="hidden md:block">{filtersButton}</div>
      </div>
    ) : (
      <div className="scrollbar-none flex h-[72px] items-center gap-2 overflow-x-auto">
        <div className="hidden md:block">{filtersButton}</div>
        {QUICK_CHIPS.map((name) => {
          const a = amenities.find((x) => x.name === name);
          if (!a) return null;
          const on = amenityIds.has(String(a.id));
          return (
            <button
              key={name}
              type="button"
              aria-pressed={on}
              onClick={() => {
                const next = new Set(amenityIds);
                if (!next.delete(String(a.id))) next.add(String(a.id));
                push({ ...state, amenities: [...next].join(",") || undefined });
              }}
              className={clsx(
                "shrink-0 rounded-chip border px-4 py-2.5 text-sm transition-colors duration-200 ease-airy hover:border-ink",
                on ? "border-2 border-ink bg-surface-subtle font-medium" : "border-line",
              )}
            >
              {name}
            </button>
          );
        })}
      </div>
    );

  const gridClass =
    variant === "home"
      ? "grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
      : "grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-3 map:grid-cols-2";

  const grid = (
    <>
      {listings.status === "error" && (
        <p role="alert" className="py-12 text-center text-md text-brand-deep">
          We couldn’t load stays right now. {listings.message}
        </p>
      )}
      {data && data.items.length === 0 && listings.status !== "loading" && (
        <div className="py-20 text-center">
          <h2 className="text-xl font-semibold">No exact matches</h2>
          <p className="mt-2 text-md text-ink-secondary">Try changing or removing some of your filters or dates.</p>
          <button type="button" onClick={() => push({})} className="mt-6 rounded-md bg-ink px-6 py-3 text-md font-medium text-white">
            Remove all filters
          </button>
        </div>
      )}
      <div className={clsx(gridClass, listings.status === "loading" && data && "opacity-60 transition-opacity")}>
        {data
          ? data.items.map((l, i) => (
              <ListingCard
                key={l.id}
                listing={l}
                priority={i < 4}
                query={stayQuery}
                dateLabel={formatRange(state.check_in, state.check_out)}
                aspect={variant === "home" ? "var(--aspect-card-home)" : "var(--aspect-card)"}
              />
            ))
          : Array.from({ length: 8 }, (_, i) => <CardSkeleton key={i} aspect={variant === "home" ? "var(--aspect-card-home)" : "var(--aspect-card)"} />)}
      </div>
      {data && (
        <>
          <Pagination page={data.page} totalPages={data.total_pages} onChange={(p) => { push(state, p); window.scrollTo({ top: 0 }); }} />
          <p className="mt-4 text-center text-base text-ink-secondary">
            Showing {(data.page - 1) * data.page_size + Math.min(1, data.items.length)}–{(data.page - 1) * data.page_size + data.items.length} of {data.total} stays
          </p>
        </>
      )}
    </>
  );

  return (
    <>
      <Header
        variant={variant === "home" ? "home" : "results"}
        bottom={bottom}
        mobileAction={<FiltersButtonMobile count={filterCount} onClick={() => setFiltersOpen(true)} />}
      />
      {variant === "home" ? (
        <main className="px-6 pb-8 pt-8 md:px-8 xl:px-12">{grid}</main>
      ) : (
        <>
          <div className="md:hidden">
            <MapPlaceholder items={data?.items ?? []} className="h-[42dvh] rounded-none border-0" />
          </div>
          <main className="relative -mt-6 rounded-t-modal bg-surface px-6 pt-6 md:mt-0 md:rounded-none md:px-8 md:pt-6 xl:px-12">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line md:hidden" aria-hidden />
            <div className="map:grid map:grid-cols-2 map:gap-6">
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <h1 className="text-md font-medium">
                    {data ? `${data.total >= 1000 ? "Over 1,000" : data.total} stays` : "Searching…"}
                    {state.location ? ` in ${state.location.split(",")[0]}` : ""}
                  </h1>
                  <span className="text-sm text-ink-secondary">Prices include all fees</span>
                </div>
                {grid}
              </div>
              <div className="sticky top-[160px] hidden h-[calc(100dvh-184px)] map:block">
                <MapPlaceholder items={data?.items ?? []} className="h-full" />
              </div>
            </div>
          </main>
        </>
      )}
      <Footer />
      <FiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        state={state}
        histogram={histogram}
        onApply={(next) => push(next)}
      />
    </>
  );
}

function CardSkeleton({ aspect }: { aspect: string }) {
  return (
    <div aria-hidden>
      <div className="animate-pulse rounded-card bg-surface-control" style={{ aspectRatio: aspect }} />
      <div className="mt-3 h-4 w-2/3 animate-pulse rounded-xs bg-surface-control" />
      <div className="mt-2 h-4 w-1/2 animate-pulse rounded-xs bg-surface-control" />
    </div>
  );
}
