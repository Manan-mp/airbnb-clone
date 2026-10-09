"use client";

import { clsx } from "clsx";
import { CreditCard } from "lucide-react";
import { digits, formatCardNumber, formatExpiry, type CardErrors, type CardFields } from "./cardFormat";

type Props = { value: CardFields; onChange: (v: CardFields) => void; errors: CardErrors };

/** Mocked payment fields: number / expiry + CVV / PIN code, in one bordered group. */
export function CardForm({ value, onChange, errors }: Props) {
  const cell = (
    key: keyof CardFields,
    label: string,
    props: { placeholder: string; autoComplete: string; max: number; fmt?: (s: string) => string; icon?: boolean; className?: string },
  ) => (
    <label className={clsx("relative block", props.className)}>
      <span className="pointer-events-none absolute left-4 top-2 text-xs text-ink-secondary">{label}</span>
      <input
        value={value[key]}
        onChange={(e) => onChange({ ...value, [key]: props.fmt ? props.fmt(e.target.value) : digits(e.target.value).slice(0, props.max) })}
        inputMode="numeric"
        autoComplete={props.autoComplete}
        placeholder={props.placeholder}
        aria-invalid={!!errors[key]}
        aria-label={label}
        className={clsx(
          "h-14 w-full bg-transparent px-4 pb-1.5 pt-6 text-md outline-none placeholder:text-ink-disabled focus:bg-surface-subtle",
          errors[key] && "bg-surface-subtle",
        )}
      />
      {props.icon && <CreditCard size={20} className="pointer-events-none absolute right-4 top-4 text-ink-secondary" />}
    </label>
  );

  const firstError = errors.number ?? errors.expiry ?? errors.cvv ?? errors.pin;
  return (
    <div>
      <div className={clsx("overflow-hidden rounded-md border", firstError ? "border-brand-deep" : "border-ink-muted")} data-testid="card-form">
        {cell("number", "Card number", { placeholder: "1234 5678 9012 3456", autoComplete: "cc-number", max: 19, fmt: formatCardNumber, icon: true })}
        <div className="grid grid-cols-2 border-t border-ink-muted">
          {cell("expiry", "Expiration", { placeholder: "MM/YY", autoComplete: "cc-exp", max: 4, fmt: formatExpiry, className: "border-r border-ink-muted" })}
          {cell("cvv", "CVV", { placeholder: "123", autoComplete: "cc-csc", max: 4 })}
        </div>
        <div className="border-t border-ink-muted">{cell("pin", "PIN code", { placeholder: "110001", autoComplete: "postal-code", max: 6 })}</div>
      </div>
      {firstError ? (
        <p role="alert" className="mt-2 text-base text-brand-deep">
          {firstError}
        </p>
      ) : (
        <p className="mt-2 text-base text-ink-secondary">Demo checkout: nothing is charged and card details are never stored.</p>
      )}
    </div>
  );
}
