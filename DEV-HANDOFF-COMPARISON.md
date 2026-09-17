# Developer handoff comparison

## What the two handoffs are

1. **Original English copy pack** (`english-copy-pack/batches/*.json`): 2,499 live localization keys and 2,155 distinct English values.
2. **Remaining-30% audit** (`LOCALIZATION_AUDIT.md`): a source-code audit, not a screenshot pack. It scanned 1,917 files and flagged 3,063 hardcoded user-facing occurrences:
   - 2,118 occurrences need their callsite moved to an existing localization key.
   - 945 were already localized or not actionable.
   - The audit itself reports zero strings still needing a brand-new JSON key because its extracted keys had already been cherry-picked into `translation.json`.

The associated second copy drop adds 1,329 keys to the original pack. Of those, 106 English strings already existed in the first source and 1,223 were absent from it. The merged app bundle therefore has 3,828 keys. The review dataset additionally contains 115 capture-only investigation strings and 616 redesign/Figma strings that do not yet have production i18n keys.

## What kind of copy is in the 1,329-key second drop

Component classification:

| Type | Keys |
|---|---:|
| Labels | 614 |
| Body/error/help text | 276 |
| Headings | 237 |
| Buttons/CTAs | 122 |
| Input placeholders | 80 |

Length profile:

| Length | Keys |
|---|---:|
| 1–2 words | 730 |
| 3–6 words | 444 |
| 7–15 words | 114 |
| 16+ words | 41 |

Product-area grouping (heuristic from key prefixes):

| Area | Keys |
|---|---:|
| Authentication and generic app constants | 719 |
| Account and money movement | 257 |
| Cards | 159 |
| Trading and markets | 73 |
| Rewards and vouchers | 48 |
| P2P | 23 |
| KYC, legal and compliance | 19 |
| Other | 31 |

The largest namespaces are `new.*` (692), `accountsV4.*` (178), `fassetPay.*` (78), `wallet.*` (75), and `fassetCard.*` (63). A material part of `new.*` is reusable country, timezone, transaction-purpose and generic UI constants rather than distinct screens. The drop also includes 92 placeholder-bearing strings and 57 deliberate English strings (brands or runtime fragments that cannot safely be reordered in Korean).

## Reviewer treatment

- Pictured states show English and live Korean side by side.
- Every editable canonical string not linked to visible text in a pictured state appears once in **Unmapped copy**.
- Each unmapped row shows English, editable Korean, approval, key, and whether it came from the **Original copy pack** or **Remaining 30% audit**.
- The 395-route engineering inventory remains in `COVERAGE.md`; uncaptured routes are not shown as hundreds of fake “No picture” reviewer screens.

