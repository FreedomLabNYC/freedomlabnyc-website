#!/usr/bin/env python3
"""Build durable, responsive local images for Freedom Lab event cards."""
from __future__ import annotations

import base64
import hashlib
import io
import json
import os
import tempfile
import urllib.request
from pathlib import Path
from urllib.parse import unquote_to_bytes, urlsplit

from PIL import Image, ImageOps

WIDTHS = (800, 1600)
ASSET_SUFFIXES = tuple(
    f"-{width}.{extension}"
    for width in WIDTHS
    for extension in ("webp", "jpg")
)
ARCHIVE_ASSET_DIR = Path("static/img/event-archive")
JPEG_BACKGROUND = (26, 31, 46)


def _asset_set_complete(root: Path, cover_local: str) -> bool:
    base = root / cover_local.lstrip("/")
    return all(Path(str(base) + suffix).is_file() for suffix in ASSET_SUFFIXES)


def event_cover_assets_complete(event: dict[str, object], root: Path) -> bool:
    cover_local = event.get("cover_local")
    return isinstance(cover_local, str) and _asset_set_complete(root, cover_local)


def _read_cover(cover: str, root: Path) -> tuple[bytes, str | None]:
    if cover.startswith("data:"):
        header, payload = cover.split(",", 1)
        mime = header[5:].split(";", 1)[0]
        raw = base64.b64decode(payload) if ";base64" in header else unquote_to_bytes(payload)
        return raw, mime

    parsed = urlsplit(cover)
    if parsed.scheme in {"http", "https"}:
        request = urllib.request.Request(
            cover,
            headers={
                "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
                "User-Agent": "Mozilla/5.0 FreedomLabArchiveImages/1.0",
            },
        )
        with urllib.request.urlopen(request, timeout=45) as response:
            if response.status != 200:
                raise RuntimeError(f"Cover returned HTTP {response.status}: {cover}")
            return response.read(), response.headers.get_content_type()

    source = (root / cover.lstrip("/")).resolve()
    resolved_root = root.resolve()
    if resolved_root not in source.parents:
        raise ValueError(f"Cover path escapes website root: {cover}")
    return source.read_bytes(), None


def _source_extension(image_format: str | None, mime: str | None) -> str:
    normalized = (image_format or "").upper()
    if normalized == "JPEG":
        return ".jpg"
    if normalized in {"PNG", "WEBP", "AVIF"}:
        return "." + normalized.lower()
    return {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/avif": ".avif",
    }.get(mime or "", ".img")


def _resized(image: Image.Image, width: int) -> Image.Image:
    height = max(1, round(image.height * width / image.width))
    return image.resize((width, height), Image.Resampling.LANCZOS)


def _save_variants(image: Image.Image, base: Path, temp_dir: Path) -> list[tuple[Path, Path]]:
    outputs: list[tuple[Path, Path]] = []
    has_alpha = "A" in image.getbands()
    webp_source = image.convert("RGBA" if has_alpha else "RGB")

    if has_alpha:
        jpeg_source = Image.new("RGB", image.size, JPEG_BACKGROUND)
        jpeg_source.paste(image.convert("RGBA"), mask=image.getchannel("A"))
    else:
        jpeg_source = image.convert("RGB")

    for width in WIDTHS:
        webp_path = Path(str(base) + f"-{width}.webp")
        jpeg_path = Path(str(base) + f"-{width}.jpg")
        temp_webp = temp_dir / webp_path.name
        temp_jpeg = temp_dir / jpeg_path.name

        _resized(webp_source, width).save(
            temp_webp,
            format="WEBP",
            quality=88,
            method=6,
        )
        _resized(jpeg_source, width).save(
            temp_jpeg,
            format="JPEG",
            quality=90,
            optimize=True,
            progressive=True,
        )
        outputs.extend(((temp_webp, webp_path), (temp_jpeg, jpeg_path)))

    return outputs


def ensure_event_cover_assets(event: dict[str, object], root: Path) -> bool:
    """Ensure one event has a complete local responsive image set.

    Returns True when files or event metadata changed.
    """
    cover = event.get("cover")
    if not isinstance(cover, str) or not cover:
        return False

    if event_cover_assets_complete(event, root):
        return False

    raw, mime = _read_cover(cover, root)
    digest = hashlib.sha256(raw).hexdigest()[:16]
    local_base = f"/{ARCHIVE_ASSET_DIR.as_posix()}/event-{digest}"
    base = root / local_base.lstrip("/")
    base.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(io.BytesIO(raw)) as opened:
        image_format = opened.format
        image = ImageOps.exif_transpose(opened)
        image.load()

    with tempfile.TemporaryDirectory(prefix="event-cover-", dir=base.parent) as tmp:
        temp_dir = Path(tmp)
        outputs = _save_variants(image, base, temp_dir)

        if cover.startswith("data:"):
            source_extension = _source_extension(image_format, mime)
            source_path = Path(str(base) + "-source" + source_extension)
            temp_source = temp_dir / source_path.name
            temp_source.write_bytes(raw)
            outputs.append((temp_source, source_path))
            event["cover"] = "/" + source_path.relative_to(root).as_posix()

        for temporary, destination in outputs:
            destination.parent.mkdir(parents=True, exist_ok=True)
            os.replace(temporary, destination)

    event["cover_local"] = local_base
    return True


def ensure_archive_cover_assets(events: list[dict[str, object]], root: Path) -> list[str]:
    """Ensure every covered archive event has local responsive assets."""
    changed: list[str] = []
    for event in events:
        if ensure_event_cover_assets(event, root):
            changed.append(str(event.get("name") or "Untitled event"))
    return changed


def sync_archive_file(archive_path: Path, root: Path) -> list[str]:
    """Generate missing assets and atomically persist updated cover metadata."""
    archive = json.loads(archive_path.read_text(encoding="utf-8"), strict=False)
    events = archive.get("events")
    if not isinstance(events, list) or not all(isinstance(event, dict) for event in events):
        raise ValueError(f"Invalid events array in {archive_path}")

    changed = ensure_archive_cover_assets(events, root)
    if not changed:
        return []

    temporary = archive_path.with_suffix(archive_path.suffix + ".tmp")
    temporary.write_text(json.dumps(archive, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    os.replace(temporary, archive_path)
    return changed
