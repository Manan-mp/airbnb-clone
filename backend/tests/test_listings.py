from datetime import date, timedelta

from app.models import Booking, Listing


def active_count(db) -> int:
    db.rollback()
    return db.query(Listing).filter(Listing.is_active.is_(True)).count()


def test_default_page(client, db):
    r = client.get("/api/listings").json()
    n = active_count(db)
    assert n >= 48 and r["total"] == n and len(r["items"]) == 20 and r["total_pages"] == -(-n // 20)
    card = r["items"][0]
    assert card["photos"] and card["host"]["name"] and card["quote"] is None


def test_pagination_covers_everything_without_duplicates(client, db):
    n = active_count(db)
    ids = []
    for page in range(1, -(-n // 20) + 1):
        ids += [i["id"] for i in client.get("/api/listings", params={"page": page}).json()["items"]]
    assert len(ids) == len(set(ids)) == n


def test_location_and_category_filters(client):
    goa = client.get("/api/listings", params={"location": "Goa, India"}).json()
    assert goa["total"] > 0 and all(i["city"] == "Goa" for i in goa["items"])
    beach = client.get("/api/listings", params={"category": "beach"}).json()
    assert beach["total"] > 0 and all(i["category"] == "beach" for i in beach["items"])


def test_price_filter_and_histogram_ignores_price(client):
    base = client.get("/api/listings", params={"page_size": 60}).json()
    prices = sorted(i["price_per_night"] for i in base["items"])
    mid = prices[len(prices) // 2]
    cheap = client.get("/api/listings", params={"max_price": mid, "page_size": 60}).json()
    assert 0 < cheap["total"] < base["total"]
    assert all(i["price_per_night"] <= mid for i in cheap["items"])
    # histogram describes the whole result set, so a price slider keeps its full range
    h = cheap["price_histogram"]
    assert h["min"] == prices[0] and h["max"] == prices[-1] and sum(h["buckets"]) == base["total"]


def test_amenity_filter_requires_all(client):
    amenities = {a["name"]: a["id"] for a in client.get("/api/amenities").json()}
    both = client.get("/api/listings", params={"amenities": f"{amenities['Pool']},{amenities['Hot tub']}"}).json()
    pool = client.get("/api/listings", params={"amenities": str(amenities["Pool"])}).json()
    assert both["total"] <= pool["total"]
    assert client.get("/api/listings", params={"amenities": "x"}).status_code == 422


def test_sorting(client):
    asc = [
        i["price_per_night"]
        for i in client.get("/api/listings", params={"sort": "price_asc", "page_size": 60}).json()["items"]
    ]
    assert asc == sorted(asc)
    assert client.get("/api/listings", params={"sort": "bogus"}).status_code == 422


def test_guest_count_filter(client):
    r = client.get("/api/listings", params={"adults": 6, "children": 1, "page_size": 60}).json()
    assert r["total"] > 0 and all(i["max_guests"] >= 7 for i in r["items"])


def test_date_validation(client):
    assert client.get("/api/listings", params={"check_in": "2030-01-05"}).status_code == 422
    assert client.get("/api/listings", params={"check_in": "2030-01-05", "check_out": "2030-01-05"}).status_code == 422


def test_availability_excludes_booked_listing_and_returns_quote(client, db):
    booking = db.query(Booking).filter(Booking.status == "confirmed", Booking.check_in > date.today()).first()
    lid = booking.listing_id
    params = {"check_in": booking.check_in.isoformat(), "check_out": booking.check_out.isoformat(), "page_size": 60}
    res = client.get("/api/listings", params=params).json()
    assert lid not in [i["id"] for i in res["items"]]
    assert res["total"] < active_count(db) and all(i["quote"]["nights"] == booking.nights for i in res["items"])

    # a stay that ends the day the booking starts does NOT overlap (check-out day is free)
    before = {
        "check_in": (booking.check_in - timedelta(days=2)).isoformat(),
        "check_out": booking.check_in.isoformat(),
        "page_size": 60,
    }
    assert lid in [i["id"] for i in client.get("/api/listings", params=before).json()["items"]]
    # and one that starts on its check-out day is fine too
    after = {
        "check_in": booking.check_out.isoformat(),
        "check_out": (booking.check_out + timedelta(days=1)).isoformat(),
        "page_size": 60,
    }
    assert lid in [i["id"] for i in client.get("/api/listings", params=after).json()["items"]]


def test_detail_and_availability_endpoint(client, db):
    booking = db.query(Booking).filter(Booking.status == "confirmed", Booking.check_in > date.today()).first()
    d = client.get(f"/api/listings/{booking.listing_id}").json()
    assert d["photo_details"] and d["amenities"] and d["host_since"] >= 2020
    assert d["rating_breakdown"] is None or set(d["rating_breakdown"]) >= {"cleanliness", "value"}
    av = client.get(f"/api/listings/{booking.listing_id}/availability").json()["booked"]
    assert {"check_in": booking.check_in.isoformat(), "check_out": booking.check_out.isoformat()} in av
    assert client.get("/api/listings/99999").status_code == 404
    assert client.get("/api/listings/99999/availability").status_code == 404


def test_catalogue_endpoints(client):
    assert any(c["key"] == "beach" for c in client.get("/api/categories").json())
    assert len(client.get("/api/amenities").json()) >= 30
