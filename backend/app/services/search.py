import math
from dataclasses import dataclass, field
from datetime import date

from sqlalchemy import Select, and_, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models import Amenity, Listing, Wishlist
from app.services.availability import listing_is_free
from app.services.pricing import compute_quote

HISTOGRAM_BUCKETS = 40
SORTS = {
    "recommended": (Listing.avg_rating * Listing.review_count).desc(),
    "price_asc": Listing.price_per_night.asc(),
    "price_desc": Listing.price_per_night.desc(),
    "rating": Listing.avg_rating.desc(),
    "newest": Listing.created_at.desc(),
}


@dataclass
class SearchFilters:
    location: str | None = None
    check_in: date | None = None
    check_out: date | None = None
    guests: int = 0
    pets: int = 0
    min_price: int | None = None
    max_price: int | None = None
    property_types: list[str] = field(default_factory=list)
    room_type: str | None = None
    category: str | None = None
    amenity_ids: list[int] = field(default_factory=list)
    min_bedrooms: int = 0
    min_beds: int = 0
    min_bathrooms: int = 0
    sort: str = "recommended"


def _conditions(f: SearchFilters, include_price: bool) -> list:
    conds = [Listing.is_active.is_(True)]
    if f.location:
        # "Goa, India" -> match on the first token against city/state/country/title/address
        term = f"%{f.location.split(',')[0].strip()}%"
        conds.append(
            or_(
                Listing.city.ilike(term),
                Listing.state.ilike(term),
                Listing.country.ilike(term),
                Listing.title.ilike(term),
                Listing.address.ilike(term),
            )
        )
    if f.check_in and f.check_out:
        conds.append(listing_is_free(Listing.id, f.check_in, f.check_out))
    if f.guests:
        conds.append(Listing.max_guests >= f.guests)
    if include_price:
        if f.min_price is not None:
            conds.append(Listing.price_per_night >= f.min_price)
        if f.max_price is not None:
            conds.append(Listing.price_per_night <= f.max_price)
    if f.property_types:
        conds.append(Listing.property_type.in_(f.property_types))
    if f.room_type:
        conds.append(Listing.room_type == f.room_type)
    if f.category:
        conds.append(Listing.category == f.category)
    for aid in f.amenity_ids:
        conds.append(Listing.amenities.any(Amenity.id == aid))
    if f.min_bedrooms:
        conds.append(Listing.bedrooms >= f.min_bedrooms)
    if f.min_beds:
        conds.append(Listing.beds >= f.min_beds)
    if f.min_bathrooms:
        conds.append(Listing.bathrooms >= f.min_bathrooms)
    return conds


def price_histogram(db: Session, f: SearchFilters) -> dict:
    """Distribution of nightly prices for the current search, ignoring the price filter itself."""
    prices = list(db.scalars(select(Listing.price_per_night).where(and_(*_conditions(f, include_price=False)))))
    if not prices:
        return {"min": 0, "max": 0, "buckets": [0] * HISTOGRAM_BUCKETS}
    lo, hi = min(prices), max(prices)
    width = max((hi - lo) / HISTOGRAM_BUCKETS, 1e-9)
    buckets = [0] * HISTOGRAM_BUCKETS
    for p in prices:
        buckets[min(int((p - lo) / width), HISTOGRAM_BUCKETS - 1)] += 1
    return {"min": lo, "max": hi, "buckets": buckets}


def _card(listing: Listing, wishlisted: set[int], f: SearchFilters | None) -> dict:
    quote = None
    if f and f.check_in and f.check_out:
        q = compute_quote(listing.price_per_night, listing.cleaning_fee, (f.check_out - f.check_in).days)
        quote = {"nights": q.nights, "total": q.total}
    return card_dict(listing, wishlisted, quote)


def card_dict(listing: Listing, wishlisted: set[int], quote: dict | None = None) -> dict:
    return {
        "id": listing.id,
        "title": listing.title,
        "city": listing.city,
        "state": listing.state,
        "country": listing.country,
        "property_type": listing.property_type,
        "room_type": listing.room_type,
        "category": listing.category,
        "lat": listing.lat,
        "lng": listing.lng,
        "price_per_night": listing.price_per_night,
        "bedrooms": listing.bedrooms,
        "beds": listing.beds,
        "bathrooms": listing.bathrooms,
        "max_guests": listing.max_guests,
        "avg_rating": listing.avg_rating,
        "review_count": listing.review_count,
        "is_guest_favourite": listing.avg_rating >= 4.8 and listing.review_count >= 10,
        "host": listing.host,
        "photos": [p.url for p in listing.photos[:6]],
        "is_wishlisted": listing.id in wishlisted,
        "quote": quote,
    }


def wishlisted_ids(db: Session, user_id: int | None) -> set[int]:
    if user_id is None:
        return set()
    return set(db.scalars(select(Wishlist.listing_id).where(Wishlist.user_id == user_id)))


def search_listings(db: Session, f: SearchFilters, page: int, page_size: int, user_id: int | None) -> dict:
    where = and_(*_conditions(f, include_price=True))
    total = db.scalar(select(func.count()).select_from(Listing).where(where)) or 0
    stmt: Select = (
        select(Listing)
        .where(where)
        .options(selectinload(Listing.photos), selectinload(Listing.host))
        .order_by(SORTS.get(f.sort, SORTS["recommended"]), Listing.id)
        .limit(page_size)
        .offset((page - 1) * page_size)
    )
    listings = list(db.scalars(stmt))
    wished = wishlisted_ids(db, user_id)
    return {
        "items": [_card(item, wished, f) for item in listings],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(math.ceil(total / page_size), 1),
        "price_histogram": price_histogram(db, f),
    }
