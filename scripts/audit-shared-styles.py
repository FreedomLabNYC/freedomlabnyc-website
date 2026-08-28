#!/usr/bin/env python3
"""Audit Freedom Lab static pages for shared-style drift.

Flags public HTML pages that redefine shared title/banner styling inline,
miss the shared footer, or drift away from the default rectangular preview image.
It also locks the canonical join page navigation to the homepage navigation.
Event pages may use an explicit self-hosted event-archive preview.
This is intentionally lightweight: it does not require a build step.
"""
from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PREVIEW = 'https://freedomlab.nyc/static/img/FL%20Signature%20Rectangular2.png'
EVENT_PREVIEW_PREFIX = 'https://freedomlab.nyc/static/img/event-archive/'
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


def nav_links(text: str) -> list[tuple[str, str]]:
    """Return visible label/href pairs from the site's primary navigation."""
    nav = re.search(
        r'<nav\b[^>]*class=["\'][^"\']*\bnav-menu\b[^"\']*["\'][^>]*>(.*?)</nav>',
        text,
        re.IGNORECASE | re.DOTALL,
    )
    if not nav:
        return []
    links: list[tuple[str, str]] = []
    for match in re.finditer(r'<a\b([^>]*)>(.*?)</a>', nav.group(1), re.IGNORECASE | re.DOTALL):
        href = re.search(r'href=["\']([^"\']+)', match.group(1), re.IGNORECASE)
        label = re.sub(r'<[^>]+>', ' ', match.group(2))
        links.append((' '.join(label.split()), href.group(1) if href else ''))
    return links


def css_declarations(text: str, selector: str) -> dict[str, str]:
    """Return simple declarations from one exact CSS rule."""
    match = re.search(rf'{re.escape(selector)}\s*\{{(.*?)\}}', text, re.DOTALL)
    if not match:
        return {}
    declarations: dict[str, str] = {}
    for declaration in match.group(1).split(';'):
        if ':' not in declaration:
            continue
        name, value = declaration.split(':', 1)
        declarations[name.strip()] = value.strip()
    return declarations


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


def valid_event_preview(rel: str, values: dict[str, str | None]) -> bool:
    """Allow matching, self-hosted event artwork when the local asset exists."""
    preview = values.get('og:image')
    if not rel.startswith('events/') or preview != values.get('twitter:image'):
        return False
    if not preview or not preview.startswith(EVENT_PREVIEW_PREFIX):
        return False
    asset = ROOT / unquote(preview.removeprefix('https://freedomlab.nyc/'))
    return asset.is_file()


def main() -> int:
    errors: list[str] = []
    home_nav = nav_links((ROOT / 'index.html').read_text(errors='ignore'))
    join_nav = nav_links((ROOT / 'join/index.html').read_text(errors='ignore'))
    if join_nav != home_nav:
        errors.append(f'join/index.html: navigation differs from homepage: {join_nav!r} != {home_nav!r}')
    join_css = (ROOT / 'css/join-options.css').read_text(errors='ignore')
    hamburger = css_declarations(join_css, '.join-option-page .hamburger')
    expected_hamburger = {
        'width': '44px',
        'height': '44px',
        'min-height': '44px',
        'padding': '12px 0 12px 16px',
        'margin': '-12px 0 -12px auto',
    }
    for prop, expected in expected_hamburger.items():
        if hamburger.get(prop) != expected:
            errors.append(
                f'css/join-options.css: mobile hamburger {prop} should be {expected}, '
                f'got {hamburger.get(prop) or "missing"}'
            )
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
        preview_values = {prop: meta_content(text, prop) for prop in PREVIEW_PROPS}
        if valid_event_preview(rel, preview_values):
            continue
        for prop, value in preview_values.items():
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
