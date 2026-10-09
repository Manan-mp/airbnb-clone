from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.db import Base, SessionLocal, engine
from app.errors import DomainError
from app.routers import auth, bookings, host, listings, uploads, wishlist

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    import app.models  # noqa: F401  (register tables)

    Base.metadata.create_all(engine)
    if settings.seed_on_startup:
        from app.seed import seed_if_empty

        with SessionLocal() as db:
            seed_if_empty(db)
    yield


app = FastAPI(title="staybnb API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(DomainError)
async def domain_error_handler(_: Request, exc: DomainError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


api = APIRouter(prefix="/api")


@api.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


api.include_router(auth.router)
api.include_router(listings.router)
api.include_router(bookings.router)
api.include_router(wishlist.router)
api.include_router(host.router)
api.include_router(uploads.router)
app.include_router(api)

settings.media_dir.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.media_dir), name="media")
