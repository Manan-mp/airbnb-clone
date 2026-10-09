from tests.conftest import login


def test_login_and_me(client):
    h = login(client)
    me = client.get("/api/auth/me", headers=h).json()
    assert me["email"] == "guest.riya@example.com" and me["role"] == "guest"
    assert "password" not in str(me)


def test_wrong_password_is_401(client):
    r = client.post("/api/auth/login", json={"email": "guest.riya@example.com", "password": "nope-nope"})
    assert r.status_code == 401


def test_me_requires_valid_token(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer garbage"}).status_code == 401


def test_signup_duplicate_and_roles(client):
    body = {"email": "New.User@example.com", "password": "longenough1", "name": "New", "role": "host"}
    r = client.post("/api/auth/signup", json=body)
    assert r.status_code == 201 and r.json()["user"]["role"] == "host"
    assert r.json()["user"]["email"] == "new.user@example.com"  # normalised
    assert client.post("/api/auth/signup", json=body).status_code == 409
    assert client.post("/api/auth/signup", json={**body, "email": "x@example.com", "role": "admin"}).status_code == 422
    assert client.post("/api/auth/signup", json={**body, "email": "y@example.com", "password": "short"}).status_code == 422
