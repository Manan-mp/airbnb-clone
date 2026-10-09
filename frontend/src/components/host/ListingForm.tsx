"use client";

import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import type { ListingDetail, ListingInput } from "@/lib/types";
import { useCatalog } from "@/lib/useCatalog";
import { useToast } from "../ui/Toast";
import { PhotoManager } from "./PhotoManager";

const PROPERTY_TYPES = ["house", "apartment", "villa", "cabin", "farm_stay", "guest_house", "treehouse", "room"];
const ROOM_TYPES = [
  { value: "entire_home", label: "Entire home" },
  { value: "private_room", label: "Private room" },
  { value: "shared_room", label: "Shared room" },
];
const label = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

type Values = {
  title: string;
  description: string;
  property_type: string;
  room_type: string;
  category: string;
  address: string;
  city: string;
  state: string;
  country: string;
  lat: string;
  lng: string;
  price_per_night: string;
  cleaning_fee: string;
  max_guests: string;
  bedrooms: string;
  beds: string;
  bathrooms: string;
  photo_urls: string[];
  amenity_ids: number[];
};
type Errors = Partial<Record<keyof Values, string>>;

function initial(l?: ListingDetail): Values {
  return {
    title: l?.title ?? "",
    description: l?.description ?? "",
    property_type: l?.property_type ?? "house",
    room_type: l?.room_type ?? "entire_home",
    category: l?.category ?? "",
    address: l?.address ?? "",
    city: l?.city ?? "",
    state: l?.state ?? "",
    country: l?.country ?? "India",
    lat: l?.lat != null ? String(l.lat) : "",
    lng: l?.lng != null ? String(l.lng) : "",
    price_per_night: l ? String(l.price_per_night) : "",
    cleaning_fee: l ? String(l.cleaning_fee) : "0",
    max_guests: l ? String(l.max_guests) : "2",
    bedrooms: l ? String(l.bedrooms) : "1",
    beds: l ? String(l.beds) : "1",
    bathrooms: l ? String(l.bathrooms) : "1",
    photo_urls: l?.photo_details.map((p) => p.url) ?? [],
    amenity_ids: l?.amenities.map((a) => a.id) ?? [],
  };
}

const int = (s: string) => (s.trim() === "" ? NaN : Number(s));

/** Mirrors the API limits so most mistakes show before sending; anything else comes back from the API per field. */
function validate(v: Values): Errors {
  const e: Errors = {};
  if (v.title.trim().length < 3) e.title = "Give your place a title of at least 3 characters";
  if (v.description.trim().length < 10) e.description = "Describe your place in at least 10 characters";
  if (!v.category) e.category = "Choose a category";
  if (!v.city.trim()) e.city = "City is required";
  if (!(int(v.price_per_night) > 0)) e.price_per_night = "Enter a price per night above 0";
  const guests = int(v.max_guests);
  if (!(guests >= 1 && guests <= 16)) e.max_guests = "Between 1 and 16 guests";
  if (v.photo_urls.length === 0) e.photo_urls = "Add at least one photo";
  for (const k of ["cleaning_fee", "bedrooms", "bathrooms"] as const) if (!(int(v[k]) >= 0)) e[k] = "Enter 0 or more";
  if (!(int(v.beds) >= 1)) e.beds = "At least 1 bed";
  for (const k of ["lat", "lng"] as const) if (v[k].trim() !== "" && Number.isNaN(Number(v[k]))) e[k] = "Enter a number";
  return e;
}

