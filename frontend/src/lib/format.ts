const inr = new Intl.NumberFormat("en-IN");

export const formatPrice = (n: number) => `₹${inr.format(n)}`;

export const formatRating = (n: number) => (n > 0 ? n.toFixed(2).replace(/0$/, "") : "New");

export function toISO(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function fromISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const short = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

export function formatRange(checkIn?: string | null, checkOut?: string | null): string {
  if (!checkIn || !checkOut) return "";
  const a = fromISO(checkIn);
  const b = fromISO(checkOut);
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${short.format(b)}`;
  return `${short.format(a)} – ${short.format(b)}`;
}

export function guestSummary(adults: number, children: number, infants: number, pets: number): string {
  const guests = adults + children;
  if (!guests && !infants && !pets) return "";
  const parts = [];
  if (guests) parts.push(`${guests} guest${guests > 1 ? "s" : ""}`);
  if (infants) parts.push(`${infants} infant${infants > 1 ? "s" : ""}`);
  if (pets) parts.push(`${pets} pet${pets > 1 ? "s" : ""}`);
  return parts.join(", ");
}
