export const SEARCH_KEYS = [
  "location",
  "check_in",
  "check_out",
  "adults",
  "children",
  "infants",
  "pets",
  "category",
  "min_price",
  "max_price",
  "room_type",
  "property_type",
  "amenities",
  "min_bedrooms",
  "min_beds",
  "min_bathrooms",
  "sort",
] as const;

export type SearchState = Partial<Record<(typeof SEARCH_KEYS)[number], string>>;

export function stateFromParams(params: URLSearchParams): SearchState {
  const s: SearchState = {};
  for (const k of SEARCH_KEYS) {
    const v = params.get(k);
    if (v) s[k] = v;
  }
  return s;
}

export function toQuery(state: SearchState, extra: Record<string, string | number | undefined> = {}): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(state)) if (v) p.set(k, v);
  for (const [k, v] of Object.entries(extra)) if (v !== undefined && v !== "") p.set(k, String(v));
  return p.toString();
}

export const num = (v?: string) => (v ? Number(v) || 0 : 0);

export function activeFilterCount(s: SearchState): number {
  let n = 0;
  if (s.min_price || s.max_price) n++;
  if (s.room_type) n++;
  if (s.property_type) n += s.property_type.split(",").length;
  if (s.amenities) n += s.amenities.split(",").length;
  if (s.min_bedrooms) n++;
  if (s.min_beds) n++;
  if (s.min_bathrooms) n++;
  return n;
}
