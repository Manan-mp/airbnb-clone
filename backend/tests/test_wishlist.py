from tests.conftest import login


def test_wishlist_toggle_is_idempotent_and_reflected_in_search(client):
    h = login(client, "guest.zara@example.com")
    lid = client.get("/api/listings").json()["items"][0]["id"]
    assert client.put(f"/api/wishlist/{lid}", headers=h).status_code == 204
    assert client.put(f"/api/wishlist/{lid}", headers=h).status_code == 204
    saved = client.get("/api/wishlist", headers=h).json()
    assert [i["id"] for i in saved].count(lid) == 1 and saved[0]["is_wishlisted"]
    card = next(i for i in client.get("/api/listings", headers=h).json()["items"] if i["id"] == lid)
    assert card["is_wishlisted"] is True
    anon = next(i for i in client.get("/api/listings").json()["items"] if i["id"] == lid)
    assert anon["is_wishlisted"] is False
    assert client.delete(f"/api/wishlist/{lid}", headers=h).status_code == 204
    assert client.delete(f"/api/wishlist/{lid}", headers=h).status_code == 204
    assert lid not in [i["id"] for i in client.get("/api/wishlist", headers=h).json()]


def test_wishlist_guards(client):
    assert client.get("/api/wishlist").status_code == 401
    h = login(client, "guest.zara@example.com")
    assert client.put("/api/wishlist/999999", headers=h).status_code == 404
