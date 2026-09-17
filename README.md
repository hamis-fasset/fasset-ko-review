# Korean copy review tool

**Public site:** https://hamis-fasset.github.io/fasset-ko-review/

The reviewer sees one app in the order a customer meets it: sign up, log in, your details, identity check and home from the redesign (Figma "CC-onboarding-rough"), then every other screen from the current app (real Android captures), then the new Send money and Gift a card flows. There is no version switch. The current app's own login, sign-up, forgot-password and home captures are not shown because the redesign replaces them; their keys stay in the bundle and are reviewable under Unmapped copy.

The reviewer sees each screen in English and Korean side by side. Editing a Korean string updates the phone preview immediately. “Looks good” is the approval action; editing a previously approved string clears that approval. Work is stored in the browser and can be moved between computers with the visible **Open review file** / **Save my edits to a file** controls.

## Coverage

- 246 screens have a live English/Korean visual preview: 75 current-app captures (89 captured, 14 superseded by the redesign and hidden) and 171 new-design frames.
- 395 non-container route/component records were found in the CashApp `development` branch at commit `1d8e0c2e378216573367dce234217e92a3b9da44` (393 route names and 391 distinct component files).
- 373 of those source records do not yet have a visual capture.
- Every source screen is listed in the tool. A source screen without a capture is explicitly marked **no picture** and shows its statically resolvable copy as text.
- Copy that cannot be tied to one route is retained in **Unmapped copy**. Nothing is silently treated as visually covered.
- 195 brand or runtime-fragment rows deliberately kept in English are excluded from direct review. The 34 code-referenced keys absent from the supplied copy are visible as engineering gaps but cannot be edited until source copy exists.
- `COVERAGE.md` is the full route audit. `STILL-HARDCODED.md` lists capture text that OCR could not confidently match to a supplied key; it is an investigation list, not proof that the strings are hardcoded.

After a route audit has produced `data/screen-inventory.json`, enrich it from a CashApp checkout on the audited `development` commit with:

```sh
node build/generate-code-screens.js /path/to/CashApp
```

This writes `data/code-screens.json`; it does not derive the route inventory itself. Across all route and container rows, the scan found 60 dynamic translation calls and 34 static keys that are referenced by code but absent from the supplied copy pack; the tool flags those screen-by-screen for engineering follow-up.

## Visual preview implementation

`build/ocr.swift` locates English text in each capture, `build/refine-ocr.swift` recovers exact word-level bounds, and `build/match.py` maps those lines to copy keys in `data/ocr.json`. The browser reconstructs only the original letter pixels from each bounded region, then draws the current Korean in place. Icons, badges, amounts, account data, gradients, rounded fills, and other runtime UI remain untouched. Likely fit problems are reported in the editor panel rather than drawn over the phone. This is a layout-faithful preview, not a substitute for a real Korean build capture.

The checked-in `img/`, `img-ko/`, and `img-figma/` directories make this folder a complete copy of the review site rather than a data-only shell.

Per-box layout facts are precomputed into `data/ocr.json` (current app) and `data/figma/boxes.json` (new design): `align`, `fs` (font size from the English glyph height), `weight`, `fg` (an explicit ink colour where sampling is unreliable), `paint` (the exact ink region to reconstruct, so icons next to a label survive) and `visualSafe:false` for text that must not be painted. `build/infer_align.py` derives the current-app values from the captures.

The tool has a deep link and an export mode: `?screen=<id>` opens one screen; `&export=ko` shows only the Korean phone at a fixed size and sets `body[data-ready="1"]` once fonts and the canvas are drawn. `build/export-ko.js` (playwright-core + local Chrome) uses that to render every screen exactly as the reviewer sees it:

```sh
python3 -m http.server 8791 --bind 127.0.0.1 -d .   # serve this folder
node build/export-ko.js http://127.0.0.1:8791/index.html ../qa/ko          # all screens, or pass ids
python3 build/pairs.py                                                      # English | Korean pair images for QA
```

Visual QA runs on those renders against `build/QA-BRIEF.md`. The older `build/export-preview-images.js` is superseded.

## Review output

The exported JSON includes:

- `edits`: localization-key changes, original Korean, reviewed Korean, approval state, and duplicate keys;
- `hardcoded`: legacy export field for capture-unmatched text; engineering must first reconcile it with existing keys, server content, literals, and fragments;
- `new_design`: copy reviewed against the supplied Figma screens;
- `approved_unchanged` and `screens_done`.

Invalid JSON or a JSON file with the wrong review shape is rejected before browser state is replaced.

The earlier Claude artifact is obsolete; only the GitHub Pages URL above should be shared.
