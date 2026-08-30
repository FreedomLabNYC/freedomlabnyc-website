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
from html import unescape
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PREVIEW = 'https://freedomlab.nyc/static/img/FL%20Signature%20Rectangular2.png'
EVENT_PREVIEW_PREFIX = 'https://freedomlab.nyc/static/img/event-archive/'
SKIP_DIRS = {
    '.git', '.hermes', '_site', 'node_modules', 'ghostr', 'internal', 'partials', 'sketches',
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
    'css/styles.css?v=universal-nav-1',
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
SHARED_NAV_SCRIPT = '/js/nav.js?v=build-partials-1'
EXPECTED_NAV_LINKS = [
    ('Classes & Events', '/classes-events/'),
    ('Resources', '/resources/'),
    ('Contact', '/contact/'),
    ('Donate', '/donate/'),
    ('Apply', '/join/'),
]
SHARED_CHROME_SELECTOR_TOKENS = (
    '.site-nav-header',
    '.nav-menu',
    '.nav-link',
    '.nav-btn',
    '.hamburger',
    '.mobile-overlay',
)
LEGACY_NAV_BINDING_SNIPPETS = (
    "getElementById('hamburger')",
    'getElementById("hamburger")',
    'mobileOverlay.addEventListener',
    'mobileOverlay?.addEventListener',
)


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
        label = unescape(re.sub(r'<[^>]+>', ' ', match.group(2)))
        links.append((' '.join(label.split()), href.group(1) if href else ''))
    return links


def shared_chrome_selectors(text: str) -> list[str]:
    selectors: list[str] = []
    for match in re.finditer(r'([^{}]+)\{[^{}]*\}', text, re.DOTALL):
        selector = ' '.join(match.group(1).split())
        if any(token in selector for token in SHARED_CHROME_SELECTOR_TOKENS):
            selectors.append(selector)
    return selectors


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
    nav_partial = (ROOT / 'partials/nav.html').read_text(errors='ignore')
    component_nav = nav_links(nav_partial)
    if component_nav != EXPECTED_NAV_LINKS:
        errors.append(
            f'partials/nav.html: canonical navigation differs from expected: '
            f'{component_nav!r} != {EXPECTED_NAV_LINKS!r}'
        )
    shared_nav = (ROOT / 'js/nav.js').read_text(errors='ignore')
    if '<header' in shared_nav or 'renderNav' in shared_nav or 'navMarkup' in shared_nav:
        errors.append('js/nav.js: navigation markup must live only in partials/nav.html')
    if "matchMedia('(min-width: 769px)')" not in shared_nav:
        errors.append('js/nav.js: missing desktop-breakpoint menu reset')
    shared_footer = (ROOT / 'js/footer.js').read_text(errors='ignore')
    if '<footer' in shared_footer or 'renderFooter' in shared_footer:
        errors.append('js/footer.js: footer markup must live only in partials/footer.html')
    shared_css = (ROOT / 'css/styles.original.css').read_text(errors='ignore')
    shared_header = css_declarations(shared_css, '.site-nav-header')
    expected_shared_header = {
        'background': 'linear-gradient(180deg, #1c1b19 0%, #201f1d 100%) !important',
        'backdrop-filter': 'none',
        '-webkit-backdrop-filter': 'none',
    }
    for prop, expected in expected_shared_header.items():
        if shared_header.get(prop) != expected:
            errors.append(
                f'css/styles.original.css: shared header {prop} should be {expected}, '
                f'got {shared_header.get(prop) or "missing"}'
            )
    for css_path in [*(ROOT / 'css').glob('*.css'), ROOT / 'resources2/styles.css']:
        if css_path in {ROOT / 'css/styles.css', ROOT / 'css/styles.original.css'} or not css_path.exists():
            continue
        selectors = shared_chrome_selectors(css_path.read_text(errors='ignore'))
        for selector in selectors:
            errors.append(
                f'{css_path.relative_to(ROOT)}: route-specific shared chrome override ({selector})'
            )
    join_css = (ROOT / 'css/join-options.css').read_text(errors='ignore')
    for forbidden_selector in (
        '.join-option-page .header',
        '.join-option-page .site-nav-header',
        '.join-option-page .hamburger',
    ):
        if css_declarations(join_css, forbidden_selector):
            errors.append(
                f'css/join-options.css: route-specific shared chrome override '
                f'({forbidden_selector})'
            )
    for script_path in (
        ROOT / 'js/join-options.js',
        ROOT / 'js/join-application-preview.js',
        ROOT / 'resources2/script.js',
    ):
        if not script_path.exists():
            continue
        script = script_path.read_text(errors='ignore')
        if any(snippet in script for snippet in LEGACY_NAV_BINDING_SNIPPETS):
            errors.append(f'{script_path.relative_to(ROOT)}: legacy mobile-navigation binding')
    for path in sorted(ROOT.rglob('*.html')):
        if not is_public_html(path):
            continue
        rel = path.relative_to(ROOT).as_posix()
        text = path.read_text(errors='ignore')
        has_standard_header = bool(re.search(
            r'<header\b[^>]*class=["\'][^"\']*\bheader\b[^"\']*["\']',
            text,
            re.IGNORECASE,
        ))
        uses_shared_nav = 'id="nav-placeholder"' in text or "id='nav-placeholder'" in text
        if has_standard_header or uses_shared_nav:
            if has_standard_header:
                errors.append(f'{rel}: duplicates shared header markup instead of using the build partial')
            if not uses_shared_nav:
                errors.append(f'{rel}: missing #nav-placeholder')
            if SHARED_NAV_SCRIPT not in text:
                errors.append(f'{rel}: missing {SHARED_NAV_SCRIPT}')
            for style in re.findall(r'<style\b[^>]*>(.*?)</style>', text, re.IGNORECASE | re.DOTALL):
                for selector in shared_chrome_selectors(style):
                    errors.append(f'{rel}: inline shared chrome override ({selector})')
            for script in re.findall(r'<script(?![^>]+src=)[^>]*>(.*?)</script>', text, re.IGNORECASE | re.DOTALL):
                if any(snippet in script for snippet in LEGACY_NAV_BINDING_SNIPPETS):
                    errors.append(f'{rel}: legacy inline mobile-navigation binding')
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
