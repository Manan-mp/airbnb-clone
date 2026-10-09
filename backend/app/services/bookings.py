from dataclasses import dataclass
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import begin_immediate
from app.errors import Conflict, Forbidden, Invalid, NotFound
from app.models import Booking, Listing, User
from app.services.availability import is_available
from app.services.pricing import Quote, compute_quote

MAX_NIGHTS = 90


@dataclass(frozen=True)
class StayRequest:
    check_in: date
    check_out: date
    adults: int = 1
    children: int = 0
    infants: int = 0
    pets: int = 0


def get_active_listing(db: Session, listing_id: int) -> Listing:
    listing = db.get(Listing, listing_id)
    if listing is None or not listing.is_active:
        raise NotFound("Listing not found")
    return listing


def validate_stay(listing: Listing, stay: StayRequest, today: date | None = None) -> int:
    """Validate dates and guests against the listing. Returns the number of nights."""
    today = today or date.today()
    if stay.check_in < today:
        raise Invalid("Check-in date is in the past")
    if stay.check_out <= stay.check_in:
        raise Invalid("Check-out must be after check-in")
    nights = (stay.check_out - stay.check_in).days
    if nights > MAX_NIGHTS:
        raise Invalid(f"Stays are limited to {MAX_NIGHTS} nights")
    if stay.adults < 1:
        raise Invalid("At least one adult is required")
    if stay.adults + stay.children > listing.max_guests:
        raise Invalid(f"This place has a maximum of {listing.max_guests} guests")
    if stay.pets and not any(a.name == "Allows pets" for a in listing.amenities):
        raise Invalid("This place doesn't allow pets")
    return nights


def quote_stay(db: Session, listing_id: int, stay: StayRequest) -> Quote:
    listing = get_active_listing(db, listing_id)
    nights = validate_stay(listing, stay)
    if not is_available(db, listing.id, stay.check_in, stay.check_out):
        raise Conflict("Those dates are not available")
    return compute_quote(listing.price_per_night, listing.cleaning_fee, nights)


def create_booking(db: Session, guest: User, listing_id: int, stay: StayRequest) -> Booking:
    """Validate, then check availability and insert inside one BEGIN IMMEDIATE transaction.

    The write lock is taken before the availability check, so two concurrent requests
    for overlapping dates are serialised: the second one sees the first booking and gets 409.
    """
    listing = get_active_listing(db, listing_id)
    if listing.host_id == guest.id:
        raise Invalid("You can't book your own listing")
    nights = validate_stay(listing, stay)
    guest_id, price, cleaning = guest.id, listing.price_per_night, listing.cleaning_fee

    begin_immediate(db)
    try:
        if not is_available(db, listing_id, stay.check_in, stay.check_out):
            raise Conflict("Those dates are no longer available")
        q = compute_quote(price, cleaning, nights)
        booking = Booking(
            listing_id=listing_id,
            guest_id=guest_id,
            check_in=stay.check_in,
            check_out=stay.check_out,
            adults=stay.adults,
            children=stay.children,
            infants=stay.infants,
            pets=stay.pets,
            nights=nights,
            nightly_price=q.nightly_price,
            cleaning_fee=q.cleaning_fee,
            service_fee=q.service_fee,
            total_price=q.total,
            status="confirmed",
        )
        db.add(booking)
        db.commit()
    except BaseException:
        db.rollback()
        raise
    return booking


def get_visible_booking(db: Session, user: User, booking_id: int) -> Booking:
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise NotFound("Booking not found")
    if booking.guest_id != user.id and booking.listing.host_id != user.id:
        raise Forbidden("You don't have access to this booking")
    return booking


def cancel_booking(db: Session, user: User, booking_id: int, today: date | None = None) -> Booking:
    today = today or date.today()
    booking = get_visible_booking(db, user, booking_id)
    if booking.guest_id != user.id:
        raise Forbidden("Only the guest can cancel this booking")
    if booking.status == "cancelled":
        raise Conflict("This booking is already cancelled")
    if booking.check_in <= today:
        raise Conflict("Bookings can only be cancelled before check-in")
    booking.status = "cancelled"
    db.commit()
    return booking


def trips_for(db: Session, user: User, status: str | None, today: date | None = None) -> list[Booking]:
    today = today or date.today()
    stmt = select(Booking).where(Booking.guest_id == user.id)
    if status == "upcoming":
        stmt = stmt.where(Booking.status == "confirmed", Booking.check_out >= today).order_by(Booking.check_in)
    elif status == "past":
        stmt = stmt.where(Booking.status == "confirmed", Booking.check_out < today).order_by(Booking.check_in.desc())
    elif status == "cancelled":
        stmt = stmt.where(Booking.status == "cancelled").order_by(Booking.check_in.desc())
    else:
        stmt = stmt.order_by(Booking.check_in.desc())
    return list(db.scalars(stmt))
