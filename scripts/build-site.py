#!/usr/bin/env python3
"""Build the Freedom Lab static site with shared HTML partials."""
from __future__ import annotations

import argparse
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "_site"
EXCLUDED_PREFIXES = (".github/", ".hermes/", "partials/", "scripts/", "templates/")
EXCLUDED_FILES = {".gitignore", "README.md", "package.json", "package-lock.json"}
NAV_PLACEHOLDER = re.compile(r'<div\s+id=["\']nav-placeholder["\']\s*></div>', re.IGNORECASE)
FOOTER_PLACEHOLDER = re.compile(r'<div\s+id=["\']footer-placeholder["\']\s*></div>', re.IGNORECASE)
NAV_LINK = re.compile(r'<a\b(?P<attrs>[^>]*\bdata-nav-key=["\'](?P<key>[^"\']+)["\'][^>]*)>', re.IGNORECASE)


def tracked_files() -> list[str]:
    result = subprocess.run(
        ["git", "ls-files"], cwd=ROOT, check=True, text=True, capture_output=True
    )
    return [line for line in result.stdout.splitlines() if line]


def is_deployable(rel: str) -> bool:
    return rel not in EXCLUDED_FILES and not rel.startswith(EXCLUDED_PREFIXES)


def route_for(rel: str) -> str:
    path = Path(rel)
    if rel == "index.html":
        return "/"
    if path.name == "index.html":
        return f"/{path.parent.as_posix()}/"
    return f"/{rel}"


def active_section(route: str) -> str:
    if route.startswith(("/events/", "/classes-events/")):
        return "classes-events"
    for key in ("resources", "contact", "donate", "join"):
        if route.startswith(f"/{key}/"):
            return key
    return ""


def render_nav(partial: str, route: str) -> str:
    active = active_section(route)

    def render_link(match: re.Match[str]) -> str:
        attrs = match.group("attrs")
        if match.group("key") != active:
            return f"<a{attrs}>"
        attrs = re.sub(
            r'class=(["\'])([^"\']*)\1',
            lambda class_match: (
                f'class={class_match.group(1)}'
                f'{class_match.group(2)} active{class_match.group(1)}'
            ),
            attrs,
            count=1,
        )
        return f'<a{attrs} aria-current="page">'

    return NAV_LINK.sub(render_link, partial).rstrip()


def compile_html(text: str, rel: str, nav: str, footer: str) -> tuple[str, int, int]:
    route = route_for(rel)
    compiled, nav_count = NAV_PLACEHOLDER.subn(render_nav(nav, route), text)
    compiled, footer_count = FOOTER_PLACEHOLDER.subn(footer.rstrip(), compiled)
    if nav_count > 1 or footer_count > 1:
        raise ValueError(f"{rel}: duplicate shared-component placeholder")
    return compiled, nav_count, footer_count


def build(output: Path) -> tuple[int, int, int]:
    nav = (ROOT / "partials/nav.html").read_text()
    footer = (ROOT / "partials/footer.html").read_text()
    candidate = output.with_name(f".{output.name}.candidate")
    shutil.rmtree(candidate, ignore_errors=True)
    candidate.mkdir(parents=True)

    copied = nav_pages = footer_pages = 0
    for rel in tracked_files():
        if not is_deployable(rel):
            continue
        source = ROOT / rel
        if not source.is_file():
            continue
        destination = candidate / rel
        destination.parent.mkdir(parents=True, exist_ok=True)
        if source.suffix.lower() == ".html":
            text, nav_count, footer_count = compile_html(source.read_text(), rel, nav, footer)
            destination.write_text(text)
            nav_pages += nav_count
            footer_pages += footer_count
        else:
            shutil.copy2(source, destination)
        copied += 1

    shutil.rmtree(output, ignore_errors=True)
    candidate.replace(output)
    return copied, nav_pages, footer_pages


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    output = args.output.resolve()
    if output == ROOT or ROOT not in output.parents:
        parser.error("--output must be a subdirectory of the repository")
    copied, nav_pages, footer_pages = build(output)
    print(
        f"Static site built: {copied} files, {nav_pages} navigation partials, "
        f"{footer_pages} footer partials -> {output}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
