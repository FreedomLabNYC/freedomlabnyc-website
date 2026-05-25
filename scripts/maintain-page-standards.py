#!/usr/bin/env python3
"""One-command metadata/standards maintenance for Freedom Lab pages.

Runs the metadata generator, then the shared-style/footer/preview audit.
Use after creating or editing public pages.
"""
from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run(cmd: list[str]) -> None:
    print('$', ' '.join(cmd))
    subprocess.run(cmd, cwd=ROOT, check=True)


def main() -> int:
    run(['python3', 'scripts/apply-seo.py'])
    run(['python3', 'scripts/audit-shared-styles.py'])
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
