# Visual QA brief: Korean preview versus English original

You are checking how the Korean review tool paints Korean text over English screenshots. Each image in your batch
is a pair: LEFT = the English rebuilt by the live tool, RIGHT = the Korean preview produced by the same live tool. Both use the same pre-cleaned plate, so a visible difference must come from text reconstruction rather than two different background images. The two
phones are the same size and aligned, so any Korean element should sit exactly where its English counterpart sits.

Open every image in your batch list with the Read tool. Look at every piece of text on the right phone and compare
it with the same element on the left. Zoom mentally into buttons, tabs, row labels, values, captions and links.

## What counts as a defect (report these)

- `offset-x`: the Korean text starts, ends or centres visibly somewhere else than the English (for example a
  centred button label rendered left-aligned, a right-aligned value rendered left, a label shifted into the icon).
- `offset-y`: the Korean sits visibly higher or lower than the English line (touching a divider, drifting into the
  row above or below, floating above a button's centre).
- `colour`: the Korean text colour differs from the English text colour on that element (white where English is
  grey, black where English is white, green link rendered white, and so on).
- `size`: the Korean glyphs are clearly larger or smaller than the English text on the same element.
- `weight`: bold where English is regular, or regular where English is bold, when it is clearly visible.
- `overflow`: the Korean runs past the edge of its button, card, pill or column.
- `clipped`: Korean cut off mid-glyph by the screen edge or a container edge.
- `overlap`: Korean collides with an icon, a value, another line or another element.
- `ghost-english`: English letters still visible behind or beside the Korean (incomplete paint-out).
- `duplicate`: the same Korean string drawn twice, or a string containing both title and body text in one box.
- `painted-wrong-area`: a patch of background painted over something that was not text (an icon, a flag, a
  divider, part of an illustration), or an obviously flat rectangle of wrong colour around the text.
- `untranslated`: English copy that should have been Korean on the right phone. Do NOT report brand names
  (Fasset, Fasset Card, Fasset Tag, Google, Facebook, WhatsApp, Visa), asset names or tickers (BTC, USDT, Bitcoin),
  currency codes, amounts, dates, times, phone numbers, emails, names, "Earn" or "Fasset Pay" product names.
- `wrong-string`: Korean that is clearly the translation of a different English element than the one it replaced.
- `missing`: the English text was painted out and nothing (or an empty box) is drawn in its place.

Do NOT report: translation wording, the orange or red underline under some Korean (a deliberate fit marker),
status bar, keyboard keys, system dialogs, tiny differences under about 3 pixels, background gradients, and the
English lists of countries/currencies/languages (they are data, not copy).

## Severity

- `high`: a reviewer would misread the screen or the defect makes the Korean unreadable or plainly wrong
  (overlap, clipped, ghost-english, colour that hides the text, wrong-string, missing, duplicate).
- `medium`: clearly wrong but readable (offset of a whole line, wrong colour that still reads, overflow past a
  button edge, size clearly off, untranslated copy).
- `low`: cosmetic (slight offset, slightly heavier weight, a hairline overlap with a divider).

## Output

Write ONE JSON file at the output path you were given, with this exact shape:

{
  "batch": "batch-NN",
  "screens_reviewed": ["<screen id>", ...],
  "clean_screens": ["<screen id>", ...],
  "findings": [
    {
      "screen": "<screen id, the file name without .jpg>",
      "english": "<the English text of the element, as on the left phone>",
      "korean": "<the Korean text as it appears on the right phone, or '' if missing>",
      "type": "<one of the defect words above>",
      "severity": "high|medium|low",
      "where": "<short location: 'primary button', 'row 3 label', 'tab bar', 'card title'>",
      "detail": "<one sentence: what is wrong, compared with the English>",
      "fix": "<one sentence: what should change: move left to align with icon, use grey #9aa, shorten copy, protect box, etc.>"
    }
  ]
}

Screen id is the pair image's file name without `.jpg` (for Figma frames it looks like `49-85561`). Review every
image in the batch; list each id once in either `clean_screens` or with findings. Be exhaustive rather than
polite: a screen with six problems gets six findings. After writing the file, reply with only the counts: screens
reviewed, clean screens, findings by severity.
