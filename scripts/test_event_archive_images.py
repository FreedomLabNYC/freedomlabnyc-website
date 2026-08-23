#!/usr/bin/env python3
from __future__ import annotations

import base64
import hashlib
import io
import json
import tempfile
import unittest
from pathlib import Path

from PIL import Image

from event_archive_images import (
    ensure_archive_cover_assets,
    ensure_event_cover_assets,
    event_cover_assets_complete,
    sync_archive_file,
)


class EventArchiveImageTests(unittest.TestCase):
    def make_source(self, width: int = 2000, height: int = 1400) -> bytes:
        image = Image.new("RGB", (width, height), (38, 104, 57))
        output = io.BytesIO()
        image.save(output, format="PNG")
        return output.getvalue()

    def test_generates_local_webp_and_jpeg_srcsets_at_display_safe_sizes(self) -> None:
        source = self.make_source()
        event = {
            "name": "Test Event",
            "cover": "data:image/png;base64," + base64.b64encode(source).decode("ascii"),
        }

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            changed = ensure_event_cover_assets(event, root)

            self.assertTrue(changed)
            self.assertRegex(event["cover_local"], r"^/static/img/event-archive/event-[0-9a-f]{16}$")
            self.assertRegex(event["cover"], r"^/static/img/event-archive/event-[0-9a-f]{16}-source\.png$")

            base = root / event["cover_local"].lstrip("/")
            expected = {
                "-800.webp": (800, 560, "WEBP"),
                "-1600.webp": (1600, 1120, "WEBP"),
                "-800.jpg": (800, 560, "JPEG"),
                "-1600.jpg": (1600, 1120, "JPEG"),
            }
            for suffix, (width, height, image_format) in expected.items():
                path = Path(str(base) + suffix)
                self.assertTrue(path.exists(), path)
                with Image.open(path) as image:
                    self.assertEqual((image.width, image.height), (width, height))
                    self.assertEqual(image.format, image_format)

            source_path = root / event["cover"].lstrip("/")
            self.assertEqual(source_path.read_bytes(), source)

    def test_existing_complete_asset_set_is_a_noop(self) -> None:
        source = self.make_source()
        event = {
            "name": "Test Event",
            "cover": "data:image/png;base64," + base64.b64encode(source).decode("ascii"),
        }

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.assertTrue(ensure_event_cover_assets(event, root))
            self.assertTrue(event_cover_assets_complete(event, root))
            base = root / event["cover_local"].lstrip("/")
            Path(str(base) + "-1600.webp").unlink()
            self.assertFalse(event_cover_assets_complete(event, root))
            self.assertTrue(ensure_event_cover_assets(event, root))
            self.assertFalse(ensure_event_cover_assets(event, root))

    def test_archive_sync_deduplicates_identical_source_images(self) -> None:
        source = self.make_source()
        cover = "data:image/png;base64," + base64.b64encode(source).decode("ascii")
        events = [
            {"name": "First Event", "cover": cover},
            {"name": "Second Event", "cover": cover},
        ]

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            changed = ensure_archive_cover_assets(events, root)

            self.assertEqual(changed, ["First Event", "Second Event"])
            self.assertEqual(events[0]["cover_local"], events[1]["cover_local"])
            self.assertEqual(events[0]["cover"], events[1]["cover"])
            assets = list((root / "static/img/event-archive").glob("event-*"))
            self.assertEqual(len(assets), 5)

    def test_archive_renderer_uses_local_responsive_sources_and_remote_fallback(self) -> None:
        root = Path(__file__).resolve().parents[1]
        html = (root / "classes-events/index.html").read_text(
            encoding="utf-8"
        )
        css = (root / "css/classes.css").read_text(encoding="utf-8")

        self.assertIn("ev.cover_local", html)
        self.assertIn("-800.webp 800w", html)
        self.assertIn("-1600.webp 1600w", html)
        self.assertIn("-800.jpg 800w", html)
        self.assertIn("-1600.jpg 1600w", html)
        self.assertIn('type="image/webp"', html)
        self.assertIn('decoding="async"', html)
        self.assertIn("data-fallback-src", html)
        self.assertIn(".event-card-cover picture", css)
        self.assertLess(
            html.index("container.addEventListener('error'"),
            html.index("container.innerHTML = data.events.map"),
        )

        all_events_html = (root / "all-events/index.html").read_text(encoding="utf-8")
        self.assertIn("ev.cover_local", all_events_html)
        self.assertIn("-800.webp 800w", all_events_html)
        self.assertIn("data-fallback-src", all_events_html)
        self.assertLess(
            all_events_html.index("grid.addEventListener('error'"),
            all_events_html.index("grid.innerHTML = events.map"),
        )

    def test_archive_file_sync_updates_only_cover_metadata_and_assets(self) -> None:
        source = self.make_source()
        archive = {
            "updated": "2026-08-16T02:00:25.636Z",
            "count": 1,
            "events": [
                {
                    "name": "Test Event",
                    "date": "2026-08-15T23:00:00.000Z",
                    "cover": "data:image/png;base64," + base64.b64encode(source).decode("ascii"),
                }
            ],
        }

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            archive_path = root / "classes-events/events.json"
            archive_path.parent.mkdir(parents=True)
            archive_path.write_text(json.dumps(archive), encoding="utf-8")

            changed = sync_archive_file(archive_path, root)
            synced = json.loads(archive_path.read_text(encoding="utf-8"))

            self.assertEqual(changed, ["Test Event"])
            self.assertEqual(synced["updated"], archive["updated"])
            self.assertEqual(synced["count"], 1)
            self.assertIn("cover_local", synced["events"][0])
            self.assertEqual(sync_archive_file(archive_path, root), [])

    def test_recent_bitcoin_game_night_uses_approved_artwork(self) -> None:
        root = Path(__file__).resolve().parents[1]
        archive = json.loads((root / "classes-events" / "events.json").read_text())
        duplicates = sorted(
            [event for event in archive["events"] if event.get("name") == "Bitcoin Video and Board Game Night"],
            key=lambda event: event["date"],
        )

        self.assertEqual(len(duplicates), 2)
        older, recent = duplicates
        source_path = "/static/img/event-archive/bitcoin-video-board-game-night-2026-05-19-source.png"
        source = root / source_path.lstrip("/")
        self.assertEqual(recent["cover"], source_path)
        self.assertEqual(recent["preview"], source_path)
        self.assertEqual(recent["cover_local"], "/static/img/event-archive/event-79e1e4865377467d")
        self.assertNotEqual(older["cover"], recent["cover"])
        self.assertEqual(
            hashlib.sha256(source.read_bytes()).hexdigest(),
            "79e1e4865377467d1dbc22cf84d19b0b04fd1f03d3db0e255db3965f41eeccb7",
        )

        event_page = (root / "events" / "2026-05-19-bitcoin-video-and-board-game-night" / "index.html").read_text()
        self.assertGreaterEqual(event_page.count(source_path), 4)
        classes_page = (root / "classes-events" / "index.html").read_text()
        self.assertIn(f"https://freedomlab.nyc{source_path}", classes_page)

    def test_lightning_node_event_uses_approved_artwork(self) -> None:
        root = Path(__file__).resolve().parents[1]
        archive = json.loads((root / "classes-events" / "events.json").read_text())
        event = next(
            event
            for event in archive["events"]
            if event.get("name") == "Workshop: How to Run a Bitcoin Lightning Node for Beginners"
        )
        source_path = "/static/img/event-archive/bitcoin-lightning-node-2024-11-24-source.png"
        source = root / source_path.lstrip("/")
        self.assertEqual(event["cover"], source_path)
        self.assertEqual(event["preview"], source_path)
        self.assertEqual(event["cover_local"], "/static/img/event-archive/event-949d339224b0d232")
        self.assertEqual(
            hashlib.sha256(source.read_bytes()).hexdigest(),
            "949d339224b0d232ee4ac8b6d85a48b2e3751f0ada3e5503d3fcf0a6deb91652",
        )

        event_page = (root / "events" / "2024-11-24-workshop-how-to-run-a-bitcoin-lightning-node-for-beginners" / "index.html").read_text()
        self.assertGreaterEqual(event_page.count(source_path), 4)


if __name__ == "__main__":
    unittest.main()
