from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Booking, Review


def booking_out(db: Session, booking: Booking, today: date | None = None) -> dict:
    today = today or date.today()
    listing = booking.listing
    has_review = db.scalar(select(Review.id).where(Review.booking_id == booking.id)) is not None
    return {
        "id": booking.id,
        "listing": {
            "id": listing.id,
            "title": listing.title,
            "city": listing.city,
            "state": listing.state,
            "photo": listing.photos[0].url if listing.photos else None,
            "host_name": listing.host.name,
        },
        "guest_name": booking.guest.name,
        **{
            k: getattr(booking, k)
            for k in (
                "check_in",
                "check_out",
                "adults",
                "children",
                "infants",
                "pets",
                "nights",
                "nightly_price",
                "cleaning_fee",
                "service_fee",
                "total_price",
                "status",
                "created_at",
            )
        },
        "has_review": has_review,
        "can_review": booking.status == "confirmed" and booking.check_out <= today and not has_review,
    }
