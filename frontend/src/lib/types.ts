export type Host = { id: number; name: string; avatar_url: string | null; is_superhost: boolean };

export type ListingCard = {
  id: number;
  title: string;
  city: string;
  state: string;
  country: string;
  property_type: string;
  room_type: string;
  category: string;
  lat: number | null;
  lng: number | null;
  price_per_night: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  max_guests: number;
  avg_rating: number;
  review_count: number;
  is_guest_favourite: boolean;
  host: Host;
  photos: string[];
  is_wishlisted: boolean;
  quote: { nights: number; total: number } | null;
};

export type PriceHistogram = { min: number; max: number; buckets: number[] };

export type ListingPage = {
  items: ListingCard[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  price_histogram: PriceHistogram;
};

export type Amenity = { id: number; name: string; icon_key: string; group: string };
export type Category = { key: string; label: string; icon_key: string };
export type User = { id: number; email: string; name: string; avatar_url: string | null; role: "guest" | "host"; is_superhost: boolean };
export type TokenResponse = { access_token: string; user: User };
