from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_host
from app.models import User
from app.routers.serializers import booking_out
from app.schemas.booking import BookingOut
from app.schemas.host import DeleteOut, HostListingOut, ListingIn, ListingUpdate
from app.schemas.listing import ListingCard
from app.services import host as svc
from app.services.search import card_dict

router = APIRouter(tags=["host"])


@router.post("/listings", response_model=ListingCard, status_code=status.HTTP_201_CREATED)
def create(body: ListingIn, db: Session = Depends(get_db), host: User = Depends(require_host)):
    return card_dict(svc.create_listing(db, host, body.to_data()), set())


@router.patch("/listings/{listing_id}", response_model=ListingCard)
def update(listing_id: int, body: ListingUpdate, db: Session = Depends(get_db), host: User = Depends(require_host)):
    return card_dict(svc.update_listing(db, host, listing_id, body.to_data()), set())


@router.delete("/listings/{listing_id}", response_model=DeleteOut)
def delete(listing_id: int, db: Session = Depends(get_db), host: User = Depends(require_host)):
    """`result` says whether the listing was erased or archived (it has booking history)."""
    return {"result": svc.delete_listing(db, host, listing_id)}


@router.get("/host/listings", response_model=list[HostListingOut])
def my_listings(db: Session = Depends(get_db), host: User = Depends(require_host)):
    return [
        {**card_dict(listing, set()), "is_active": listing.is_active, "upcoming_bookings": up, "total_bookings": total}
        for listing, up, total in svc.host_listings(db, host)
    ]


@router.get("/host/bookings", response_model=list[BookingOut])
def my_bookings(
    listing_id: int | None = None,
    status_: str | None = Query(None, alias="status", pattern="^(upcoming|past|cancelled)$"),
    db: Session = Depends(get_db),
    host: User = Depends(require_host),
):
    return [booking_out(db, b) for b in svc.host_bookings(db, host, listing_id, status_)]
