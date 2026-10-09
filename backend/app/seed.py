"""Deterministic demo data.  Usage:  python -m app.seed [--reset]

Photos come only from app/seed_data/photos.json, which scripts/build_photos.py builds
by verifying every Unsplash URL returns HTTP 200 (so seeding is offline-safe and never
references an invented photo id).
"""

import json
import random
import sys
from datetime import date, timedelta
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import Base, SessionLocal, engine
from app.models import Amenity, Booking, Listing, ListingPhoto, Review, User
from app.security import hash_password
from app.services.pricing import compute_quote

DEMO_PASSWORD = "demo1234"
PHOTOS = json.loads((Path(__file__).parent / "seed_data" / "photos.json").read_text())
PHOTO_URL = PHOTOS["url_template"]
POOLS: dict[str, list[str]] = PHOTOS["pools"]

USERS = [  # (email, name, role, superhost)
    ("host.aarav@example.com", "Aarav", "host", True),
    ("host.meera@example.com", "Meera", "host", True),
    ("host.kabir@example.com", "Kabir", "host", False),
    ("host.isha@example.com", "Isha", "host", False),
    ("guest.riya@example.com", "Riya", "guest", False),
    ("guest.dev@example.com", "Dev", "guest", False),
    ("guest.zara@example.com", "Zara", "guest", False),
]

AMENITIES = [  # (name, icon_key, group)
    ("Wifi", "wifi", "essentials"),
    ("Kitchen", "utensils", "essentials"),
    ("Washing machine", "washing-machine", "essentials"),
    ("Air conditioning", "snowflake", "essentials"),
    ("Heating", "flame", "essentials"),
    ("Free parking", "car", "essentials"),
    ("TV", "tv", "essentials"),
    ("Hair dryer", "wind", "essentials"),
    ("Iron", "shirt", "essentials"),
    ("Dedicated workspace", "laptop", "essentials"),
    ("Hot water", "droplet", "essentials"),
    ("Essentials", "bed", "essentials"),
    ("Pool", "waves", "features"),
    ("Hot tub", "bath", "features"),
    ("BBQ grill", "flame", "features"),
    ("Garden", "trees", "features"),
    ("Balcony", "door-open", "features"),
    ("Fireplace", "flame", "features"),
    ("Gym", "dumbbell", "features"),
    ("Lift", "arrow-up-down", "features"),
    ("Breakfast included", "coffee", "features"),
    ("Allows pets", "paw-print", "features"),
    ("EV charger", "plug-zap", "features"),
    ("Beach access", "umbrella", "features"),
    ("Lake access", "droplets", "features"),
    ("Mountain view", "mountain", "features"),
    ("Cooking basics", "chef-hat", "features"),
    ("Smoke alarm", "bell", "safety"),
    ("Carbon monoxide alarm", "siren", "safety"),
    ("First aid kit", "heart-pulse", "safety"),
    ("Fire extinguisher", "flame-kindling", "safety"),
    ("Security cameras", "camera", "safety"),
]
ESSENTIAL = ["Wifi", "Kitchen", "Hot water", "Essentials", "Smoke alarm", "TV"]
BY_CATEGORY = {
    "beach": ["Beach access", "Pool", "Air conditioning", "BBQ grill"],
    "mountains": ["Mountain view", "Heating", "Fireplace", "Free parking"],
    "cabins": ["Fireplace", "Garden", "BBQ grill", "Heating"],
    "lakefront": ["Lake access", "Balcony", "BBQ grill", "Free parking"],
    "countryside": ["Garden", "Free parking", "BBQ grill", "Allows pets"],
    "amazing_views": ["Balcony", "Mountain view", "Air conditioning"],
    "luxe": ["Pool", "Hot tub", "Gym", "Air conditioning", "Breakfast included"],
    "city": ["Air conditioning", "Lift", "Dedicated workspace", "Gym"],
    "treehouse": ["Garden", "Balcony", "Mountain view"],
    "trending": ["Pool", "Air conditioning", "Balcony"],
}

# city, state, lat, lng, categories that suit it
DESTINATIONS = [
    ("Goa", "Goa", 15.4909, 73.8278, ["beach", "luxe", "trending"]),
    ("Manali", "Himachal Pradesh", 32.2396, 77.1887, ["mountains", "cabins", "amazing_views"]),
    ("Udaipur", "Rajasthan", 24.5854, 73.7125, ["lakefront", "luxe", "amazing_views"]),
    ("Jaipur", "Rajasthan", 26.9124, 75.7873, ["city", "luxe", "trending"]),
    ("Alleppey", "Kerala", 9.4981, 76.3388, ["lakefront", "countryside", "trending"]),
    ("Mumbai", "Maharashtra", 19.0760, 72.8777, ["city", "beach", "trending"]),
    ("Rishikesh", "Uttarakhand", 30.0869, 78.2676, ["treehouse", "mountains", "amazing_views"]),
    ("Coorg", "Karnataka", 12.3375, 75.8069, ["countryside", "cabins", "treehouse"]),
]

