# Korean copy review tool

**Public site:** https://hamis-fasset.github.io/fasset-ko-review/

The reviewer sees one app in the order a customer meets it: sign up, log in, your details, identity check and home from the redesign (Figma "CC-onboarding-rough"), then every other screen from the current app (real Android captures), then the new Send money and Gift a card flows. There is no version switch. The current app's own login, sign-up, forgot-password and home captures are not shown because the redesign replaces them; their keys stay in the bundle and are reviewable under Unmapped copy.

The reviewer sees each screen in English and Korean side by side. Editing a Korean string updates the phone preview immediately. “Looks good” is the approval action; editing a previously approved string clears that approval. Work is stored in the browser and can be moved between computers with the visible **Open review file** / **Save my edits to a file** controls.

## Coverage

- 246 visual/design states are reviewable: **245 have a live English/Korean preview** (75 current-app captures and 170 new-design frames), and one Pakistan design state is text-only because its supplied bitmap duplicates Kenya. The raw app set contains 89 captures; 14 onboarding captures are superseded by the redesign and hidden.
- 395 non-container route/component records were found in the CashApp `development` branch at commit `1d8e0c2e378216573367dce234217e92a3b9da44` (393 route names and 391 distinct component files).
- 375 of those source records do not yet have a verified mapping to an active visual capture.
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

**Plates (since 17 Sep evening).** English glyphs are erased at build time, not in the browser. The canonical generator is
`../ocr/plates_v2.py` in the full localization workspace. It maps each localized source string to Apple Vision's exact word
boxes and inpaints only those word rectangles. Adjacent icons, logos, badges, amounts, gradients, rounded pills and card edges
are outside the approved mask. It writes one clean image per source state to `plates-v2/`. Both phones use that same plate and
rebuild English or Korean as positioned HTML text, so the only visual difference is language. The next and previous plates are
prefetched; there is no per-screen canvas work in normal operation.

```sh
cd ~/Downloads/fasset-ko-work
venv/bin/python ocr/plates_v2.py            # all 260 source states; or --only <id> ...
```


`build/ocr.swift` locates English text in each capture, `build/refine-ocr.swift` recovers exact word-level bounds, and `build/match.py` maps those lines to copy keys in `data/ocr.json`. Likely fit problems are reported in the editor panel. This is a layout-faithful preview, not a substitute for a real Korean build capture.

The checked-in `img/`, `img-figma/`, and `plates-v2/` directories make this folder a complete deployable review site rather than a data-only shell. `img-ko/` and `img-figma-ko/` are historical QA outputs and are not used by the page.

Per-box layout facts are precomputed into `data/ocr.json` (current app) and `data/figma/boxes.json` (new design): `align`, `fs` (font size from the English glyph height), `weight`, `fg` (an explicit ink colour where sampling is unreliable), `paint` (the exact ink region to reconstruct, so icons next to a label survive) and `visualSafe:false` for text that must not be painted. `build/infer_align.py` derives the current-app values from the captures.

The tool has a deep link and an export mode: `?screen=<id>` opens one screen; `&export=ko` shows only the Korean phone at a fixed size and sets `body[data-ready="1"]` once fonts and the canvas are drawn. `build/export-ko.js` (playwright-core + local Chrome) uses that to render every screen exactly as the reviewer sees it:

```sh
npm ci
python3 -m http.server 8791 --bind 127.0.0.1 -d .   # serve this folder
SIDE=ko node build/export-ko.js http://127.0.0.1:8791/index.html ../qa/ko
SIDE=en node build/export-ko.js http://127.0.0.1:8791/index.html ../qa/en
cd .. && venv/bin/python qa/pairs.py --en-dir qa/en --ko-dir qa/ko --out-dir qa/pairs
```

`export-ko.js` defaults to macOS Google Chrome; set `CHROME_PATH` to another Chrome/Chromium binary. The standalone Pages clone can export browser renders after `npm ci`, but finalization also needs the full workspace (`FASSET_KO_WORK_ROOT`) and developer pack (`DEVPACK`). Python plate generation requires the workspace venv with Pillow, NumPy and OpenCV.

Visual QA runs on those renders against `build/QA-BRIEF.md`. The older `build/export-preview-images.js` is superseded.

## Review output

The exported JSON includes:

- `edits`: localization-key changes, original Korean, reviewed Korean, approval state, and duplicate keys;
- `hardcoded`: legacy export field for capture-unmatched text; engineering must first reconcile it with existing keys, server content, literals, and fragments;
- `new_design`: copy reviewed against the supplied Figma screens;
- `approved_unchanged` and `screens_done`.

Invalid JSON or a JSON file with the wrong review shape is rejected before browser state is replaced.

## Release checklist

1. Run `venv/bin/python ocr/plates_v2.py`; it must report 260 plates and zero fallbacks.
2. Export both languages with no explicit IDs; each manifest must contain 245 screens. Build and visually QA those exact pairs.
3. Commit the complete runtime set: HTML, JSON/box data, build scripts, pinned Node dependencies and `plates-v2/`. Do not commit the obsolete `plates/` directory.
4. Push `main`, wait for GitHub Pages, verify the deployed commit and smoke-test loading, editing, approval persistence, export/import and representative deep links.

The earlier Claude artifact is obsolete; only the GitHub Pages URL above should be shared.
