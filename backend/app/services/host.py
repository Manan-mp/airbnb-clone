from datetime import date

from sqlalchemy import exists, func, select
from sqlalchemy.orm import Session

from app.errors import Conflict, Forbidden, Invalid, NotFound
from app.models import Amenity, Booking, Listing, ListingPhoto, User

LISTING_FIELDS = (
    "title",
    "description",
    "property_type",
    "room_type",
    "category",
    "address",
    "city",
    "state",
    "country",
    "lat",
    "lng",
    "price_per_night",
    "cleaning_fee",
    "max_guests",
    "bedrooms",
    "beds",
    "bathrooms",
)


def _owned_listing(db: Session, host: User, listing_id: int) -> Listing:
    listing = db.get(Listing, listing_id)
    if listing is None or not listing.is_active:
        raise NotFound("Listing not found")
    if listing.host_id != host.id:
        raise Forbidden("You can only manage your own listings")
    return listing


def _set_photos(listing: Listing, urls: list[str]) -> None:
    listing.photos.clear()
    for i, url in enumerate(urls):
        listing.photos.append(ListingPhoto(url=url, position=i, caption=None))


def _set_amenities(db: Session, listing: Listing, ids: list[int]) -> None:
    found = list(db.scalars(select(Amenity).where(Amenity.id.in_(set(ids)))))
    if len(found) != len(set(ids)):
        raise Invalid("Unknown amenity id")
    listing.amenities = found


def create_listing(db: Session, host: User, data: dict) -> Listing:
    listing = Listing(host_id=host.id, **{k: data[k] for k in LISTING_FIELDS if k in data})
    _set_photos(listing, data["photo_urls"])
    _set_amenities(db, listing, data.get("amenity_ids", []))
    db.add(listing)
    db.commit()
    return listing


def update_listing(db: Session, host: User, listing_id: int, data: dict) -> Listing:
    listing = _owned_listing(db, host, listing_id)
    for key in LISTING_FIELDS:
        if key in data:
            setattr(listing, key, data[key])
    if data.get("photo_urls") is not None:
        db.execute(ListingPhoto.__table__.delete().where(ListingPhoto.listing_id == listing.id))
        db.expire(listing, ["photos"])
        db.flush()
        _set_photos(listing, data["photo_urls"])
    if data.get("amenity_ids") is not None:
        _set_amenities(db, listing, data["amenity_ids"])
    db.commit()
    return listing


def delete_listing(db: Session, host: User, listing_id: int, today: date | None = None) -> str:
    """409 with upcoming/ongoing stays. Listings with booking history are archived, others removed."""
    today = today or date.today()
    listing = _owned_listing(db, host, listing_id)
    active = select(Booking.id).where(
        Booking.listing_id == listing.id, Booking.status == "confirmed", Booking.check_out > today
    )
    if db.scalar(select(exists(active))):
        raise Conflict("This listing has upcoming bookings. Cancel them before deleting.")
    has_history = db.scalar(select(exists().where(Booking.listing_id == listing.id)))
    if has_history:
        listing.is_active = False  # keep past bookings/reviews intact
        db.commit()
        return "archived"
    db.delete(listing)
    db.commit()
    return "deleted"


def host_listings(db: Session, host: User, today: date | None = None) -> list[tuple[Listing, int, int]]:
    today = today or date.today()
    upcoming = (
        select(func.count(Booking.id))
        .where(Booking.listing_id == Listing.id, Booking.status == "confirmed", Booking.check_out >= today)
        .scalar_subquery()
    )
    total = select(func.count(Booking.id)).where(Booking.listing_id == Listing.id).scalar_subquery()
    rows = db.execute(
        select(Listing, upcoming, total)
        .where(Listing.host_id == host.id, Listing.is_active.is_(True))
        .order_by(Listing.created_at.desc(), Listing.id.desc())
    )
    return [(r[0], r[1], r[2]) for r in rows]


def host_bookings(
    db: Session, host: User, listing_id: int | None, status: str | None, today: date | None = None
) -> list[Booking]:
    today = today or date.today()
    stmt = select(Booking).join(Listing).where(Listing.host_id == host.id)
    if listing_id is not None:
        stmt = stmt.where(Booking.listing_id == listing_id)
    if status == "upcoming":
        stmt = stmt.where(Booking.status == "confirmed", Booking.check_out >= today)
    elif status == "past":
        stmt = stmt.where(Booking.status == "confirmed", Booking.check_out < today)
    elif status == "cancelled":
        stmt = stmt.where(Booking.status == "cancelled")
    return list(db.scalars(stmt.order_by(Booking.check_in.desc())))
