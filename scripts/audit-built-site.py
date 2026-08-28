#!/usr/bin/env python3
"""Validate the compiled Freedom Lab Pages artifact."""
from __future__ import annotations

import argparse
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_NAV = [
    ("/classes-events/", "Classes &amp; Events"),
    ("/resources/", "Resources"),
    ("/contact/", "Contact"),
    ("/donate/", "Donate"),
    ("/join/", "Join"),
]


def source_html_files() -> list[str]:
    result = subprocess.run(
        ["git", "ls-files", "*.html"], cwd=ROOT, check=True, text=True, capture_output=True
    )
    return [
        rel for rel in result.stdout.splitlines()
        if rel and not rel.startswith(("templates/", "partials/", ".hermes/"))
    ]


def nav_links(text: str) -> list[tuple[str, str]]:
    nav = re.search(r'<nav\b[^>]*id=["\']navMenu["\'][^>]*>(.*?)</nav>', text, re.I | re.S)
    if not nav:
        return []
    return [
        (href, re.sub(r"\s+", " ", label).strip())
        for href, label in re.findall(r'<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', nav.group(1), re.I | re.S)
    ]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("site", type=Path)
    args = parser.parse_args()
    site = args.site.resolve()
    errors: list[str] = []
    nav_count = footer_count = 0

    for rel in source_html_files():
        source = (ROOT / rel).read_text(errors="ignore")
        built_path = site / rel
        if not built_path.is_file():
            errors.append(f"{rel}: missing from build")
            continue
        built = built_path.read_text(errors="ignore")
        source_nav = 'id="nav-placeholder"' in source or "id='nav-placeholder'" in source
        source_footer = 'id="footer-placeholder"' in source or "id='footer-placeholder'" in source
        if source_nav:
            nav_count += 1
            if "nav-placeholder" in built:
                errors.append(f"{rel}: unresolved navigation placeholder")
            if built.count("data-shared-navigation") != 1:
                errors.append(f"{rel}: expected one compiled shared navigation")
            if nav_links(built) != EXPECTED_NAV:
                errors.append(f"{rel}: compiled navigation links differ from the partial")
            if "/js/nav.js?v=build-partials-1" not in built:
                errors.append(f"{rel}: missing cache-busted navigation behavior")
        if source_footer:
            footer_count += 1
            if "footer-placeholder" in built:
                errors.append(f"{rel}: unresolved footer placeholder")
            if built.count('<footer class="site-footer">') != 1:
                errors.append(f"{rel}: expected one compiled shared footer")

    if (site / "partials/nav.html").exists() or (site / ".github/workflows/pages.yml").exists():
        errors.append("development-only sources leaked into the deployment artifact")
    nav_js = (site / "js/nav.js").read_text(errors="ignore")
    footer_js = (site / "js/footer.js").read_text(errors="ignore")
    if "<header" in nav_js or "navMarkup" in nav_js or "renderNav" in nav_js:
        errors.append("js/nav.js still owns navigation markup")
    if "<footer" in footer_js or "renderFooter" in footer_js:
        errors.append("js/footer.js still owns footer markup")

    if errors:
        print("Built-site audit failed:")
        for error in errors:
            print(f"  - {error}")
        return 1
    print(f"Built-site audit passed: {nav_count} nav pages, {footer_count} footer pages")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
