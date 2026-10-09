"use client";

import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { formatRangeYear } from "@/lib/format";
import type { Booking, ReviewInput } from "@/lib/types";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { StarInput } from "./StarInput";

const SUBS: { key: Exclude<keyof ReviewInput, "comment" | "rating">; label: string }[] = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "accuracy", label: "Accuracy" },
  { key: "check_in_rating", label: "Check-in" },
  { key: "communication", label: "Communication" },
  { key: "location", label: "Location" },
  { key: "value", label: "Value" },
];

const EMPTY = { rating: 0, cleanliness: 0, accuracy: 0, check_in_rating: 0, communication: 0, location: 0, value: 0 };

export function ReviewModal({ booking, onClose, onDone }: { booking: Booking | null; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [stars, setStars] = useState(EMPTY);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const complete = Object.values(stars).every((v) => v > 0);

  async function submit() {
    if (!booking || !complete) return;
    setBusy(true);
    setError(null);
    try {
      await api.reviewBooking(booking.id, { ...stars, comment: comment.trim() });
      toast.show("Thanks for your review");
      setStars(EMPTY);
      setComment("");
      onDone();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t save your review. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={booking !== null}
      onClose={onClose}
      title="Leave a review"
      variant="sheet"
      className="md:w-[568px]"
      footer={
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <p className="text-base text-ink-secondary">{complete ? "" : "Rate all categories to submit"}</p>
          <button
            type="button"
            disabled={!complete || busy}
            onClick={submit}
            className="h-12 rounded-md bg-ink px-8 text-md font-medium text-white transition-transform duration-200 ease-airy active:scale-[0.98] disabled:bg-surface-control disabled:text-ink-disabled"
          >
            {busy ? "Submitting…" : "Submit review"}
          </button>
        </div>
      }
    >
      {booking && (
        <div className="px-6 py-6">
          <h3 className="text-xl font-medium">{booking.listing.title}</h3>
          <p className="mt-1 text-base text-ink-secondary">
            {booking.listing.city} · {formatRangeYear(booking.check_in, booking.check_out)}
          </p>

          <p className="mb-2 mt-6 text-md font-semibold">Overall rating</p>
          <StarInput label="Overall rating" value={stars.rating} onChange={(n) => setStars((s) => ({ ...s, rating: n }))} size={32} />

          <ul className="mt-6 divide-y divide-line-soft">
            {SUBS.map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-4 py-3">
                <span className="text-md">{s.label}</span>
                <StarInput label={s.label} value={stars[s.key]} onChange={(n) => setStars((p) => ({ ...p, [s.key]: n }))} size={20} />
              </li>
            ))}
          </ul>

          <label className="mt-6 block">
            <span className="mb-2 block text-md font-semibold">Tell future guests about your stay</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="What did you love? Anything to know?"
              className="w-full resize-none rounded-md border border-ink-muted p-4 text-md outline-none focus:border-2 focus:border-ink"
            />
          </label>
          {error && (
            <p role="alert" className="mt-3 text-base text-brand-deep">
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
