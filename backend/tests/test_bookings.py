from datetime import date, timedelta

from sqlalchemy import select

from app.models import Booking, Review
from app.services.pricing import compute_quote
from tests.conftest import login
from tests.helpers import fresh_dates, listing_of, stay, user_id

HOST = "winterfell@north.com"
OTHER_HOST = "host.meera@example.com"
GUEST = "jon.snow@north.com"
OTHER_GUEST = "guest.dev@example.com"


def test_quote_matches_pricing_rules(client, db):
    listing = listing_of(db, HOST)
    d = fresh_dates()
    r = client.get(f"/api/listings/{listing.id}/quote", params={"check_in": d[0], "check_out": d[3]})
    assert r.status_code == 200
    q = r.json()
    expected = compute_quote(listing.price_per_night, listing.cleaning_fee, 3)
    assert q == expected.__dict__
    assert q["total"] == q["subtotal"] + q["cleaning_fee"] + q["service_fee"]
    assert q["service_fee"] == round(q["subtotal"] * 0.14)


def test_booking_is_persisted_snapshotted_and_blocks_dates(client, db):
    h = login(client, GUEST)
    listing = listing_of(db, HOST)
    d = fresh_dates()
    r = client.post("/api/bookings", json=stay(listing.id, d[0], d[4], adults=2), headers=h)
    assert r.status_code == 201, r.text
    b = r.json()
    assert b["status"] == "confirmed" and b["nights"] == 4 and b["listing"]["id"] == listing.id
    assert b["total_price"] == compute_quote(listing.price_per_night, listing.cleaning_fee, 4).total

    trips = client.get("/api/bookings/me", params={"status": "upcoming"}, headers=h).json()
    assert b["id"] in [t["id"] for t in trips]
    booked = client.get(f"/api/listings/{listing.id}/availability", params={"from": d[0], "to": d[10]}).json()
    assert {"check_in": d[0].isoformat(), "check_out": d[4].isoformat()} in booked["booked"]
    search = client.get("/api/listings", params={"check_in": d[1], "check_out": d[2], "page_size": 60}).json()
    assert listing.id not in [i["id"] for i in search["items"]]
    quote = client.get(f"/api/listings/{listing.id}/quote", params={"check_in": d[1], "check_out": d[2]})
    assert quote.status_code == 409


def test_overlapping_stays_get_409(client, db):
    h = login(client, GUEST)
    listing = listing_of(db, HOST)
    d = fresh_dates()
    assert client.post("/api/bookings", json=stay(listing.id, d[5], d[10]), headers=h).status_code == 201
    h2 = login(client, OTHER_GUEST)
    for a, b in [(d[5], d[10]), (d[3], d[6]), (d[9], d[12]), (d[6], d[8]), (d[2], d[14])]:
        r = client.post("/api/bookings", json=stay(listing.id, a, b), headers=h2)
        assert r.status_code == 409, (a, b, r.text)
        assert "no longer available" in r.json()["detail"]


def test_back_to_back_stays_are_allowed(client, db):
    h = login(client, GUEST)
    listing = listing_of(db, HOST)
    d = fresh_dates()
    assert client.post("/api/bookings", json=stay(listing.id, d[5], d[8]), headers=h).status_code == 201
    # check-in on the previous guest's check-out day
    assert client.post("/api/bookings", json=stay(listing.id, d[8], d[10]), headers=h).status_code == 201
    # check-out on the next guest's check-in day
    assert client.post("/api/bookings", json=stay(listing.id, d[2], d[5]), headers=h).status_code == 201


def test_cannot_book_own_listing(client, db):
    h = login(client, HOST)
    listing = listing_of(db, HOST)
    d = fresh_dates()
    r = client.post("/api/bookings", json=stay(listing.id, d[0], d[2]), headers=h)
    assert r.status_code == 422 and "own listing" in r.json()["detail"]


def test_guest_count_validation(client, db):
    h = login(client, GUEST)
    listing = listing_of(db, HOST)
    d = fresh_dates()
    over = stay(listing.id, d[0], d[2], adults=listing.max_guests, children=1)
    r = client.post("/api/bookings", json=over, headers=h)
    assert r.status_code == 422 and "maximum" in r.json()["detail"]
    # infants don't count towards the limit
    ok = stay(listing.id, d[0], d[2], adults=listing.max_guests, infants=2)
    assert client.post("/api/bookings", json=ok, headers=h).status_code == 201
    assert client.post("/api/bookings", json=stay(listing.id, d[3], d[5], adults=0), headers=h).status_code == 422


def test_pets_only_where_allowed(client, db):
    h = login(client, GUEST)
    no_pets = next(
        lst
        for lst in [listing_of(db, e) for e in (HOST, OTHER_HOST, "host.kabir@example.com", "host.isha@example.com")]
        if not any(a.name == "Allows pets" for a in lst.amenities)
    )
    d = fresh_dates()
    r = client.post("/api/bookings", json=stay(no_pets.id, d[0], d[2], pets=1), headers=h)
    assert r.status_code == 422 and "pets" in r.json()["detail"]


