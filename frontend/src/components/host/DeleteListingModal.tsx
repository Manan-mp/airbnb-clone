"use client";

import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import type { HostListing } from "@/lib/types";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";

export function DeleteListingModal({ listing, onClose, onDone }: { listing: HostListing | null; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!listing) return;
    setBusy(true);
    setError(null);
    try {
      const { result } = await api.deleteListing(listing.id);
      toast.show(
        result === "archived"
          ? "Listing archived. It has past bookings, so it’s hidden from search but your history is kept."
          : "Listing deleted",
      );
      onDone();
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Couldn’t delete this listing";
      setError(message);
      toast.show(message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={listing !== null}
      onClose={onClose}
      title="Delete this listing?"
      className="md:w-[480px]"
      footer={
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-3 text-md font-semibold underline transition-colors duration-200 ease-airy hover:bg-surface-control">
            Keep listing
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={remove}
            className="h-12 rounded-md bg-ink px-6 text-md font-medium text-white transition-transform duration-200 ease-airy active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? "Deleting…" : "Delete listing"}
          </button>
        </div>
      }
    >
      {listing && (
        <div className="px-6 py-6">
          <p className="text-md font-medium">{listing.title}</p>
          <p className="mt-1 text-base text-ink-secondary">{listing.city}</p>
          <p className="mt-4 text-md">
            Guests will no longer be able to find or book it. If it has past bookings it is archived instead of erased so your
            history and reviews stay intact. Listings with upcoming bookings can’t be deleted.
          </p>
          {error && (
            <p role="alert" className="mt-4 rounded-md bg-surface-subtle px-4 py-3 text-md text-brand-deep" data-testid="delete-error">
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
