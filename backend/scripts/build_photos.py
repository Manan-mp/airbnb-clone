"""Verify every candidate Unsplash photo returns HTTP 200 and cache the survivors.

Run once with network access:  python scripts/build_photos.py
The seed (app/seed.py) reads only app/seed_data/photos.json, so seeding is
deterministic and works offline. Photo IDs are never invented: candidates come
from candidates.json and anything that does not return 200 is dropped.
"""
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import httpx

DATA = Path(__file__).resolve().parent.parent / "app" / "seed_data"
URL = "https://images.unsplash.com/photo-{id}?auto=format&fit=crop&w=1200&q=75"


def check(photo_id: str) -> tuple[str, bool]:
    try:
        r = httpx.head(URL.format(id=photo_id), timeout=15, follow_redirects=True)
        return photo_id, r.status_code == 200 and r.headers.get("content-type", "").startswith("image/")
    except httpx.HTTPError:
        return photo_id, False


def main() -> int:
    candidates = json.loads((DATA / "candidates.json").read_text())
    pools = {k: v for k, v in candidates.items() if not k.startswith("_")}
    ids = sorted({i for v in pools.values() for i in v})
    with ThreadPoolExecutor(8) as ex:
        ok = dict(ex.map(check, ids))
    out = {k: [i for i in v if ok[i]] for k, v in pools.items()}
    dropped = [i for i in ids if not ok[i]]
    (DATA / "photos.json").write_text(json.dumps({"url_template": URL, "pools": out}, indent=1))
    print({k: f"{len(v)}/{len(pools[k])}" for k, v in out.items()})
    print("dropped:", dropped)
    return 0 if all(out.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
