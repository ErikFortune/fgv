# `@fgv/ts-bcp47` — BCP-47 language tags

> **This file is authoritative for what ``@fgv/ts-bcp47`` provides and what not to hand-roll.**
> `README.md`, where present, is getting-started material. The always-loaded index at
> [`.ai/instructions/LIBRARY_CAPABILITIES.md`](../../.ai/instructions/LIBRARY_CAPABILITIES.md)
> routes here; it never duplicates this content.


---

[libraries/ts-bcp47](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-bcp47)

`Bcp47.tag(...)`, `Bcp47.similarity(...)`, normalization to canonical/preferred form, IANA registry access (`iana` packlet), UN M.49 region data (`unsd` packlet). **Use this instead of regex-parsing language tags or hand-rolling locale fallback.** The language-distance/similarity scoring is designed to plug directly into `@fgv/ts-res` qualifier matching — prefer it over a custom locale-match function if you are working with ts-res.

---

---

## Decision shortcuts

- **Parsing / comparing language tags?** → `@fgv/ts-bcp47`.

---

## Recent additions

*Newest first. **Generated** — see the repo index; do not hand-edit inside the markers.*

<!-- BEGIN GENERATED: recent-additions -->

- **2026-10-30** — A converter or validator handed a cyclic, BigInt or Proxy value now fails instead of throwing, via a new formatValueForMessage that matches JSON.stringify for ordinary values. ([#764](https://github.com/ErikFortune/fgv/pull/764))

<!-- END GENERATED: recent-additions -->
