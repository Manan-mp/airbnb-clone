/** Mock card form helpers: format only, nothing is validated against a bank. */
export const digits = (s: string) => s.replace(/\D/g, "");

export function formatCardNumber(raw: string): string {
  return digits(raw).slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
}

export function formatExpiry(raw: string): string {
  const d = digits(raw).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export type CardFields = { number: string; expiry: string; cvv: string; pin: string };
export type CardErrors = Partial<Record<keyof CardFields, string>>;

export function validateCard(f: CardFields): CardErrors {
  const e: CardErrors = {};
  const n = digits(f.number).length;
  if (n < 13 || n > 19) e.number = "Enter a valid card number";
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(f.expiry)) e.expiry = "Use MM/YY";
  if (!/^\d{3,4}$/.test(f.cvv)) e.cvv = "3 or 4 digits";
  if (!/^\d{6}$/.test(f.pin)) e.pin = "Enter a 6-digit PIN code";
  return e;
}
