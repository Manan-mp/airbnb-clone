from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.deps import get_current_user
from app.models import Listing, User, Wishlist
from app.schemas.listing import ListingCard
from app.services.bookings import get_active_listing
from app.services.search import card_dict

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.get("", response_model=list[ListingCard])
def my_wishlist(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    listings = db.scalars(
        select(Listing)
        .join(Wishlist, Wishlist.listing_id == Listing.id)
        .where(Wishlist.user_id == user.id, Listing.is_active.is_(True))
        .options(selectinload(Listing.photos), selectinload(Listing.host))
        .order_by(Wishlist.created_at.desc())
    )
    return [card_dict(item, {item.id}) for item in listings]


@router.put("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def add(listing_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_active_listing(db, listing_id)
    if db.get(Wishlist, (user.id, listing_id)) is None:
        db.add(Wishlist(user_id=user.id, listing_id=listing_id))
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove(listing_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.get(Wishlist, (user.id, listing_id))
    if item is not None:
        db.delete(item)
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
