import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.config import get_settings
from app.deps import require_host
from app.models import User
from app.schemas.host import UploadOut

router = APIRouter(tags=["uploads"])

MAX_BYTES = 5 * 1024 * 1024
# Detect the type from the file's magic bytes rather than trusting the client's Content-Type.
SIGNATURES = {b"\xff\xd8\xff": ".jpg", b"\x89PNG\r\n\x1a\n": ".png"}


def _extension(head: bytes) -> str | None:
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return ".webp"
    return next((ext for sig, ext in SIGNATURES.items() if head.startswith(sig)), None)


@router.post("/uploads", response_model=UploadOut, status_code=status.HTTP_201_CREATED)
async def upload(file: UploadFile, _: User = Depends(require_host)):
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "Images must be 5 MB or smaller")
    ext = _extension(data[:12])
    if ext is None:
        raise HTTPException(415, "Only JPEG, PNG or WebP images are allowed")
    s = get_settings()
    s.media_dir.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{ext}"
    (s.media_dir / name).write_bytes(data)
    return {"url": f"{s.public_base_url.rstrip('/')}/media/{name}"}
