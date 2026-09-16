# Notes: hc.047–hc.110 (deposit_full, earn_full, rewards_*, signup_*)

## kept_english
- `hc.106` "email." — trailing fragment of a sentence whose main clause comes before it (likely "...sent to your email."); missing part is before, so kept in English per rule 4.
- `hc.110` "Reducing investment risk with USDC, a stablecoin linked to the US" — cut off mid noun phrase ("US" before "Dollar"/"Treasury" etc.); the missing continuation is essential to render the Korean noun correctly, so kept in English rather than guessing.

## data (pure OCR garbage or literal data, returned unchanged)
- `hc.057` "Al Khaliji (France) S.A." — bank name, proper noun.
- `hc.059` "Al Khaliji (France) S.A. **7349" — bank name + masked account number.
- `hc.063` "FASSET FZE Client Money Account" — fixed legal account-holder name shown in wire instructions.
- `hc.064` "Emaar Square Dubai" — address, proper noun.
- `hc.069` "Camina cann" — OCR garbage, no discernible English meaning.
- `hc.070` "Take e" — OCR garbage, likely a cut-off "Take a photo" or similar; too fragmentary to translate.
- `hc.098` "Damarala" — OCR garbage, no discernible meaning.

## needs_context
- `hc.050` "Pay By Bank" → kept as "Pay By Bank" — read as a named open-banking payment method (like Google Pay), not a generic instruction, so treated as a brand/product label rather than translated. Alternative: "은행으로 결제".
- `hc.056` "Maximum deposit: 3673 AED" → "최대 입금 금액: 3673 AED" — number lacks the thousands comma that the near-identical hc.061 has (likely OCR drop); left the digits exactly as captured rather than "correcting" the data.
- `hc.080` "I have read and agree to Fasset User /" → "Fasset 이용약관에 동의합니다 /" — OCR-truncated checkbox copy (likely "...User Agreement / Privacy Policy" with two linked terms). Translated the resolvable part in 합니다체 (compliance) and kept the trailing "/" separator since something follows it downstream.
- `hc.087` "Al & Data Dominator" → kept as "AI & Data Dominator" (assuming "Al" is OCR noise for "AI") — likely a rewards badge/task title; too proper-noun-like and ambiguous to safely translate, so left as the corrected English title. Alternative: "AI 데이터 마스터".
- `hc.100` "How to Own" → "OWN 받는 방법" — read as "how to earn/get the OWN token" given the surrounding rewards/task copy, not literally "how to own [something]". Alternative: "Own 사용 방법" if it's actually a how-to-use guide.
- `hc.101`/`hc.102` "...Enjoy the benefits of secure, verified" / "access to Fasset!" — one sentence split across two capture ids. Translated as a continuous pair: hc.101 ends on the adjective phrase "안전하게 인증된", hc.102 completes it as "Fasset 이용 혜택을 누려보세요." (exclamation mark dropped per style guide banned patterns).

## term_decisions
- `hc.051` "Google Pay" — kept as-is, brand name (not in glossary but same class as Banxa/Lean).
- `hc.068` "Bitcoins" — translated as "비트코인" (singular form; plural "-s" is OCR/English artifact on a coin-search list item, not a real plural in Korean).
- `hc.075` "est.APR" → "예상 APR" — kept "APR" untranslated like a ticker/finance abbreviation; translated only "est." (estimated) → "예상".
- `hc.076` "USDT Flex Saver", `hc.077` "USDT Stable Saver" — kept as English product names (not in glossary). Treated as named savings-plan products rather than generic phrases, consistent with how brand names are kept elsewhere.
- `hc.078`/`hc.081` "Available: 0 | MAX" — kept "MAX" untranslated (standard finance-app convention for a max-amount shortcut button); translated "Available" → "사용 가능". hc.081's source "O" (letter) corrected to "0" (zero) as obvious OCR noise.
- `hc.085` "60 in 60 Camapign" → "60 in 60 캠페인" — kept the campaign's numeric name in English, translated only "Campaign" (typo "Camapign" corrected) per glossary (campaign → 캠페인).
- `hc.089` — "SOWN" read as OCR noise for "$OWN"/"OWN" (the app's reward token per glossary); translated as "OWN". Rewrote to avoid the banned `~를 통해` ("access... and earn... 24/7" restructured without "통해").
- `hc.097` "Complete 3 crypto trades" → "디지털 자산 거래 3건 완료하기" — "crypto" mapped to "디지털 자산" per glossary rule (never 암호화폐/코인 as a category noun).
- `hc.107` "United States of America" → "미국" — standard Korean short form for country-picker lists (matches how Korean apps localize country names, not a literal transliteration).
- `hc.109` "- Åland Islands" → "- 올란드 제도" — kept the leading "-" list marker exactly as in source; translated the country name to its standard Korean form.

## length_flags
None — no button/tab/label/heading in this batch came out longer in Korean than the English source. Longest cases (`hc.049`, `hc.089`, `hc.101`) are body/description text, which the style guide does not length-cap.
