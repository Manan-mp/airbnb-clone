from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.errors import Conflict, Forbidden, Invalid, NotFound
from app.models import Booking, Listing, Review, User

SUB_RATINGS = ("cleanliness", "accuracy", "check_in_rating", "communication", "location", "value")


def create_review(db: Session, user: User, booking_id: int, data: dict, today: date | None = None) -> Review:
    today = today or date.today()
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise NotFound("Booking not found")
    if booking.guest_id != user.id:
        raise Forbidden("Only the guest who stayed can review")
    if booking.status != "confirmed":
        raise Invalid("Cancelled bookings can't be reviewed")
    if booking.check_out > today:
        raise Invalid("You can leave a review after your stay ends")
    if db.scalar(select(Review.id).where(Review.booking_id == booking_id)):
        raise Conflict("You already reviewed this stay")
    review = Review(listing_id=booking.listing_id, booking_id=booking.id, author_id=user.id, **data)
    db.add(review)
    db.flush()
    refresh_rating(db, booking.listing_id)
    db.commit()
    return review


def refresh_rating(db: Session, listing_id: int) -> None:
    avg, count = db.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(Review.listing_id == listing_id)
    ).one()
    listing = db.get(Listing, listing_id)
    listing.avg_rating = round(avg or 0, 2)
    listing.review_count = count
