#!/usr/bin/env python3
"""Generate the non-resource Freedom Lab writing corpus from sitemap pages."""

from __future__ import annotations

import argparse
import re
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SITEMAP = ROOT / "sitemap.xml"
DEFAULT_OUTPUT = ROOT / "docs" / "freedom-lab-writing-corpus.generated.md"
TARGET_TAGS = {"h1", "h2", "h3", "p", "li", "button"}
IGNORE_TAGS = {"script", "style", "nav", "footer", "noscript", "svg", "template"}
CTA_CLASS_TOKENS = {"button", "btn", "cta", "action", "submit"}


def clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


class CopyExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ignore_depth = 0
        self.main_depth = 0
        self.has_main = False
        self.current: tuple[str, list[str]] | None = None
        self.items: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        if tag in IGNORE_TAGS:
            self.ignore_depth += 1
            return
        if self.ignore_depth:
            return
        if tag == "main":
            self.has_main = True
            self.main_depth += 1
            return
        if self.has_main and self.main_depth == 0:
            return
        if tag in TARGET_TAGS:
            self.current = (tag, [])
            return
        if tag == "a":
            classes = set()
            for key, value in attrs:
                if key == "class" and value:
                    classes.update(value.lower().replace("-", " ").replace("_", " ").split())
            if classes & CTA_CLASS_TOKENS:
                self.current = ("cta", [])

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in IGNORE_TAGS:
            self.ignore_depth = max(0, self.ignore_depth - 1)
            return
        if self.ignore_depth:
            return
        if tag == "main":
            self.main_depth = max(0, self.main_depth - 1)
            return
        if self.current and (tag == self.current[0] or (self.current[0] == "cta" and tag == "a")):
            kind, parts = self.current
            text = clean("".join(parts))
            if text:
                self.items.append((kind.upper(), text))
            self.current = None

    def handle_data(self, data: str) -> None:
        if self.ignore_depth or not self.current:
            return
        if self.has_main and self.main_depth == 0:
            return
        self.current[1].append(data)


def sitemap_pages() -> list[tuple[str, Path, str]]:
    root = ET.parse(SITEMAP).getroot()
    namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    pages = []
    for location in root.findall("s:url/s:loc", namespace):
        url = (location.text or "").strip()
        path = urlparse(url).path
        if path == "/resources/" or path.startswith("/resources/"):
            continue
        relative = Path("index.html") if path == "/" else Path(path.strip("/")) / "index.html"
        kind = "generated event page" if path.startswith("/events/") else "editorial page"
        pages.append((url, ROOT / relative, kind))
    return pages


def extract(path: Path) -> list[tuple[str, str]]:
    parser = CopyExtractor()
    parser.feed(path.read_text(errors="ignore"))
    return parser.items


def render() -> str:
    pages = sitemap_pages()
    missing = [str(path.relative_to(ROOT)) for _, path, _ in pages if not path.exists()]
    if missing:
        raise FileNotFoundError("Missing sitemap pages: " + ", ".join(missing))

    editorial_count = sum(kind == "editorial page" for _, _, kind in pages)
    event_count = sum(kind == "generated event page" for _, _, kind in pages)
    lines = [
        "# Freedom Lab writing corpus",
        "",
        "Generated from the sitemap and local source HTML. Resource pages are excluded by design.",
        "",
        f"- Pages reviewed: {len(pages)}",
        f"- Editorial pages: {editorial_count}",
        f"- Generated event pages: {event_count}",
        "- Resources pages: excluded",
        "",
        "Generated event pages share one template. They remain in the corpus so event naming and operational language are represented, but repeated template copy should not be overweighted when inferring voice.",
        "",
    ]

    for index, (url, path, kind) in enumerate(pages, 1):
        items = extract(path)
        lines.extend(
            [
                f"## {index:02d}. {url}",
                "",
                f"Source: `{path.relative_to(ROOT)}` · {kind}",
                "",
            ]
        )
        if not items:
            lines.append("_No supported visible copy elements found._")
        else:
            for tag, text in items:
                lines.append(f"- **{tag}:** {text}")
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--check", action="store_true", help="Fail if the generated corpus differs from the file on disk")
    args = parser.parse_args()
    content = render()
    output = args.output if args.output.is_absolute() else ROOT / args.output
    if args.check:
        if not output.exists() or output.read_text() != content:
            raise SystemExit(f"Writing corpus is stale: {output}")
        print(f"Writing corpus current: {output}")
        return
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(content)
    print(f"Wrote {output}")


if __name__ == "__main__":
    main()
