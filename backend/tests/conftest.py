import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401
from app.db import Base, get_db, make_engine
from app.main import app
from app.seed import seed


@pytest.fixture(scope="session")
def engine(tmp_path_factory):
    eng = make_engine(f"sqlite:///{tmp_path_factory.mktemp('db') / 'test.db'}")
    Base.metadata.create_all(eng)
    with sessionmaker(bind=eng, expire_on_commit=False)() as db:
        seed(db)
    return eng


@pytest.fixture()
def client(engine):
    Session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def db(engine):
    with sessionmaker(bind=engine, expire_on_commit=False)() as session:
        yield session


def login(client, email="jon.snow@north.com", password=None):
    password = password or ("winteriscoming" if email.endswith("@north.com") else "demo1234")
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}
