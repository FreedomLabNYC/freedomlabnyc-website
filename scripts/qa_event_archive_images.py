#!/usr/bin/env python3
"""Real-browser QA for local Freedom Lab archive cover delivery."""
from __future__ import annotations

import argparse
import json
import tempfile
import time
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import Browser, Page, Route, sync_playwright


def block_unrelated_remote(route: Route) -> None:
    host = urlsplit(route.request.url).hostname
    if host in {"127.0.0.1", "localhost"}:
        route.continue_()
    else:
        route.fulfill(status=204, body="")


def exercise_archive(page: Page, url: str, screenshot: Path) -> dict[str, object]:
    errors: list[str] = []
    console_errors: list[str] = []
    remote_cover_requests: list[str] = []
    cover_response_bytes = 0

    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on(
        "console",
        lambda message: console_errors.append(message.text) if message.type == "error" else None,
    )
    page.on(
        "request",
        lambda request: remote_cover_requests.append(request.url)
        if urlsplit(request.url).hostname == "images.lumacdn.com"
        else None,
    )

    def record_response(response: object) -> None:
        nonlocal cover_response_bytes
        response_url = response.url  # type: ignore[attr-defined]
        if "/static/img/event-archive/" not in response_url:
            return
        value = response.headers.get("content-length")  # type: ignore[attr-defined]
        if value and value.isdigit():
            cover_response_bytes += int(value)

    page.on("response", record_response)
    response = page.goto(url, wait_until="domcontentloaded", timeout=30_000)
    if response is None or response.status != 200:
        raise AssertionError(f"Archive navigation failed: {response and response.status}")

    cards = page.locator("#eventCards .event-card")
    cards.first.wait_for(state="visible", timeout=15_000)
    card_count = cards.count()
    expected_count = page.evaluate(
        "fetch('events.json').then(response => response.json()).then(data => data.count)"
    )
    if card_count != expected_count:
        raise AssertionError(f"Expected {expected_count} archive cards, got {card_count}")

    images = page.locator("#eventCards .event-card-img")
    image_count = images.count()
    for index in range(0, image_count, 2):
        images.nth(index).scroll_into_view_if_needed(timeout=5_000)

    page.wait_for_function(
        """() => [...document.querySelectorAll('#eventCards .event-card-img')]
            .every(img => img.complete && img.naturalWidth > 0)""",
        timeout=30_000,
    )

    metrics = page.locator("#eventCards .event-card-img").evaluate_all(
        """images => images.map(img => ({
            currentSrc: img.currentSrc,
            naturalWidth: img.naturalWidth,
            assetWidth: Number(img.currentSrc.match(/-(800|1600)\.(?:webp|jpg)(?:\?|$)/)?.[1] || img.naturalWidth),
            clientWidth: img.clientWidth,
            requiredWidth: img.clientWidth * window.devicePixelRatio,
            fallbackUsed: img.dataset.fallbackUsed || ''
        }))"""
    )
    if any("/static/img/event-archive/" not in item["currentSrc"] for item in metrics):
        raise AssertionError("An archive card did not use a self-hosted cover")
    if any(item["assetWidth"] < item["requiredWidth"] for item in metrics):
        raise AssertionError("A selected cover is undersized for its rendered DPR")
    if remote_cover_requests:
        raise AssertionError(f"Unexpected Luma cover requests: {remote_cover_requests[:3]}")

    page.locator(".event-archive-section").scroll_into_view_if_needed()
    screenshot.parent.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=str(screenshot), full_page=False)

    if errors or console_errors:
        raise AssertionError(f"Browser errors: page={errors} console={console_errors}")

    return {
        "viewport": page.viewport_size,
        "device_pixel_ratio": page.evaluate("window.devicePixelRatio"),
        "cards": card_count,
        "images": image_count,
        "selected_widths": sorted({item["assetWidth"] for item in metrics}),
        "minimum_resolution_ratio": round(
            min(item["assetWidth"] / item["requiredWidth"] for item in metrics), 2
        ),
        "cover_response_bytes": cover_response_bytes,
        "remote_cover_requests": len(remote_cover_requests),
        "screenshot": str(screenshot),
    }


def exercise_remote_fallback(browser: Browser, url: str) -> dict[str, object]:
    context = browser.new_context(viewport={"width": 1200, "height": 900})
    page = context.new_page()
    page.goto(url, wait_until="domcontentloaded", timeout=30_000)
    first = page.locator("#eventCards .event-card-img").first
    first.wait_for(state="attached", timeout=15_000)
    local_src = first.get_attribute("src")
    fallback = first.get_attribute("data-fallback-src")
    if not local_src or not fallback:
        raise AssertionError("First archive image is missing local/fallback metadata")
    local_base = local_src.rsplit("-", 1)[0]
    context.close()

    context = browser.new_context(viewport={"width": 1200, "height": 900})
    page = context.new_page()

    def fallback_route(route: Route) -> None:
        request_url = route.request.url
        if local_base in request_url:
            route.fulfill(status=404, content_type="text/plain", body="missing")
        elif request_url == fallback:
            route.continue_()
        else:
            block_unrelated_remote(route)

    page.route("**/*", fallback_route)
    page.goto(url, wait_until="domcontentloaded", timeout=30_000)
    first = page.locator("#eventCards .event-card-img").first
    first.scroll_into_view_if_needed()
    page.wait_for_function(
        """() => {
            const img = document.querySelector('#eventCards .event-card-img');
            return img?.dataset.fallbackUsed === 'true' && img.complete && img.naturalWidth > 0;
        }""",
        timeout=30_000,
    )
    current_src = first.evaluate("img => img.currentSrc")
    context.close()
    if urlsplit(current_src).hostname != "images.lumacdn.com":
        raise AssertionError(f"Remote fallback did not load: {current_src}")
    return {"fallback_loaded": True, "fallback_host": "images.lumacdn.com"}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True)
    args = parser.parse_args()
    url = args.base_url.rstrip("/") + "/classes-events/?qa=local-covers"
    started = time.monotonic()
    output_dir = Path(tempfile.gettempdir()) / "freedomlab-event-archive-qa"

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        desktop_context = browser.new_context(
            viewport={"width": 1440, "height": 1000}, device_scale_factor=2
        )
        desktop_page = desktop_context.new_page()
        desktop_page.route("**/*", block_unrelated_remote)
        desktop = exercise_archive(desktop_page, url, output_dir / "desktop.png")
        desktop_context.close()

        mobile_context = browser.new_context(
            viewport={"width": 390, "height": 844}, device_scale_factor=3,
            is_mobile=True, has_touch=True,
        )
        mobile_page = mobile_context.new_page()
        mobile_page.route("**/*", block_unrelated_remote)
        mobile = exercise_archive(mobile_page, url, output_dir / "mobile.png")
        mobile_context.close()

        fallback = exercise_remote_fallback(browser, url)
        browser.close()

    print(json.dumps({
        "duration_seconds": round(time.monotonic() - started, 2),
        "desktop": desktop,
        "mobile": mobile,
        "fallback": fallback,
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
