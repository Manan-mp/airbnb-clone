from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    environment: str = "development"  # set ENVIRONMENT=production on Railway
    database_url: str = f"sqlite:///{BACKEND_DIR / 'app.db'}"
    jwt_secret: str = "dev-only-change-me"  # override with JWT_SECRET
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7
    # Comma-separated list of allowed browser origins.
    cors_origins: str = "http://localhost:3000"
    media_dir: Path = BACKEND_DIR / "media"
    public_base_url: str = "http://localhost:8000"
    seed_on_startup: bool = False

    service_fee_rate: float = 0.14

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


DEV_SECRET = "dev-only-change-me"


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if settings.environment == "production" and (settings.jwt_secret == DEV_SECRET or len(settings.jwt_secret) < 32):
        raise RuntimeError("JWT_SECRET must be set to a random value of at least 32 characters in production")
    return settings
