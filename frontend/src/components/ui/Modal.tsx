"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** "sheet" fills the screen from the bottom on mobile; both variants are centred dialogs from md up. */
  variant?: "dialog" | "sheet";
  className?: string;
  hideHeader?: boolean;
  /** Keep the title for screen readers but do not render it in the header. */
  hideTitle?: boolean;
};

export function Modal({ open, onClose, title, children, footer, variant = "dialog", className, hideHeader, hideTitle }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Keep the latest onClose without re-running the focus logic on every parent render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onCloseRef.current();
      if (e.key !== "Tab" || !ref.current) return;
      // focus trap: Tab and Shift+Tab cycle inside the dialog
      const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (items.length === 0) {
        e.preventDefault();
        return ref.current.focus();
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === ref.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (!ref.current.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      opener?.focus?.(); // hand focus back to whatever opened the dialog
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center">
      <div
        className="absolute inset-0 animate-[fade-in_200ms_var(--ease-airy)] bg-scrim"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={clsx(
          "relative flex w-full flex-col overflow-hidden bg-surface shadow-modal outline-none",
          "animate-[sheet-in_300ms_var(--ease-airy)] md:animate-[fade-in_200ms_var(--ease-airy)]",
          variant === "sheet"
            ? "mt-3 max-h-[calc(100dvh-12px)] rounded-t-modal md:mt-0 md:max-h-[820px] md:rounded-modal"
            : "max-h-[calc(100dvh-24px)] rounded-t-modal md:rounded-modal",
          className,
        )}
      >
        {!hideHeader && (
          <div className="relative flex h-16 shrink-0 items-center justify-center border-b border-line-soft">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 flex size-8 items-center justify-center rounded-full transition-colors duration-200 ease-airy hover:bg-surface-control md:right-6"
            >
              <X size={16} />
            </button>
            {title && !hideTitle && <h2 className="text-md font-semibold">{title}</h2>}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="shrink-0 border-t border-line-soft bg-surface">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