def test_date_validation(client, db):
    h = login(client, GUEST)
    listing = listing_of(db, HOST)
    today = date.today()
    past = client.post(
        "/api/bookings", json=stay(listing.id, today - timedelta(days=3), today + timedelta(days=1)), headers=h
    )
    assert past.status_code == 422 and "past" in past.json()["detail"]
    d = fresh_dates(120)
    assert client.post("/api/bookings", json=stay(listing.id, d[5], d[5]), headers=h).status_code == 422
    assert client.post("/api/bookings", json=stay(listing.id, d[5], d[2]), headers=h).status_code == 422
    assert client.post("/api/bookings", json=stay(listing.id, d[0], d[100]), headers=h).status_code == 422


def test_booking_requires_auth_and_existing_listing(client):
    d = fresh_dates()
    assert client.post("/api/bookings", json=stay(1, d[0], d[2])).status_code == 401
    h = login(client, GUEST)
    assert client.post("/api/bookings", json=stay(999999, d[0], d[2]), headers=h).status_code == 404


def test_cancel_frees_dates_and_is_guarded(client, db):
    h = login(client, GUEST)
    listing = listing_of(db, HOST)
    d = fresh_dates()
    bid = client.post("/api/bookings", json=stay(listing.id, d[0], d[3]), headers=h).json()["id"]
    assert client.post(f"/api/bookings/{bid}/cancel", headers=login(client, OTHER_GUEST)).status_code == 403
    r = client.post(f"/api/bookings/{bid}/cancel", headers=h)
    assert r.status_code == 200 and r.json()["status"] == "cancelled"
    assert client.post(f"/api/bookings/{bid}/cancel", headers=h).status_code == 409
    # cancelled dates are bookable again
    assert client.post("/api/bookings", json=stay(listing.id, d[0], d[3]), headers=h).status_code == 201
    cancelled = client.get("/api/bookings/me", params={"status": "cancelled"}, headers=h).json()
    assert bid in [t["id"] for t in cancelled]


def test_cannot_cancel_past_stay(client, db):
    h = login(client, GUEST)
    past = db.scalar(
        select(Booking).where(
            Booking.guest_id == user_id(db, GUEST), Booking.check_out < date.today(), Booking.status == "confirmed"
        )
    )
    assert client.post(f"/api/bookings/{past.id}/cancel", headers=h).status_code == 409


def test_booking_visibility(client, db):
    listing = listing_of(db, HOST)
    d = fresh_dates()
    bid = client.post("/api/bookings", json=stay(listing.id, d[0], d[2]), headers=login(client, GUEST)).json()["id"]
    assert client.get(f"/api/bookings/{bid}", headers=login(client, GUEST)).status_code == 200
    assert client.get(f"/api/bookings/{bid}", headers=login(client, HOST)).status_code == 200  # listing's host
    assert client.get(f"/api/bookings/{bid}", headers=login(client, OTHER_GUEST)).status_code == 403
    assert client.get(f"/api/bookings/{bid}", headers=login(client, OTHER_HOST)).status_code == 403
    assert client.get("/api/bookings/999999", headers=login(client, GUEST)).status_code == 404


REVIEW = {
    "rating": 5,
    "cleanliness": 5,
    "accuracy": 4,
    "check_in_rating": 5,
    "communication": 5,
    "location": 4,
    "value": 5,
    "comment": "Lovely",
}


def test_reviews_only_after_stay_once_by_guest(client, db):
    gid = user_id(db, GUEST)
    reviewed = select(Review.booking_id)
    past = db.scalar(
        select(Booking).where(
            Booking.guest_id == gid,
            Booking.status == "confirmed",
            Booking.check_out < date.today(),
            Booking.id.not_in(reviewed),
        )
    )
    assert past is not None
    listing = past.listing
    before = (listing.review_count, client.get(f"/api/listings/{listing.id}/reviews").json()["total"])

    assert (
        client.post(f"/api/bookings/{past.id}/review", json=REVIEW, headers=login(client, OTHER_GUEST)).status_code
        == 403
    )
    r = client.post(f"/api/bookings/{past.id}/review", json=REVIEW, headers=login(client, GUEST))
    assert r.status_code == 201 and r.json()["author"]["name"] == "Jon Snow"
    assert client.post(f"/api/bookings/{past.id}/review", json=REVIEW, headers=login(client, GUEST)).status_code == 409

    detail = client.get(f"/api/listings/{listing.id}").json()
    assert detail["review_count"] == before[0] + 1
    assert client.get(f"/api/listings/{listing.id}/reviews").json()["total"] == before[1] + 1

    trip = next(
        t
        for t in client.get("/api/bookings/me", params={"status": "past"}, headers=login(client, GUEST)).json()
        if t["id"] == past.id
    )
    assert trip["has_review"] and not trip["can_review"]


def test_cannot_review_future_stay(client, db):
    listing = listing_of(db, HOST)
    d = fresh_dates()
    h = login(client, GUEST)
    bid = client.post("/api/bookings", json=stay(listing.id, d[0], d[2]), headers=h).json()["id"]
    r = client.post(f"/api/bookings/{bid}/review", json=REVIEW, headers=h)
    assert r.status_code == 422 and "after your stay" in r.json()["detail"]
    assert client.post(f"/api/bookings/{bid}/review", json={**REVIEW, "rating": 6}, headers=h).status_code == 422
