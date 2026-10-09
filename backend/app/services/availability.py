from datetime import date

from sqlalchemy import ColumnElement, exists, select
from sqlalchemy.orm import Session

from app.models import Booking


def overlap_clause(check_in: date, check_out: date) -> ColumnElement[bool]:
    """Confirmed bookings overlapping [check_in, check_out). The check-out day is free."""
    return (Booking.status == "confirmed") & (Booking.check_in < check_out) & (Booking.check_out > check_in)


def listing_is_free(listing_id_col, check_in: date, check_out: date) -> ColumnElement[bool]:
    """Correlated NOT EXISTS usable inside a listings query."""
    return ~exists().where(Booking.listing_id == listing_id_col, overlap_clause(check_in, check_out))


def is_available(db: Session, listing_id: int, check_in: date, check_out: date) -> bool:
    return not db.scalar(select(exists().where(Booking.listing_id == listing_id, overlap_clause(check_in, check_out))))


def booked_ranges(db: Session, listing_id: int, start: date, end: date) -> list[tuple[date, date]]:
    rows = db.execute(
        select(Booking.check_in, Booking.check_out)
        .where(Booking.listing_id == listing_id, overlap_clause(start, end))
        .order_by(Booking.check_in)
    )
    return [(r.check_in, r.check_out) for r in rows]

