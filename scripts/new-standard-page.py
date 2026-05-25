#!/usr/bin/env python3
"""Create a standard Freedom Lab page from a reusable static template.

This is for ordinary site pages only. Do not use it for resource lesson pages;
those have their own lesson/card structure under /resources/.
"""
from __future__ import annotations

import argparse
import html
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / 'templates' / 'standard-page.html'


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r'[^a-z0-9]+', '-', value)
    return value.strip('-')


def current_css_version() -> str:
    try:
        return subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD'], cwd=ROOT, text=True).strip()
    except Exception:
        return 'dev'


def main() -> int:
    parser = argparse.ArgumentParser(description='Create a standard Freedom Lab static page.')
    parser.add_argument('slug', help='Route slug, e.g. about or press-kit. Resource lesson pages are intentionally blocked.')
    parser.add_argument('--title', required=True, help='Page title / H1')
    parser.add_argument('--description', required=True, help='Meta and preview description')
    parser.add_argument('--helper', default='', help='Optional helper text shown under the hero title')
    parser.add_argument('--body', default='<h2>Draft section</h2>\n                <p>Replace this draft copy.</p>', help='Initial HTML body inside the standard content card')
    parser.add_argument('--force', action='store_true', help='Overwrite an existing page')
    args = parser.parse_args()

    slug = slugify(args.slug)
    if not slug:
        raise SystemExit('Slug cannot be empty')
    if slug == 'resources' or slug.startswith('resources/'):
        raise SystemExit('This generator intentionally does not create resource lesson pages. Use the resources workflow instead.')

    out_dir = ROOT / slug
    out = out_dir / 'index.html'
    if out.exists() and not args.force:
        raise SystemExit(f'{out.relative_to(ROOT)} already exists. Pass --force to overwrite.')

    helper_paragraph = ''
    if args.helper.strip():
        helper_paragraph = f'<p>{html.escape(args.helper.strip())}</p>'

    content = TEMPLATE.read_text(encoding='utf-8')
    replacements = {
        '{{slug}}': slug,
        '{{title}}': html.escape(args.title.strip()),
        '{{description}}': html.escape(args.description.strip()),
        '{{helper_paragraph}}': helper_paragraph,
        '{{body_html}}': args.body.strip(),
        '{{css_version}}': current_css_version(),
    }
    for key, value in replacements.items():
        content = content.replace(key, value)

    out_dir.mkdir(parents=True, exist_ok=True)
    out.write_text(content + ('\n' if not content.endswith('\n') else ''), encoding='utf-8')
    print(f'Created {out.relative_to(ROOT)}')
    print('Next: edit body copy, run scripts/apply-seo.py, then scripts/audit-shared-styles.py')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
