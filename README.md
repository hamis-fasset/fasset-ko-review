# Korean copy review tool

**Public site:** https://hamis-fasset.github.io/fasset-ko-review/

The translator sees each photographed app state in English and Korean side by side. Editing a Korean string updates the phone preview immediately. “Looks good” is the approval action; editing a previously approved string clears that approval. Work is stored in the browser and can be moved between computers with the visible **Open review file** / **Save my edits to a file** controls.

## Coverage

- 39 photographed app states, traceable to 22 identifiable source-screen components, have live English/Korean visual previews.
- 395 non-container route/component records were found in the CashApp `development` branch at commit `1d8e0c2e378216573367dce234217e92a3b9da44` (393 route names and 391 distinct component files).
- 373 of those source records do not yet have a visual capture.
- Every source screen is listed in the tool. A source screen without a capture is explicitly marked **no picture** and shows its statically resolvable copy as text.
- Copy that cannot be tied to one route is retained in **Unmapped copy**. Nothing is silently treated as visually covered.
- `COVERAGE.md` is the full route audit. `STILL-HARDCODED.md` lists text visible in captures that engineering must move into translation keys.

The screen inventory is generated with:

```sh
node build/generate-code-screens.js /path/to/CashApp
```

This writes `data/code-screens.json`. The scan found 60 dynamic translation calls and 34 static keys that are referenced by code but absent from the supplied copy pack; the tool flags those screen-by-screen for engineering follow-up.

## Visual preview implementation

`build/ocr.swift` locates English text in each capture. `build/match.py` maps OCR lines to copy keys and writes `data/ocr.json`. The browser covers matched English boxes and draws the current Korean text in the same position. Orange/red underlines flag likely overflow. It is a layout-faithful preview, not a substitute for a real Korean build capture.

The checked-in `img/`, `img-ko/`, and `img-figma/` directories make this folder a complete copy of the review site rather than a data-only shell.

## Review output

The exported JSON includes:

- `edits`: localization-key changes, original Korean, reviewed Korean, approval state, and duplicate keys;
- `hardcoded`: reviewed text that still needs engineering keys;
- `new_design`: copy reviewed against the supplied Figma screens;
- `approved_unchanged` and `screens_done`.

Invalid JSON or a JSON file with the wrong review shape is rejected before browser state is replaced.

The earlier Claude artifact is obsolete; only the GitHub Pages URL above should be shared.
