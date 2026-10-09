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

export type PhotoDetail = { id: number; url: string; caption: string | null; position: number };
export type RatingBreakdown = {
  cleanliness: number;
  accuracy: number;
  check_in: number;
  communication: number;
  location: number;
  value: number;
};
export type ListingDetail = ListingCard & {
  description: string;
  address: string;
  cleaning_fee: number;
  photo_details: PhotoDetail[];
  amenities: Amenity[];
  rating_breakdown: RatingBreakdown | null;
  rating_counts: Record<string, number>;
  host_since: number;
};
export type Quote = {
  nights: number;
  nightly_price: number;
  subtotal: number;
  cleaning_fee: number;
  service_fee: number;
  total: number;
};
export type Review = {
  id: number;
  listing_id: number;
  booking_id: number;
  rating: number;
  comment: string;
  created_at: string;
  author: { id: number; name: string; avatar_url: string | null; created_at: string };
};
export type ReviewPage = { items: Review[]; total: number; page: number; page_size: number };
export type Availability = { booked: { check_in: string; check_out: string }[] };

export type Booking = {
  id: number;
  listing: { id: number; title: string; city: string; state: string; photo: string | null; host_name: string };
  guest_name: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  nights: number;
  nightly_price: number;
  cleaning_fee: number;
  service_fee: number;
  total_price: number;
  status: "confirmed" | "cancelled";
  created_at: string;
  has_review: boolean;
  can_review: boolean;
};
export type TripTab = "upcoming" | "past" | "cancelled";
export type ReviewInput = {
  rating: number;
  cleanliness: number;
  accuracy: number;
  check_in_rating: number;
  communication: number;
  location: number;
  value: number;
  comment: string;
};
export type BookingInput = {
  listing_id: number;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  infants: number;
  pets: number;
};
