# Fasset Korean copy review

Static review tool for the Korean copy of the Fasset app. English captures on the left, the same screen rendered in Korean on the right, edit panel to fix the Korean and mark screens done. Edits stay in the reviewer's browser and are exported as a JSON file.

- `index.html` the tool
- `data/screens.json` screens and plain-language names
- `data/copy.json` every translation key with English, Korean, component, duplicates and translator notes
- `data/ocr.json` where each English string sits on each capture (Apple Vision OCR, matched to keys)
- `img/` the captures (Android, light theme, 1080×2400)
