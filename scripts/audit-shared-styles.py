#!/usr/bin/env python3
"""Audit Freedom Lab static pages for shared-style drift.

Flags public HTML pages that redefine shared title/banner styling inline,
miss the shared footer, or drift away from the default rectangular preview image.
This is intentionally lightweight: it does not require a build step.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PREVIEW = 'https://freedomlab.nyc/static/img/FL%20Signature%20Rectangular2.png'
SKIP_DIRS = {
    '.git', '.hermes', 'node_modules', 'ghostr', 'internal', 'sketches',
}
SKIP_FILES = {
    'google962eebcd38de853f.html',
}
# These are utility/app-shell pages with intentionally custom or minimal chrome.
SKIP_PATHS = {
    'book-space/index.html',
    'peddler/index.html',
    'peddler/agents/index.html',
    'print-page.html',
    'print-page/index.html',
    'tag-tree-options.html',
}
REQUIRED_PUBLIC_SNIPPETS = [
    'css/styles.css',
    'footer.js',
]
FORBIDDEN_INLINE = [
    '.page-hero {',
    '.page-hero h1 {',
    '.classes-hero {',
    '.classes-hero h1 {',
    '.tutorials-hero {',
    '.tutorials-hero h1 {',
]
PREVIEW_PROPS = ['og:image', 'twitter:image']


def is_public_html(path: Path) -> bool:
    rel = path.relative_to(ROOT)
    rel_posix = rel.as_posix()
    if rel_posix in SKIP_PATHS:
        return False
    if path.name in SKIP_FILES:
        return False
    if any(part in SKIP_DIRS for part in rel.parts):
        return False
    return path.suffix == '.html'


def meta_content(text: str, prop: str) -> str | None:
    match = re.search(
        rf'<meta\s+(?:property|name)=["\']{re.escape(prop)}["\']\s+content=["\']([^"\']+)["\']',
        text,
        re.IGNORECASE,
    )
    return match.group(1) if match else None


def main() -> int:
    errors: list[str] = []
    for path in sorted(ROOT.rglob('*.html')):
        if not is_public_html(path):
            continue
        rel = path.relative_to(ROOT).as_posix()
        text = path.read_text(errors='ignore')
        if '<meta name="robots"' in text and 'noindex' in text:
            # Redirect/private/noindex utility pages intentionally have thinner chrome.
            continue
        for snippet in REQUIRED_PUBLIC_SNIPPETS:
            if snippet not in text:
                errors.append(f'{rel}: missing {snippet}')
        for forbidden in FORBIDDEN_INLINE:
            if forbidden in text:
                errors.append(f'{rel}: inline shared title-banner CSS ({forbidden})')
        for prop in PREVIEW_PROPS:
            value = meta_content(text, prop)
            if value != DEFAULT_PREVIEW:
                errors.append(f'{rel}: {prop} should be {DEFAULT_PREVIEW}, got {value or "missing"}')
    if errors:
        print('Shared style audit failed:')
        for error in errors:
            print(f'  - {error}')
        return 1
    print('Shared style audit passed')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