# category -> (exterior pool, property type, title words)
LOOK = {
    "beach": ("beach", "villa", ["Beachfront", "Seaside", "Sunset"]),
    "mountains": ("cabin", "cabin", ["Mountain", "Valley-view", "Snowline"]),
    "cabins": ("cabin", "cabin", ["Cosy", "Pine", "Hideaway"]),
    "lakefront": ("lake", "house", ["Lakeside", "Waterfront", "Lagoon"]),
    "countryside": ("farm", "farm_stay", ["Countryside", "Orchard", "Heritage"]),
    "amazing_views": ("villa", "house", ["Panoramic", "Skyline", "Hilltop"]),
    "luxe": ("villa", "villa", ["Luxe", "Private-pool", "Designer"]),
    "city": ("apartment", "apartment", ["Modern", "Central", "Studio"]),
    "treehouse": ("tree", "treehouse", ["Canopy", "Treetop", "Nest"]),
    "trending": ("apartment", "apartment", ["Stylish", "Bright", "Trendy"]),
}
NOUNS = {
    "villa": "villa",
    "cabin": "cabin",
    "house": "home",
    "farm_stay": "farm stay",
    "apartment": "apartment",
    "treehouse": "treehouse",
}
INTERIORS = ["bedroom", "living", "kitchen", "bath"]
CAPTIONS = {"bedroom": "Bedroom", "living": "Living area", "kitchen": "Kitchen", "bath": "Bathroom"}

COMMENTS = [
    "Wonderful stay — spotless, exactly as pictured and the host was quick to respond.",
    "Loved the location and the views. We would happily come back.",
    "Very comfortable beds and a well-equipped kitchen. Great value for the price.",
    "Easy check-in and lovely, quiet neighbourhood. Highly recommended.",
    "The space is even nicer in person. Perfect for a family weekend.",
    "Host went above and beyond with local tips. Thank you!",
    "Clean, cosy and thoughtfully decorated. A little noisy at night but otherwise perfect.",
    "Great stay overall. Hot water and wifi worked flawlessly.",
]


class CoverAllocator:
    """Hands out cover photos so that no two listings share a cover.

    Prefers an unused photo from the listing's own category pool, then any unused exterior
    pool, then interiors. Uses its own RNG so the rest of the seed data is unaffected.
    """

    EXTERIOR_POOLS = ("beach", "cabin", "villa", "apartment", "farm", "lake", "tree")

    def __init__(self, rng: random.Random):
        self.rng = rng
        self.used: set[str] = set()

    def take(self, pool_key: str) -> str:
        order = [pool_key, *[k for k in self.EXTERIOR_POOLS if k != pool_key], *INTERIORS]
        for key in order:
            free = [p for p in POOLS[key] if p not in self.used]
            if free:
                pick = self.rng.choice(free)
                self.used.add(pick)
                return pick
        raise RuntimeError("Not enough distinct photos to give every listing a unique cover")


def seed_if_empty(db: Session) -> bool:
    if db.scalar(select(func.count()).select_from(User)):
        return False
    seed(db)
    return True


