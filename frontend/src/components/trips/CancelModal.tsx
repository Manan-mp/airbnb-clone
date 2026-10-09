"use client";

import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { formatPrice, formatRangeYear } from "@/lib/format";
import type { Booking } from "@/lib/types";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";

export function CancelModal({ booking, onClose, onDone }: { booking: Booking | null; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function cancel() {
    if (!booking) return;
    setBusy(true);
    try {
      await api.cancelBooking(booking.id);
      toast.show("Your booking was cancelled");
      onDone();
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : "Couldn’t cancel this booking", "error");
      onDone(); // the trip may have changed (already cancelled / started): refresh the list
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={booking !== null}
      onClose={onClose}
      title="Cancel this booking?"
      className="md:w-[480px]"
      footer={
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-3 text-md font-semibold underline transition-colors duration-200 ease-airy hover:bg-surface-control">
            Keep booking
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={cancel}
            className="h-12 rounded-md bg-ink px-6 text-md font-medium text-white transition-transform duration-200 ease-airy active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? "Cancelling…" : "Cancel booking"}
          </button>
        </div>
      }
    >
      {booking && (
        <div className="px-6 py-6">
          <p className="text-md font-medium">{booking.listing.title}</p>
          <p className="mt-1 text-base text-ink-secondary">
            {booking.listing.city} · {formatRangeYear(booking.check_in, booking.check_out)} · {formatPrice(booking.total_price)}
          </p>
          <p className="mt-4 text-md">
            Bookings can be cancelled any time before check-in. Once cancelled, the dates open up for other guests and
            this can’t be undone.
          </p>
        </div>
      )}
    </Modal>
  );
}
