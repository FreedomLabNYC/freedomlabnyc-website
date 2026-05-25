#!/usr/bin/env python3
"""Audit Freedom Lab static pages for shared-style drift.

Flags public HTML pages that redefine shared title/banner styling inline.
This is intentionally lightweight: it does not require a build step.
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
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
]


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
    if errors:
        print('Shared style audit failed:')
        for error in errors:
            print(f'  - {error}')
        return 1
    print('Shared style audit passed')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
