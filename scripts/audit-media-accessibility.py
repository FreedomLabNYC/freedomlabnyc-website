#!/usr/bin/env python3
"""Audit public Freedom Lab pages for image/video accessibility and AI-search media hygiene."""
from __future__ import annotations
import re, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
EXCLUDE={'.git','.hermes','internal','sketches','templates','peddler','links','print-page'}
EXCLUDE_FILES={'print-page.html'}
errors=[]
for p in ROOT.rglob('*.html'):
    rel=p.relative_to(ROOT)
    if p.name in EXCLUDE_FILES: continue
    if any(part in EXCLUDE for part in rel.parts): continue
    html=p.read_text(errors='ignore')
    for m in re.finditer(r'<img\b[^>]*>', html, re.I|re.S):
        tag=' '.join(m.group(0).split())
        decorative = 'aria-hidden="true"' in tag.lower() or "aria-hidden='true'" in tag.lower()
        if not decorative and not re.search(r'\balt\s*=\s*["\'][^"\']+["\']', tag, re.I):
            errors.append(f'{rel}: image missing useful alt: {tag[:180]}')
        if 'loading=' not in tag.lower() and not any(x in tag.lower() for x in ['logo','wordmark','fetchpriority="high"','class="past-events-icon-img"']):
            errors.append(f'{rel}: non-logo image missing loading="lazy": {tag[:180]}')
    for m in re.finditer(r'<video\b[^>]*>(.*?)</video>', html, re.I|re.S):
        block=m.group(0)
        if '<track' not in block.lower():
            errors.append(f'{rel}: video missing <track> captions/transcript fallback')
        if not re.search(r'aria-label\s*=|title\s*=', block, re.I):
            errors.append(f'{rel}: video missing aria-label/title')
if errors:
    print('Media accessibility audit failed:')
    print('\n'.join('- '+e for e in errors[:200]))
    sys.exit(1)
print('Media accessibility audit passed')
