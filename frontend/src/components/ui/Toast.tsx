"use client";

import { Tag } from "lucide-react";
import Link from "next/link";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ToastAction = { label: string; href: string };
type ToastItem = { id: number; message: string; tone: "info" | "error"; action?: ToastAction };
type ToastApi = { show: (message: string, tone?: ToastItem["tone"], action?: ToastAction) => void };

const ToastContext = createContext<ToastApi>({ show: () => {} });
export const useToast = () => useContext(ToastContext);

const DURATION = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const show = useCallback((message: string, tone: ToastItem["tone"] = "info", action?: ToastAction) => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-2), { id, message, tone, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), DURATION);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[200] flex flex-col items-center gap-2 px-4 md:bottom-8"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex max-w-[min(90vw,440px)] animate-[toast-in_250ms_var(--ease-airy)] items-center gap-3 rounded-md bg-surface px-5 py-3 text-md font-medium shadow-modal"
          >
            {t.tone === "info" ? <Tag size={22} className="shrink-0 text-brand" /> : null}
            <span className={t.tone === "error" ? "text-brand-deep" : undefined}>{t.message}</span>
            {t.action && (
              <Link href={t.action.href} className="shrink-0 font-semibold underline">
                {t.action.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
