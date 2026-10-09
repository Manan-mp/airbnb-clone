from collections.abc import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

IMMEDIATE_OPTION = "sqlite_begin_immediate"


class Base(DeclarativeBase):
    pass


def make_engine(url: str):
    engine = create_engine(url, connect_args={"check_same_thread": False} if url.startswith("sqlite") else {})

    if url.startswith("sqlite"):

        @event.listens_for(engine, "connect")
        def _sqlite_pragmas(dbapi_conn, _):
            # Let SQLAlchemy emit BEGIN itself so we can use BEGIN IMMEDIATE for bookings.
            dbapi_conn.isolation_level = None
            cur = dbapi_conn.cursor()
            cur.execute("PRAGMA foreign_keys=ON")
            cur.execute("PRAGMA journal_mode=WAL")
            cur.execute("PRAGMA busy_timeout=5000")
            cur.close()

        @event.listens_for(engine, "begin")
        def _sqlite_begin(conn):
            # Opt-in per transaction (not per pooled connection) via an execution option.
            immediate = conn.get_execution_options().get(IMMEDIATE_OPTION)
            conn.exec_driver_sql("BEGIN IMMEDIATE" if immediate else "BEGIN")

    return engine


engine = make_engine(get_settings().database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def begin_immediate(db: Session) -> None:
    """End any open (read) transaction and start a write-locked one.

    On SQLite this issues BEGIN IMMEDIATE, so concurrent writers queue on busy_timeout
    instead of both passing a read-then-write check.
    """
    if db.in_transaction():
        db.commit()
    db.connection(execution_options={IMMEDIATE_OPTION: True})


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
