from datetime import date

from pydantic import BaseModel, ConfigDict


class PhotoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    caption: str | None
    position: int


class AmenityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    icon_key: str
    group: str


class HostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    avatar_url: str | None
    is_superhost: bool


class PriceQuote(BaseModel):
    nights: int
    total: int


class ListingCard(BaseModel):
    id: int
    title: str
    city: str
    state: str
    country: str
    property_type: str
    room_type: str
    category: str
    lat: float | None
    lng: float | None
    price_per_night: int
    bedrooms: int
    beds: int
    bathrooms: int
    max_guests: int
    avg_rating: float
    review_count: int
    is_guest_favourite: bool
    host: HostOut
    photos: list[str]
    is_wishlisted: bool = False
    # Present only when the search had dates: the all-in price for the stay.
    quote: PriceQuote | None = None


class PriceHistogram(BaseModel):
    min: int
    max: int
    buckets: list[int]


class ListingPage(BaseModel):
    items: list[ListingCard]
    total: int
    page: int
    page_size: int
    total_pages: int
    price_histogram: PriceHistogram


class RatingBreakdown(BaseModel):
    cleanliness: float
    accuracy: float
    check_in: float
    communication: float
    location: float
    value: float


class ListingDetail(ListingCard):
    description: str
    rating_counts: dict[str, int]  # "1".."5" -> number of reviews
    address: str
    cleaning_fee: int
    photo_details: list[PhotoOut]
    amenities: list[AmenityOut]
    rating_breakdown: RatingBreakdown | None
    host_since: int


class DateRange(BaseModel):
    check_in: date
    check_out: date


class Availability(BaseModel):
    booked: list[DateRange]


class CategoryOut(BaseModel):
    key: str
    label: str
    icon_key: str
