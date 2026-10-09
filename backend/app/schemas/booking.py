from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class StayIn(BaseModel):
    check_in: date
    check_out: date
    adults: int = Field(1, ge=1, le=16)
    children: int = Field(0, ge=0, le=16)
    infants: int = Field(0, ge=0, le=5)
    pets: int = Field(0, ge=0, le=5)


class BookingIn(StayIn):
    listing_id: int


class QuoteOut(BaseModel):
    nights: int
    nightly_price: int
    subtotal: int
    cleaning_fee: int
    service_fee: int
    total: int


class BookingListing(BaseModel):
    id: int
    title: str
    city: str
    state: str
    photo: str | None
    host_name: str


class BookingOut(BaseModel):
    id: int
    listing: BookingListing
    guest_name: str
    check_in: date
    check_out: date
    adults: int
    children: int
    infants: int
    pets: int
    nights: int
    nightly_price: int
    cleaning_fee: int
    service_fee: int
    total_price: int
    status: str
    created_at: datetime
    has_review: bool = False
    can_review: bool = False


class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    cleanliness: int = Field(ge=1, le=5)
    accuracy: int = Field(ge=1, le=5)
    check_in_rating: int = Field(ge=1, le=5)
    communication: int = Field(ge=1, le=5)
    location: int = Field(ge=1, le=5)
    value: int = Field(ge=1, le=5)
    comment: str = Field("", max_length=2000)


class ReviewAuthor(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    avatar_url: str | None
    created_at: datetime


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    listing_id: int
    booking_id: int
    rating: int
    comment: str
    created_at: datetime
    author: ReviewAuthor


class ReviewPage(BaseModel):
    items: list[ReviewOut]
    total: int
    page: int
    page_size: int
