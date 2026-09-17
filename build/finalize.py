#!/usr/bin/env python3
"""Forward to the canonical finalizer in the full localization workspace."""
import os
from pathlib import Path
import runpy

root = Path(os.environ.get("FASSET_KO_WORK_ROOT", Path.home() / "Downloads/fasset-ko-work"))
target = root / "ocr/finalize.py"
if not target.exists():
    raise SystemExit(
        f"Canonical finalizer not found: {target}\n"
        "Set FASSET_KO_WORK_ROOT to the localization workspace."
    )
runpy.run_path(str(target), run_name="__main__")
