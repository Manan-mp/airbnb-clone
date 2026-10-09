"use client";

import { useState } from "react";
import { fromISO } from "@/lib/format";
import { useIsPhone } from "@/lib/useIsPhone";
import type { ListingDetail } from "@/lib/types";
import { DateRangeCalendar, type DateRange } from "../DateRangeCalendar";
import { GuestStepper, type Guests } from "../GuestStepper";
import { Modal } from "../ui/Modal";

type DatesProps = {
  open: boolean;
  onClose: () => void;
  value: DateRange;
  isNightBlocked: (iso: string) => boolean;
  onSave: (r: DateRange) => void;
};

/** Change the trip dates. The draft only reaches the URL (and the quote) on Save. */
export function DatesModal(props: DatesProps) {
  return props.open ? <DatesModalOpen {...props} /> : null;
}

function DatesModalOpen({ onClose, value, isNightBlocked, onSave }: DatesProps) {
  const phone = useIsPhone();
  const [draft, setDraft] = useState<DateRange>(value);
  const complete = !!(draft.start && draft.end);
  const nights = complete ? Math.round((fromISO(draft.end as string).getTime() - fromISO(draft.start as string).getTime()) / 86_400_000) : 0;
  return (
    <Modal
      open
      onClose={onClose}
      title="Change dates"
      variant="sheet"
      className="md:w-[720px]"
      footer={
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <button
            type="button"
            disabled={!draft.start}
            onClick={() => setDraft({ start: null, end: null })}
            className="text-md font-semibold underline disabled:text-ink-disabled disabled:no-underline"
          >
            Clear dates
          </button>
          <button
            type="button"
            disabled={!complete}
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            className="h-12 rounded-md bg-ink px-8 text-md font-medium text-white transition-transform duration-200 ease-airy active:scale-[0.98] disabled:bg-surface-control disabled:text-ink-disabled"
          >
            {complete ? `Save · ${nights} night${nights === 1 ? "" : "s"}` : "Save"}
          </button>
        </div>
      }
    >
      <div className="px-6 py-6">
        <DateRangeCalendar value={draft} onChange={setDraft} isNightBlocked={isNightBlocked} vertical={phone} cell={phone ? 44 : 42} className="mx-auto w-fit" />
      </div>
    </Modal>
  );
}

type GuestsProps = {
  open: boolean;
  onClose: () => void;
  listing: ListingDetail;
  value: Guests;
  onSave: (g: Guests) => void;
};

export function GuestsModal(props: GuestsProps) {
  return props.open ? <GuestsModalOpen {...props} /> : null;
}

function GuestsModalOpen({ onClose, listing, value, onSave }: GuestsProps) {
  const [draft, setDraft] = useState<Guests>(value);
  return (
    <Modal
      open
      onClose={onClose}
      title="Change guests"
      className="md:w-[480px]"
      footer={
        <div className="flex justify-end px-6 py-4">
          <button
            type="button"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            className="h-12 rounded-md bg-ink px-8 text-md font-medium text-white transition-transform duration-200 ease-airy active:scale-[0.98]"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="px-6 py-2">
        <GuestStepper value={draft} onChange={setDraft} maxGuests={listing.max_guests} minAdults={1} />
        <p className="pb-4 text-base text-ink-secondary">This place has a maximum of {listing.max_guests} guests, not including infants.</p>
      </div>
    </Modal>
  );
}
