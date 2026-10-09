"use client";

import { ArrowLeft, Search, SlidersHorizontal } from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { formatRange, guestSummary } from "@/lib/format";
import { useSearchDraft } from "@/lib/useSearchDraft";
import { Logo } from "./Logo";
import { MobileSearchSheet } from "./MobileSearchSheet";
import { ProfileMenu } from "./ProfileMenu";
import { SearchBar, type Segment } from "./SearchBar";
import { useToast } from "./ui/Toast";

type Props = {
  /** home: expanded until scrolled. results/plain: compact until the pill is clicked. */
  variant: "home" | "results" | "plain";
  /** Rendered under the main row inside the sticky header (category row, filter chips). */
  bottom?: React.ReactNode;
  /** Mobile results header: the filters button. */
  mobileAction?: React.ReactNode;
};

export function Header({ variant, bottom, mobileAction }: Props) {
  const draftApi = useSearchDraft();
  const { draft } = draftApi;
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [scrolled, setScrolled] = useState(false);
  const [forced, setForced] = useState<Segment | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      if (window.scrollY > 8 && !popoverOpen) setForced(null);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [popoverOpen]);

  const onOpenChange = useCallback((open: boolean) => {
    setPopoverOpen(open);
    if (!open) setForced(null);
  }, []);

  const expanded = forced !== null || (variant === "home" && !scrolled);
  const { start, end } = draft.dates;
  const guestText = guestSummary(draft.guests.adults, draft.guests.children, draft.guests.infants, draft.guests.pets);
  const dateText = start && end ? formatRange(start, end) : "Anytime";
  const placeText = draft.location || "Anywhere";

  const tab = (label: string, href: string | null, active: boolean) =>
    href ? (
      <Link
        href={href}
        className={clsx(
          "flex h-9 items-center border-b-2 px-4 text-base transition-colors duration-200 ease-airy",
          active ? "border-ink font-medium text-ink" : "border-transparent text-ink-secondary hover:text-ink",
        )}
      >
        {label}
      </Link>
    ) : (
      <button
        type="button"
        onClick={() => toast.show(`${label} are coming soon`)}
        className="flex h-9 items-center border-b-2 border-transparent px-4 text-base text-ink-secondary transition-colors duration-200 ease-airy hover:text-ink"
      >
        {label}
      </button>
    );

  return (
    <header className={clsx("sticky top-0 z-50 bg-surface", (!expanded || bottom) && "shadow-header")}>
      {/* ───────── desktop / tablet ───────── */}
      <div className={clsx("hidden px-8 md:block xl:px-12", expanded && "bg-linear-to-b from-surface to-surface-subtle")}>
        <div className={clsx("grid grid-cols-[1fr_auto_1fr] items-center", expanded ? "h-header" : "h-header-compact")}>
          <div>
            <Logo />
          </div>
          {expanded ? (
            <nav aria-label="Sections" className="flex gap-2">
              {tab("Stays", "/s", pathname.startsWith("/s") || pathname === "/")}
              {tab("Experiences", null, false)}
              {tab("Services", null, false)}
            </nav>
          ) : (
            <button
              type="button"
              aria-label="Start your search"
              onClick={() => setForced("where")}
              className="flex h-12 items-center rounded-pill border border-line bg-surface pl-2 pr-2 text-base shadow-pill transition-shadow duration-200 ease-airy hover:shadow-modal"
            >
              <span className="px-4 font-medium">{placeText}</span>
              <span className="h-6 w-px bg-line" />
              <span className="px-4 font-medium">{dateText}</span>
              <span className="h-6 w-px bg-line" />
              <span className={clsx("px-4", guestText ? "font-medium" : "text-ink-secondary")}>{guestText || "Add guests"}</span>
              <span className="flex size-8 items-center justify-center rounded-full bg-brand-gradient text-white">
                <Search size={14} strokeWidth={2.5} />
              </span>
            </button>
          )}
          <div className="flex justify-end">
            <ProfileMenu />
          </div>
        </div>
        {expanded && (
          <div className="pb-6 pt-1.5">
            <SearchBar {...draftApi} initialSegment={forced} onOpenChange={onOpenChange} />
          </div>
        )}
      </div>

      {/* ───────── phones ───────── */}
      <div className="px-6 pb-2 pt-3 md:hidden">
        {variant === "results" ? (
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Back" onClick={() => router.push("/")} className="flex size-10 shrink-0 items-center justify-center">
              <ArrowLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="min-w-0 flex-1 rounded-pill border border-line px-6 py-2 text-center shadow-pill"
            >
              <span className="block truncate text-base font-semibold">{draft.location ? `Homes in ${draft.location}` : "Anywhere"}</span>
              <span className="block truncate text-sm text-ink-secondary">
                {dateText === "Anytime" ? "Any week" : dateText} · {guestText || "Add guests"}
              </span>
            </button>
            {mobileAction}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-pill-lg border border-line bg-surface text-base font-medium shadow-pill"
          >
            <Search size={16} strokeWidth={2.5} /> Start your search
          </button>
        )}
        {variant === "home" && (
          <nav aria-label="Sections" className="scrollbar-none -mx-6 mt-4 flex gap-3 overflow-x-auto px-6 pb-1">
            {[
              ["All", "/", true],
              ["Homes", "/s", false],
              ["Experiences", null, false],
              ["Services", null, false],
            ].map(([label, href, active]) =>
              href ? (
                <Link
                  key={label as string}
                  href={href as string}
                  className={clsx(
                    "shrink-0 rounded-pill-lg px-5 py-2.5 text-base shadow-pill transition-colors duration-200 ease-airy",
                    active ? "bg-surface-control font-medium" : "bg-surface",
                  )}
                >
                  {label as string}
                </Link>
              ) : (
                <button
                  key={label as string}
                  type="button"
                  onClick={() => toast.show(`${label} are coming soon`)}
                  className="shrink-0 rounded-pill-lg bg-surface px-5 py-2.5 text-base shadow-pill"
                >
                  {label as string}
                </button>
              ),
            )}
          </nav>
        )}
      </div>

      {bottom && <div className="px-6 md:px-8 xl:px-12">{bottom}</div>}

      <MobileSearchSheet {...draftApi} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </header>
  );
}

export function FiltersButtonMobile({ onClick, count }: { onClick: () => void; count: number }) {
  return (
    <button type="button" aria-label="Filters" onClick={onClick} className="relative flex size-10 shrink-0 items-center justify-center">
      <SlidersHorizontal size={20} />
      {count > 0 && (
        <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-ink text-2xs text-white">
          {count}
        </span>
      )}
    </button>
  );
}