def seed(db: Session, rng: random.Random | None = None) -> None:
    rng = rng or random.Random(42)
    today = date.today()

    pw = hash_password(DEMO_PASSWORD)  # hash once: same demo password for every account
    users = [User(email=e, name=n, role=r, is_superhost=s, password_hash=pw) for e, n, r, s in USERS]
    db.add_all(users)
    amenities = {name: Amenity(name=name, icon_key=icon, group=group) for name, icon, group in AMENITIES}
    db.add_all(amenities.values())
    db.flush()
    hosts = [u for u in users if u.role == "host"]
    guests = [u for u in users if u.role == "guest"]

    covers = CoverAllocator(random.Random(7))
    listings: list[Listing] = []
    for i in range(48):
        city, state, lat, lng, cats = DESTINATIONS[i % len(DESTINATIONS)]
        category = cats[(i // len(DESTINATIONS)) % len(cats)]
        pool_key, prop_type, words = LOOK[category]
        word = rng.choice(words)
        room_type = "entire_home" if rng.random() < 0.8 else "private_room"
        bedrooms = rng.choice([1, 1, 2, 2, 3, 4])
        base = {"luxe": 9000, "beach": 5500, "city": 3200, "treehouse": 4200}.get(category, 3800)
        price = int(round(base * rng.uniform(0.6, 1.5) * (0.8 + bedrooms * 0.2), -2)) or 1500
        listing = Listing(
            host_id=hosts[i % len(hosts)].id,
            title=f"{word} {NOUNS[prop_type]} in {city}",
            description=(
                f"Wake up in {city}, {state}, in a {NOUNS[prop_type]} designed for slow mornings and easy evenings. "
                f"The space sleeps up to {bedrooms * 2 + 1} guests across "
                f"{bedrooms} bedroom{'s' if bedrooms > 1 else ''}, "
                "with a fully equipped kitchen, fast wifi and a host who is always a message away.\n\n"
                "Local markets, cafes and sights are a short ride away, and we are happy to share our favourite spots."
            ),
            property_type=prop_type,
            room_type=room_type,
            category=category,
            address=f"{rng.randint(1, 120)}, {word} Road, {city}",
            city=city,
            state=state,
            country="India",
            lat=round(lat + rng.uniform(-0.04, 0.04), 5),
            lng=round(lng + rng.uniform(-0.04, 0.04), 5),
            price_per_night=price,
            cleaning_fee=int(round(price * rng.uniform(0.1, 0.25), -2)),
            max_guests=bedrooms * 2 + 1,
            bedrooms=bedrooms,
            beds=bedrooms + rng.randint(0, 2),
            bathrooms=max(1, bedrooms - rng.randint(0, 1)),
        )
        names = set(ESSENTIAL) | set(rng.sample(BY_CATEGORY[category], k=min(3, len(BY_CATEGORY[category]))))
        names |= set(rng.sample([a[0] for a in AMENITIES], k=rng.randint(5, 10)))
        listing.amenities = [amenities[n] for n in sorted(names)]

        pool = POOLS[pool_key][:]
        rng.shuffle(pool)
        cover = covers.take(pool_key)
        photos = [(cover, "Exterior")]
        for key in rng.sample(INTERIORS, k=4):
            photos.append((rng.choice(POOLS[key]), CAPTIONS[key]))
        photos.append((pool[1 % len(pool)], "More views"))
        seen: set[str] = set()
        for pid, caption in photos:
            if pid in seen:
                continue
            seen.add(pid)
            listing.photos.append(ListingPhoto(url=PHOTO_URL.format(id=pid), caption=caption, position=len(seen) - 1))
        listings.append(listing)
    db.add_all(listings)
    db.flush()

    for listing in listings:
        _seed_bookings_and_reviews(db, listing, guests, rng, today)
    db.commit()


def _seed_bookings_and_reviews(
    db: Session, listing: Listing, guests: list[User], rng: random.Random, today: date
) -> None:
    """Non-overlapping stays: a run of past stays, then a few upcoming ones."""
    cursor = today - timedelta(days=rng.randint(200, 330))
    ratings: list[int] = []
    for _ in range(rng.randint(4, 12)):
        cursor += timedelta(days=rng.randint(1, 12))
        nights = rng.randint(2, 6)
        check_in, check_out = cursor, cursor + timedelta(days=nights)
        if check_out >= today - timedelta(days=1):
            break
        cursor = check_out
        booking = _make_booking(listing, rng.choice(guests), check_in, check_out, rng)
        db.add(booking)
        db.flush()
        if rng.random() < 0.88:
            base = rng.choices([5, 4, 3], weights=[70, 25, 5])[0]
            sub = {
                k: min(5, max(1, base + rng.choice([-1, 0, 0, 1])))
                for k in ["cleanliness", "accuracy", "check_in_rating", "communication", "location", "value"]
            }
            db.add(
                Review(
                    listing_id=listing.id,
                    booking_id=booking.id,
                    author_id=booking.guest_id,
                    rating=base,
                    comment=rng.choice(COMMENTS),
                    **sub,
                )
            )
            ratings.append(base)
    start = today + timedelta(days=rng.randint(5, 25))
    for _ in range(rng.randint(0, 3)):
        nights = rng.randint(2, 5)
        db.add(_make_booking(listing, rng.choice(guests), start, start + timedelta(days=nights), rng))
        start += timedelta(days=nights + rng.randint(2, 20))
    if ratings:
        listing.avg_rating = round(sum(ratings) / len(ratings), 2)
        listing.review_count = len(ratings)


def _make_booking(listing: Listing, guest: User, check_in: date, check_out: date, rng: random.Random) -> Booking:
    nights = (check_out - check_in).days
    q = compute_quote(listing.price_per_night, listing.cleaning_fee, nights)
    return Booking(
        listing_id=listing.id,
        guest_id=guest.id,
        check_in=check_in,
        check_out=check_out,
        adults=rng.randint(1, max(1, listing.max_guests - 1)),
        children=0,
        infants=0,
        pets=0,
        nights=nights,
        nightly_price=q.nightly_price,
        cleaning_fee=q.cleaning_fee,
        service_fee=q.service_fee,
        total_price=q.total,
        status="confirmed",
    )


def main() -> None:
    import app.models  # noqa: F401

    if "--reset" in sys.argv:
        Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        print("seeded" if seed_if_empty(db) else "database already has data (use --reset to rebuild)")


if __name__ == "__main__":
    main()
