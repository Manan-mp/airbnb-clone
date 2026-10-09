"""Two clients race for the same dates: exactly one booking may win.

The availability check is slowed down (inside the transaction) so both requests are
guaranteed to be in flight at once. BEGIN IMMEDIATE serialises them: the loser waits
on the write lock, then re-checks, sees the winner's booking and gets a 409.
"""

import threading
import time

from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.main import app
from app.models import Booking
from app.services import bookings as booking_service
from tests.conftest import login
from tests.helpers import fresh_dates, listing_of, stay


def _race(n_threads: int, payload: dict, headers: list[dict]) -> list[int]:
    barrier = threading.Barrier(n_threads)
    codes: list[int] = [0] * n_threads

    def worker(i: int) -> None:
        with TestClient(app, raise_server_exceptions=False) as c:
            barrier.wait()
            codes[i] = c.post("/api/bookings", json=payload, headers=headers[i]).status_code

    threads = [threading.Thread(target=worker, args=(i,)) for i in range(n_threads)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=30)
    return codes


def _slow_availability(monkeypatch, delay: float = 0.3):
    real = booking_service.is_available

    def slow(*args, **kwargs):
        result = real(*args, **kwargs)
        time.sleep(delay)  # widen the check-then-insert window
        return result

    monkeypatch.setattr(booking_service, "is_available", slow)


def test_two_concurrent_bookings_exactly_one_wins(client, db, monkeypatch):
    _slow_availability(monkeypatch)
    listing = listing_of(db, "host.aarav@example.com")
    heads = [login(client, "guest.riya@example.com"), login(client, "guest.dev@example.com")]
    for _ in range(3):  # repeat to make a lucky pass unlikely
        d = fresh_dates()
        payload = stay(listing.id, d[0], d[3])
        codes = _race(2, payload, heads)
        assert sorted(codes) == [201, 409], codes
        db.rollback()  # end the fixture session's old read snapshot (WAL)
        n = db.scalar(
            select(func.count(Booking.id)).where(
                Booking.listing_id == listing.id,
                Booking.status == "confirmed",
                Booking.check_in < d[3],
                Booking.check_out > d[0],
            )
        )
        assert n == 1


def test_many_concurrent_overlapping_bookings(client, db, monkeypatch):
    _slow_availability(monkeypatch, delay=0.1)
    listing = listing_of(db, "host.meera@example.com")
    d = fresh_dates()
    heads = [
        login(client, e) for e in ("guest.riya@example.com", "guest.dev@example.com", "guest.zara@example.com")
    ] * 2
    codes = _race(6, stay(listing.id, d[0], d[2]), heads)
    assert codes.count(201) == 1 and codes.count(409) == 5, codes
