from datetime import date, timedelta
from itertools import count

from sqlalchemy import select

from app.models import Listing, User

# Each test takes its own block of dates far beyond the seeded bookings, so tests sharing
# the session database never collide.
_blocks = count()


def fresh_dates(span: int = 30) -> list[date]:
    start = date.today() + timedelta(days=500 + next(_blocks) * span)
    return [start + timedelta(days=i) for i in range(span)]


def user_id(db, email: str) -> int:
    return db.scalar(select(User.id).where(User.email == email))


def listing_of(db, host_email: str, **where) -> Listing:
    stmt = select(Listing).where(Listing.host_id == user_id(db, host_email), Listing.is_active.is_(True))
    for k, v in where.items():
        stmt = stmt.where(getattr(Listing, k) >= v) if k == "max_guests" else stmt.where(getattr(Listing, k) == v)
    return db.scalars(stmt.order_by(Listing.id)).first()


def stay(listing_id: int, check_in: date, check_out: date, **extra) -> dict:
    return {"listing_id": listing_id, "check_in": check_in.isoformat(), "check_out": check_out.isoformat(), **extra}
