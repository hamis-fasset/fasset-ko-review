# hardcoded.ko.json — translator notes (16 Sep 2026)

All 44 ids translated. KYC screens (kyc_*) and the trade-confirmation risk copy use 합니다체; everything else 해요체.

## Unsure / alternatives
- hc.017 "Awaiting a…" (truncated, logged-out screen). Read as "Awaiting activation" → `활성화 대기 중`. If it is "Awaiting approval", use `승인 대기 중`.
- hc.019 / hc.022 / hc.026 / hc.039 / hc.041 / hc.042 / hc.045 — KYC input hints written as `~하십시오` to stay in 합니다체. If the KYC screens end up in 해요체, swap to `~해 주세요` (e.g. `출생 국가를 입력해 주세요`).
- hc.027 / hc.037 "bank statement" → `은행 거래내역서` (glossary has 명세서 only for the card statement; Korean banks call it 거래내역서). Alternative `은행 명세서`.
- hc.029 "Tenancy contract or rent agreement" — both terms are `임대차 계약서` in Korean, so the "or" is collapsed. Alternative if two items are wanted: `임대차 계약서 또는 임대 계약서`.
- hc.030–033 document checklist bullets written as noun phrases ending in `서류` (`영어로 작성된 서류`). If the bullets sit under a heading like "The document must:", use the shorter forms `영어로 작성`, `성명과 주소 전체 표시`, `잘림이나 흐림 없이 선명`, `3개월 이내 발급`.
- hc.035 "Long-term investment" and hc.043 "Long term investing" both → `장기 투자` (casing/wording variants collapse to one Korean).
- hc.042 "Input name of your employer" → `고용주명을 입력하십시오`. Alternative, friendlier: `근무 중인 회사명을 입력하십시오`.
- hc.044 "Your order has been completed. Successfully" → `주문이 완료됐어요.` (no 성공, per glossary).
- hc.002 / hc.003 OCR noise ("G") dropped; buttons rendered as complete Korean (`Google로 로그인`, `Facebook으로 로그인`).
- hc.021 / hc.046 example address kept in Latin script; `E.g.,` → `예:`.
- hc.010 "debit card" → `체크카드` (Korean market term).
