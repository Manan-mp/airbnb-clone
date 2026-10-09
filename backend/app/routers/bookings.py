from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import User
from app.routers.serializers import booking_out
from app.schemas.booking import BookingIn, BookingOut, ReviewIn, ReviewOut
from app.services.bookings import StayRequest, cancel_booking, create_booking, get_visible_booking, trips_for
from app.services.reviews import create_review

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def book(body: BookingIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    stay = StayRequest(**body.model_dump(exclude={"listing_id"}))
    return booking_out(db, create_booking(db, user, body.listing_id, stay))


@router.get("/me", response_model=list[BookingOut])
def my_trips(
    status_: str | None = Query(None, alias="status", pattern="^(upcoming|past|cancelled)$"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return [booking_out(db, b) for b in trips_for(db, user, status_)]


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(booking_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return booking_out(db, get_visible_booking(db, user, booking_id))


@router.post("/{booking_id}/cancel", response_model=BookingOut)
def cancel(booking_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return booking_out(db, cancel_booking(db, user, booking_id))


@router.post("/{booking_id}/review", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def review(booking_id: int, body: ReviewIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    r = create_review(db, user, booking_id, body.model_dump())
    return {
        **{k: getattr(r, k) for k in ("id", "listing_id", "booking_id", "rating", "comment", "created_at")},
        "author": {"id": user.id, "name": user.name, "avatar_url": user.avatar_url, "created_at": user.created_at},
    }
