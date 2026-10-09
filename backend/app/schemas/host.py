from pydantic import BaseModel, Field, HttpUrl, field_validator

from app.catalog import CATEGORY_KEYS, PROPERTY_TYPES, ROOM_TYPES
from app.schemas.listing import ListingCard


def _check(value: str | None, allowed, name: str) -> str | None:
    if value is not None and value not in allowed:
        raise ValueError(f"{name} must be one of {sorted(allowed)}")
    return value


class ListingUpdate(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=160)
    description: str | None = Field(None, min_length=10, max_length=5000)
    property_type: str | None = None
    room_type: str | None = None
    category: str | None = None
    address: str | None = Field(None, max_length=255)
    city: str | None = Field(None, min_length=1, max_length=80)
    state: str | None = Field(None, max_length=80)
    country: str | None = Field(None, max_length=80)
    lat: float | None = Field(None, ge=-90, le=90)
    lng: float | None = Field(None, ge=-180, le=180)
    price_per_night: int | None = Field(None, gt=0, le=1_000_000)
    cleaning_fee: int | None = Field(None, ge=0, le=100_000)
    max_guests: int | None = Field(None, ge=1, le=16)
    bedrooms: int | None = Field(None, ge=0, le=50)
    beds: int | None = Field(None, ge=1, le=50)
    bathrooms: int | None = Field(None, ge=0, le=50)
    photo_urls: list[HttpUrl] | None = Field(None, min_length=1, max_length=20)
    amenity_ids: list[int] | None = None

    @field_validator("property_type")
    @classmethod
    def _pt(cls, v):
        return _check(v, set(PROPERTY_TYPES), "property_type")

    @field_validator("room_type")
    @classmethod
    def _rt(cls, v):
        return _check(v, ROOM_TYPES, "room_type")

    @field_validator("category")
    @classmethod
    def _cat(cls, v):
        return _check(v, CATEGORY_KEYS, "category")

    def to_data(self) -> dict:
        data = self.model_dump(exclude_unset=True)
        if data.get("photo_urls") is not None:
            data["photo_urls"] = [str(u) for u in self.photo_urls]
        return data


class ListingIn(ListingUpdate):
    title: str = Field(min_length=3, max_length=160)
    description: str = Field(min_length=10, max_length=5000)
    property_type: str
    room_type: str
    category: str
    city: str = Field(min_length=1, max_length=80)
    price_per_night: int = Field(gt=0, le=1_000_000)
    max_guests: int = Field(ge=1, le=16)
    photo_urls: list[HttpUrl] = Field(min_length=1, max_length=20)
    amenity_ids: list[int] = Field(default_factory=list)


class HostListingOut(ListingCard):
    upcoming_bookings: int
    total_bookings: int


class UploadOut(BaseModel):
    url: str
