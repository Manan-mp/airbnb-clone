"use client";

import { ArrowLeft, Search, SlidersHorizontal } from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { formatRange, guestSummary } from "@/lib/format";
import { useCollapsedOnScroll } from "@/lib/useCollapsedOnScroll";
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
  /** plain variant: render nothing on phones (the page draws its own top controls). */
  hideMobile?: boolean;
};

// Desktop header geometry (px). The in-flow spacer height is constant for a given page, and the
// fixed header only ever moves with transform/opacity, so toggling never changes document layout.
const ROW = 80; // logo / tabs / profile row
const PILL_ROW = 112; // extra height of the expanded search row (6 + 66 + 24 padding + 16 row shift)
const BOTTOM = 72; // category row / filter chips

export function Header({ variant, bottom, mobileAction, hideMobile }: Props) {
  const draftApi = useSearchDraft();
  const { draft } = draftApi;
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [forced, setForced] = useState<Segment | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ segment: Segment; id: number } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const popoverOpen = useRef(false);

  const collapsedByScroll = useCollapsedOnScroll({
    collapseAt: 80,
    expandAt: 20,
    onCollapse: () => {
      if (!popoverOpen.current) setForced(null);
    },
  });

  const onOpenChange = useCallback((open: boolean) => {
    popoverOpen.current = open;
    if (!open) setForced(null);
  }, []);

  const expanded = forced !== null || (variant === "home" && !collapsedByScroll);
  const collapsedH = ROW + (bottom ? BOTTOM : 0);
  const expandedH = collapsedH + PILL_ROW;
  const spacerH = variant === "home" ? expandedH : collapsedH;
  const hide = `${PILL_ROW}px`;

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

  const move = "transition-[transform,opacity] duration-300 ease-airy";

  if (variant === "plain") {
    // Detail/utility pages: an ordinary in-flow header that scrolls away (no collapsing behaviour).
    return (
      <>
        <header className="relative z-40 hidden border-b border-line-soft bg-surface md:block">
          <div className="grid h-header grid-cols-[1fr_auto_1fr] items-center px-8 xl:px-12">
            <div>
              <Logo />
            </div>
            <button
              type="button"
              aria-label="Start your search"
              onClick={() => setSheetOpen(true)}
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
            <div className="flex justify-end">
              <ProfileMenu />
            </div>
          </div>
        </header>
        {!hideMobile && (
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-surface px-6 shadow-header md:hidden">
            <Logo />
            <ProfileMenu />
          </header>
        )}
        <MobileSearchSheet {...draftApi} open={sheetOpen} onClose={() => setSheetOpen(false)} />
      </>
    );
  }

  return (
    <>
      {/* ───────── desktop / tablet: constant-height spacer + fixed layered header ───────── */}
      <div className="hidden md:block" style={{ height: spacerH, overflowAnchor: "none" }} aria-hidden />
      <header
        data-state={expanded ? "expanded" : "collapsed"}
        className="pointer-events-none fixed inset-x-0 top-0 z-50 hidden md:block"
        style={{ height: expandedH }}
      >
        <div
          className={clsx("pointer-events-auto absolute inset-0 bg-surface shadow-header will-change-transform", move)}
          style={{ transform: expanded ? "none" : `translateY(-${hide})` }}
        />
        <div
          className={clsx("pointer-events-none absolute inset-x-0 top-0 bg-linear-to-b from-surface to-surface-subtle", move)}
          style={{ height: ROW + PILL_ROW, opacity: expanded ? 1 : 0 }}
        />

        <div
          className={clsx("pointer-events-auto absolute inset-x-0 top-0 z-(--z-menu) px-8 xl:px-12", move)}
          style={{ height: ROW, transform: expanded ? "translateY(8px)" : "none" }}
        >
          <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center">
            <div>
              <Logo />
            </div>
            <div className="grid place-items-center">
              <nav
                aria-label="Sections"
                inert={!expanded}
                className={clsx("flex gap-2 [grid-area:1/1]", move, expanded ? "opacity-100" : "opacity-0")}
              >
                {tab("Stays", "/s", pathname.startsWith("/s") || pathname === "/")}
                {tab("Experiences", null, false)}
                {tab("Services", null, false)}
              </nav>
              <button
                type="button"
                aria-label="Start your search"
                inert={expanded}
                onClick={() => {
                  setForced("where");
                  setFocusRequest((r) => ({ segment: "where", id: (r?.id ?? 0) + 1 }));
                }}
                className={clsx(
                  "flex h-12 items-center rounded-pill border border-line bg-surface pl-2 pr-2 text-base shadow-pill [grid-area:1/1] hover:shadow-modal",
                  move,
                  expanded ? "pointer-events-none opacity-0" : "opacity-100",
                )}
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
            </div>
            <div className="flex justify-end">
              <ProfileMenu />
            </div>
          </div>
        </div>

        <div
          inert={!expanded}
          className={clsx("absolute inset-x-0 z-(--z-popover) px-8 xl:px-12", move, expanded ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0")}
          style={{ top: ROW + 22, transform: expanded ? "none" : `translateY(-${PILL_ROW / 2}px)` }}
        >
          <SearchBar {...draftApi} focusRequest={focusRequest} onOpenChange={onOpenChange} />
        </div>

        {bottom && (
          <div
            className={clsx("pointer-events-auto absolute inset-x-0 z-(--z-row) px-8 xl:px-12", move)}
            style={{ top: ROW, height: BOTTOM, transform: expanded ? `translateY(${PILL_ROW}px)` : "none" }}
          >
            {bottom}
          </div>
        )}
      </header>

      {/* ───────── phones: ordinary sticky header (its height never depends on scroll) ───────── */}
      <header className="sticky top-0 z-50 bg-surface shadow-header md:hidden">
        <div className="px-6 pb-2 pt-3">
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
        {bottom && <div className="px-6">{bottom}</div>}
      </header>

      <MobileSearchSheet {...draftApi} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
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
