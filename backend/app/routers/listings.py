from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.catalog import CATEGORIES, ROOM_TYPES
from app.db import get_db
from app.deps import get_optional_user
from app.models import Amenity, Listing, Review, User
from app.schemas.booking import QuoteOut, ReviewPage
from app.schemas.listing import (
    AmenityOut,
    Availability,
    CategoryOut,
    DateRange,
    ListingDetail,
    ListingPage,
)
from app.services.availability import booked_ranges
from app.services.bookings import StayRequest, get_active_listing, quote_stay
from app.services.search import SearchFilters, card_dict, search_listings, wishlisted_ids

router = APIRouter(tags=["listings"])


def _csv_ints(value: str | None) -> list[int]:
    try:
        return [int(x) for x in value.split(",") if x.strip()] if value else []
    except ValueError:
        raise HTTPException(422, "amenities must be a comma-separated list of ids") from None


@router.get("/listings", response_model=ListingPage)
def list_listings(
    location: str | None = None,
    check_in: date | None = None,
    check_out: date | None = None,
    adults: int = Query(0, ge=0, le=16),
    children: int = Query(0, ge=0, le=16),
    infants: int = Query(0, ge=0, le=5),
    pets: int = Query(0, ge=0, le=5),
    min_price: int | None = Query(None, ge=0),
    max_price: int | None = Query(None, ge=0),
    property_type: str | None = Query(None, description="comma-separated"),
    room_type: str | None = None,
    category: str | None = None,
    amenities: str | None = Query(None, description="comma-separated amenity ids; listing must have all"),
    min_bedrooms: int = Query(0, ge=0),
    min_beds: int = Query(0, ge=0),
    min_bathrooms: int = Query(0, ge=0),
    sort: str = Query("recommended", pattern="^(recommended|price_asc|price_desc|rating|newest)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=60),
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    if (check_in is None) != (check_out is None):
        raise HTTPException(422, "check_in and check_out must be provided together")
    if check_in and check_out and check_out <= check_in:
        raise HTTPException(422, "check_out must be after check_in")
    if room_type and room_type not in ROOM_TYPES:
        raise HTTPException(422, f"room_type must be one of {sorted(ROOM_TYPES)}")
    filters = SearchFilters(
        location=location,
        check_in=check_in,
        check_out=check_out,
        guests=adults + children,
        pets=pets,
        min_price=min_price,
        max_price=max_price,
        property_types=[p for p in (property_type or "").split(",") if p],
        room_type=room_type,
        category=category,
        amenity_ids=_csv_ints(amenities),
        min_bedrooms=min_bedrooms,
        min_beds=min_beds,
        min_bathrooms=min_bathrooms,
        sort=sort,
    )
    return search_listings(db, filters, page, page_size, user.id if user else None)


@router.get("/listings/{listing_id}", response_model=ListingDetail)
def get_listing(listing_id: int, db: Session = Depends(get_db), user: User | None = Depends(get_optional_user)):
    listing = db.scalar(
        select(Listing)
        .where(Listing.id == listing_id, Listing.is_active.is_(True))
        .options(selectinload(Listing.photos), selectinload(Listing.host), selectinload(Listing.amenities))
    )
    if listing is None:
        raise HTTPException(404, "Listing not found")
    avgs = db.execute(
        select(
            func.avg(Review.cleanliness),
            func.avg(Review.accuracy),
            func.avg(Review.check_in_rating),
            func.avg(Review.communication),
            func.avg(Review.location),
            func.avg(Review.value),
        ).where(Review.listing_id == listing_id)
    ).one()
    breakdown = (
        None
        if avgs[0] is None
        else {
            k: round(v, 1)
            for k, v in zip(
                ["cleanliness", "accuracy", "check_in", "communication", "location", "value"], avgs, strict=True
            )
        }
    )
    data = card_dict(listing, wishlisted_ids(db, user.id if user else None))
    data.update(
        description=listing.description,
        address=listing.address,
        cleaning_fee=listing.cleaning_fee,
        photo_details=listing.photos,
        amenities=listing.amenities,
        rating_breakdown=breakdown,
        host_since=listing.host.created_at.year,
    )
    return data


@router.get("/listings/{listing_id}/availability", response_model=Availability)
def availability(
    listing_id: int,
    start: date = Query(alias="from", default_factory=date.today),
    end: date | None = Query(None, alias="to"),
    db: Session = Depends(get_db),
):
    if db.get(Listing, listing_id) is None:
        raise HTTPException(404, "Listing not found")
    end = end or date.fromordinal(start.toordinal() + 365)
    if end <= start:
        raise HTTPException(422, "'to' must be after 'from'")
    return {"booked": [DateRange(check_in=a, check_out=b) for a, b in booked_ranges(db, listing_id, start, end)]}


@router.get("/amenities", response_model=list[AmenityOut])
def list_amenities(db: Session = Depends(get_db)):
    return list(db.scalars(select(Amenity).order_by(Amenity.id)))


@router.get("/categories", response_model=list[CategoryOut])
def list_categories():
    return CATEGORIES


@router.get("/listings/{listing_id}/quote", response_model=QuoteOut)
def quote(
    listing_id: int,
    check_in: date,
    check_out: date,
    adults: int = Query(1, ge=1, le=16),
    children: int = Query(0, ge=0, le=16),
    infants: int = Query(0, ge=0, le=5),
    pets: int = Query(0, ge=0, le=5),
    db: Session = Depends(get_db),
):
    stay = StayRequest(check_in, check_out, adults, children, infants, pets)
    return quote_stay(db, listing_id, stay).__dict__


@router.get("/listings/{listing_id}/reviews", response_model=ReviewPage)
def reviews(
    listing_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    get_active_listing(db, listing_id)
    total = db.scalar(select(func.count(Review.id)).where(Review.listing_id == listing_id)) or 0
    items = db.scalars(
        select(Review)
        .where(Review.listing_id == listing_id)
        .options(selectinload(Review.author))
        .order_by(Review.created_at.desc(), Review.id.desc())
        .limit(page_size)
        .offset((page - 1) * page_size)
    )
    return {"items": list(items), "total": total, "page": page, "page_size": page_size}
