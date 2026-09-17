# How the Fasset localization lab was built

Hamis designed and operated this as an AI-native product-delivery system, not a one-off translation exercise.

The lab combines:

- two developer copy handoffs and a source-code localization audit;
- 3,828 production localization keys plus capture-only and redesign copy;
- a Korean UX writing system, glossary, placeholder rules and product/legal register rules;
- parallel coding-agent research, translation, source coverage, UX and visual-QA work;
- Python assembly, validation and finalization scripts;
- Apple Vision OCR, OpenCV inpainting and browser-rendered Korean overlays;
- Maestro Android captures and Figma redesign states;
- a human review interface with English/Korean comparison, editing and approvals;
- Netlify Functions and Blob-backed autosave sessions;
- deterministic review JSON that feeds the i18next engineering bundle.

The core PM contribution was system design: deciding what evidence counted, decomposing work into bounded agent roles, encoding quality rules, resolving vocabulary and scope decisions, creating honest coverage boundaries, and turning the output into something a nontechnical Korean copywriter and mobile engineer could each use safely.

The public narrative is available at `/method.html`. Detailed implementation and operational instructions live in `README.md`, `COVERAGE.md`, `DEV-HANDOFF-COMPARISON.md`, and the wider localization workspace.

