#!/usr/bin/env python3
"""Patch fmt 11's Apple Clang consteval incompatibility in generated iOS Pods."""
from pathlib import Path
import stat
import sys

OLD = "#elif defined(__apple_build_version__) && __apple_build_version__ < 14000029L"
NEW = "#elif defined(__apple_build_version__)  // BE DIFFERENT: fmt Apple Clang compatibility"


def patch_header(path):
    text = path.read_text()
    if NEW in text:
        return False
    if text.count(OLD) != 1:
        raise RuntimeError("Unexpected fmt consteval guard; review the installed fmt version before patching.")
    path.chmod(path.stat().st_mode | stat.S_IWUSR)
    path.write_text(text.replace(OLD, NEW))
    return True


if __name__ == "__main__":
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("Pods")
    header = root / "fmt/include/fmt/base.h"
    changed = patch_header(header)
    print("fmt Apple Clang compatibility: " + ("patched" if changed else "already applied"))