export function ListingForm({ listing }: { listing?: ListingDetail }) {
  const router = useRouter();
  const toast = useToast();
  const { categories, amenities } = useCatalog();
  const [v, setV] = useState<Values>(() => initial(listing));
  const [errors, setErrors] = useState<Errors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const editing = !!listing;

  const set = <K extends keyof Values>(k: K, value: Values[K]) => {
    setV((p) => ({ ...p, [k]: value }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const groups = amenities.reduce<Record<string, typeof amenities>>((acc, a) => ((acc[a.group] ??= []).push(a), acc), {});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    const found = validate(v);
    setErrors(found);
    if (Object.keys(found).length) return focusFirst(found);
    const body: Partial<ListingInput> = {
      title: v.title.trim(),
      description: v.description.trim(),
      property_type: v.property_type,
      room_type: v.room_type,
      category: v.category,
      address: v.address.trim(),
      city: v.city.trim(),
      state: v.state.trim(),
      country: v.country.trim(),
      price_per_night: int(v.price_per_night),
      cleaning_fee: int(v.cleaning_fee),
      max_guests: int(v.max_guests),
      bedrooms: int(v.bedrooms),
      beds: int(v.beds),
      bathrooms: int(v.bathrooms),
      photo_urls: v.photo_urls,
      amenity_ids: v.amenity_ids,
    };
    if (v.lat.trim() !== "") body.lat = Number(v.lat);
    if (v.lng.trim() !== "") body.lng = Number(v.lng);
    setBusy(true);
    try {
      if (listing) await api.updateListing(listing.id, body);
      else await api.createListing(body as ListingInput);
      toast.show(listing ? "Listing saved" : "Listing created");
      router.push("/host");
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError) {
        const fromApi = err.fields as Errors;
        if (Object.keys(fromApi).length) {
          setErrors(fromApi);
          setBanner("Please fix the highlighted fields.");
          focusFirst(fromApi);
        } else setBanner(err.message);
        toast.show(err.message, "error");
      } else setBanner("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-[720px]" data-testid="listing-form">
      <Section title="The basics">
        <Field label="Title" name="title" error={errors.title}>
          <input id="f-title" value={v.title} onChange={(e) => set("title", e.target.value)} maxLength={160} className={input(errors.title)} />
        </Field>
        <Field label="Description" name="description" error={errors.description}>
          <textarea id="f-description" value={v.description} onChange={(e) => set("description", e.target.value)} rows={5} maxLength={5000} className={clsx(input(errors.description), "h-auto py-3")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Property type" name="property_type" error={errors.property_type}>
            <select id="f-property_type" value={v.property_type} onChange={(e) => set("property_type", e.target.value)} className={input(errors.property_type)}>
              {PROPERTY_TYPES.map((p) => <option key={p} value={p}>{label(p)}</option>)}
            </select>
          </Field>
          <Field label="Room type" name="room_type" error={errors.room_type}>
            <select id="f-room_type" value={v.room_type} onChange={(e) => set("room_type", e.target.value)} className={input(errors.room_type)}>
              {ROOM_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="Category" name="category" error={errors.category}>
            <select id="f-category" value={v.category} onChange={(e) => set("category", e.target.value)} className={input(errors.category)}>
              <option value="">Choose…</option>
              {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Location">
        <Field label="Address" name="address" error={errors.address}>
          <input id="f-address" value={v.address} onChange={(e) => set("address", e.target.value)} maxLength={255} className={input(errors.address)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City" name="city" error={errors.city}>
            <input id="f-city" value={v.city} onChange={(e) => set("city", e.target.value)} maxLength={80} className={input(errors.city)} />
          </Field>
          <Field label="State" name="state" error={errors.state}>
            <input id="f-state" value={v.state} onChange={(e) => set("state", e.target.value)} maxLength={80} className={input(errors.state)} />
          </Field>
          <Field label="Country" name="country" error={errors.country}>
            <input id="f-country" value={v.country} onChange={(e) => set("country", e.target.value)} maxLength={80} className={input(errors.country)} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Latitude (optional)" name="lat" error={errors.lat}>
            <input id="f-lat" inputMode="decimal" value={v.lat} onChange={(e) => set("lat", e.target.value)} className={input(errors.lat)} />
          </Field>
          <Field label="Longitude (optional)" name="lng" error={errors.lng}>
            <input id="f-lng" inputMode="decimal" value={v.lng} onChange={(e) => set("lng", e.target.value)} className={input(errors.lng)} />
          </Field>
        </div>
        <p className="text-base text-ink-secondary">
          {editing ? "Leave blank to keep the current coordinates." : "Leave blank to place the pin at the centre of the city, if we know it."}
        </p>
      </Section>

      <Section title="Pricing and space">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price per night (₹)" name="price_per_night" error={errors.price_per_night}>
            <input id="f-price_per_night" inputMode="numeric" value={v.price_per_night} onChange={(e) => set("price_per_night", e.target.value)} className={input(errors.price_per_night)} />
          </Field>
          <Field label="Cleaning fee (₹)" name="cleaning_fee" error={errors.cleaning_fee}>
            <input id="f-cleaning_fee" inputMode="numeric" value={v.cleaning_fee} onChange={(e) => set("cleaning_fee", e.target.value)} className={input(errors.cleaning_fee)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {([["max_guests", "Guests"], ["bedrooms", "Bedrooms"], ["beds", "Beds"], ["bathrooms", "Bathrooms"]] as const).map(([k, l]) => (
            <Field key={k} label={l} name={k} error={errors[k]}>
              <input id={`f-${k}`} inputMode="numeric" value={v[k]} onChange={(e) => set(k, e.target.value)} className={input(errors[k])} />
            </Field>
          ))}
        </div>
      </Section>

      <Section title="Amenities" error={errors.amenity_ids}>
        {Object.entries(groups).map(([group, list]) => (
          <fieldset key={group}>
            <legend className="mb-3 text-md font-medium">{label(group)}</legend>
            <div className="flex flex-wrap gap-2">
              {list.map((a) => {
                const on = v.amenity_ids.includes(a.id);
                return (
                  <label
                    key={a.id}
                    className={clsx(
                      "cursor-pointer rounded-chip border px-4 py-2.5 text-base transition-colors duration-200 ease-airy has-[:focus-visible]:outline",
                      on ? "border-2 border-ink bg-surface-subtle font-medium" : "border-line hover:border-ink",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => set("amenity_ids", on ? v.amenity_ids.filter((x) => x !== a.id) : [...v.amenity_ids, a.id])}
                      className="sr-only"
                    />
                    {a.name}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </Section>

      <Section title="Photos" error={undefined}>
        <p className="-mt-2 text-base text-ink-secondary">The first photo is the cover. Use the arrows to reorder.</p>
        <div id="f-photo_urls">
          <PhotoManager urls={v.photo_urls} onChange={(u) => set("photo_urls", u)} error={errors.photo_urls} />
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-6 border-t border-line-soft bg-surface px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:static md:mx-0 md:border-0 md:px-0">
        {banner && (
          <p role="alert" className="mb-3 text-md text-brand-deep" data-testid="form-banner">
            {banner}
          </p>
        )}
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={() => router.push("/host")} className="rounded-md px-4 py-3 text-md font-semibold underline transition-colors duration-200 ease-airy hover:bg-surface-control">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="h-12 rounded-md bg-ink px-8 text-md font-medium text-white transition-transform duration-200 ease-airy active:scale-[0.98] disabled:opacity-60">
            {busy ? "Saving…" : editing ? "Save changes" : "Create listing"}
          </button>
        </div>
      </div>
    </form>
  );
}

const input = (error?: string) =>
  clsx(
    "h-12 w-full rounded-md border bg-surface px-4 text-md outline-none transition-colors duration-200 ease-airy focus:border-2 focus:border-ink",
    error ? "border-brand-deep" : "border-ink-muted",
  );

function focusFirst(errors: Errors) {
  const first = Object.keys(errors)[0];
  const el = document.getElementById(`f-${first}`);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
  (el as HTMLElement | null)?.focus?.({ preventScroll: true });
}

function Section({ title, children, error }: { title: string; children: React.ReactNode; error?: string }) {
  return (
    <section className="border-b border-line-soft py-8 first:pt-0">
      <h2 className="mb-5 text-xl font-semibold">{title}</h2>
      <div className="space-y-5">{children}</div>
      {error && <p role="alert" className="mt-2 text-base text-brand-deep">{error}</p>}
    </section>
  );
}

function Field({ label, name, error, children }: { label: string; name: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={`f-${name}`} className="mb-1.5 block text-base font-medium">{label}</label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-base text-brand-deep" data-testid={`error-${name}`}>
          {error}
        </p>
      )}
    </div>
  );
}
