from datetime import date, timedelta

from app.config import get_settings
from app.models import Booking, Listing
from tests.conftest import login
from tests.helpers import fresh_dates, stay, user_id

HOST = "host.kabir@example.com"
OTHER_HOST = "host.isha@example.com"
URL = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200"


def new_listing(client, headers, **over):
    amenities = client.get("/api/amenities").json()
    body = {
        "title": "Test cottage by the lake",
        "description": "A calm place with a view of the water.",
        "property_type": "cabin",
        "room_type": "entire_home",
        "category": "lakefront",
        "address": "1 Lake Rd",
        "city": "Testville",
        "state": "Kerala",
        "country": "India",
        "lat": 9.5,
        "lng": 76.3,
        "price_per_night": 4200,
        "cleaning_fee": 500,
        "max_guests": 4,
        "bedrooms": 2,
        "beds": 2,
        "bathrooms": 1,
        "photo_urls": [URL, URL + "&v=2"],
        "amenity_ids": [amenities[0]["id"], amenities[1]["id"]],
        **over,
    }
    return client.post("/api/listings", json=body, headers=headers)


def test_guest_cannot_create_listing(client):
    assert new_listing(client, login(client, "guest.riya@example.com")).status_code == 403
    assert new_listing(client, {}).status_code == 401


def test_create_appears_in_search_and_detail(client):
    h = login(client, HOST)
    r = new_listing(client, h)
    assert r.status_code == 201, r.text
    lid = r.json()["id"]
    assert lid in [i["id"] for i in client.get("/api/listings", params={"location": "Testville"}).json()["items"]]
    d = client.get(f"/api/listings/{lid}").json()
    assert len(d["photo_details"]) == 2 and len(d["amenities"]) == 2 and d["host"]["name"] == "Kabir"
    assert lid in [i["id"] for i in client.get("/api/host/listings", headers=h).json()]
    assert lid not in [i["id"] for i in client.get("/api/host/listings", headers=login(client, OTHER_HOST)).json()]


def test_create_validation(client):
    h = login(client, HOST)
    assert new_listing(client, h, category="moon").status_code == 422
    assert new_listing(client, h, price_per_night=0).status_code == 422
    assert new_listing(client, h, photo_urls=[]).status_code == 422
    assert new_listing(client, h, photo_urls=["javascript:alert(1)"]).status_code == 422
    assert new_listing(client, h, amenity_ids=[999999]).status_code == 422


def test_update_replaces_photos_and_enforces_ownership(client):
    h = login(client, HOST)
    lid = new_listing(client, h).json()["id"]
    assert (
        client.patch(f"/api/listings/{lid}", json={"title": "Nope"}, headers=login(client, OTHER_HOST)).status_code
        == 403
    )
    r = client.patch(
        f"/api/listings/{lid}",
        json={"price_per_night": 5100, "photo_urls": [URL + "&v=3"], "amenity_ids": []},
        headers=h,
    )
    assert r.status_code == 200, r.text
    d = client.get(f"/api/listings/{lid}").json()
    assert d["price_per_night"] == 5100 and d["title"] == "Test cottage by the lake"
    assert [p["url"] for p in d["photo_details"]] == [URL + "&v=3"] and d["amenities"] == []
    assert client.patch("/api/listings/999999", json={"title": "x y z"}, headers=h).status_code == 404


def test_delete_with_future_booking_is_409(client):
    h = login(client, HOST)
    lid = new_listing(client, h).json()["id"]
    d = fresh_dates()
    gh = login(client, "guest.riya@example.com")
    bid = client.post("/api/bookings", json=stay(lid, d[0], d[2]), headers=gh).json()["id"]
    assert client.delete(f"/api/listings/{lid}", headers=login(client, OTHER_HOST)).status_code == 403
    r = client.delete(f"/api/listings/{lid}", headers=h)
    assert r.status_code == 409 and "upcoming bookings" in r.json()["detail"]
    # host sees the booking on the dashboard
    assert bid in [b["id"] for b in client.get("/api/host/bookings", params={"listing_id": lid}, headers=h).json()]
    # once the guest cancels, the listing can go
    client.post(f"/api/bookings/{bid}/cancel", headers=gh)
    assert client.delete(f"/api/listings/{lid}", headers=h).status_code == 204
    assert client.get(f"/api/listings/{lid}").status_code == 404


def test_delete_without_bookings_removes_and_with_history_archives(client, db):
    h = login(client, HOST)
    lid = new_listing(client, h).json()["id"]
    assert client.delete(f"/api/listings/{lid}", headers=h).status_code == 204
    assert client.get(f"/api/listings/{lid}").status_code == 404

    lid2 = new_listing(client, h).json()["id"]
    past = date.today() - timedelta(days=10)
    db.add(
        Booking(
            listing_id=lid2,
            guest_id=5,
            check_in=past,
            check_out=past + timedelta(days=2),
            nights=2,
            nightly_price=4200,
            total_price=9000,
            status="confirmed",
        )
    )
    db.commit()
    assert client.delete(f"/api/listings/{lid2}", headers=h).status_code == 204
    assert client.get(f"/api/listings/{lid2}").status_code == 404
    assert lid2 not in [i["id"] for i in client.get("/api/host/listings", headers=h).json()]
    assert db.get(Booking, db.query(Booking.id).filter(Booking.listing_id == lid2).scalar()) is not None


def test_host_bookings_scoped_to_own_listings(client, db):
    h = login(client, HOST)
    db.rollback()
    # includes archived listings: their booking history stays visible to the host
    own = {lst.id for lst in db.query(Listing).filter(Listing.host_id == user_id(db, HOST))}
    rows = client.get("/api/host/bookings", headers=h).json()
    assert rows and all(b["listing"]["id"] in own for b in rows)
    assert client.get("/api/host/bookings", headers=login(client, "guest.riya@example.com")).status_code == 403


PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


def test_upload_validates_type_and_role(client, tmp_path, monkeypatch):
    monkeypatch.setattr(get_settings(), "media_dir", tmp_path)
    h = login(client, HOST)
    r = client.post("/api/uploads", files={"file": ("a.png", PNG, "image/png")}, headers=h)
    assert r.status_code == 201 and r.json()["url"].endswith(".png")
    assert len(list(tmp_path.iterdir())) == 1
    # content-type lies are rejected by magic-byte sniffing
    assert (
        client.post("/api/uploads", files={"file": ("x.png", b"<svg></svg>", "image/png")}, headers=h).status_code
        == 415
    )
    assert (
        client.post(
            "/api/uploads", files={"file": ("a.png", PNG, "image/png")}, headers=login(client, "guest.riya@example.com")
        ).status_code
        == 403
    )
    big = PNG + b"\x00" * (5 * 1024 * 1024)
    assert client.post("/api/uploads", files={"file": ("b.png", big, "image/png")}, headers=h).status_code == 413
