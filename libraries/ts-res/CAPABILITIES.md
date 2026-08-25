# `@fgv/ts-res` — multidimensional resources

> **This file is authoritative for what ``@fgv/ts-res`` provides and what not to hand-roll.**
> `README.md`, where present, is getting-started material. The always-loaded index at
> [`.ai/instructions/LIBRARY_CAPABILITIES.md`](../../.ai/instructions/LIBRARY_CAPABILITIES.md)
> routes here; it never duplicates this content.


---

[libraries/ts-res](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-res)

A full conditional-resource runtime: qualifier types, qualifiers, conditions, decisions, candidates, resources, bundles, zip archive packaging. Use when you need context-aware resource resolution (i18n, theming, A/B variants, environment overrides). Key packlets: [`runtime`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-res/src/packlets/runtime), [`bundle`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-res/src/packlets/bundle), [`config`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-res/src/packlets/config), [`import`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-res/src/packlets/import), [`resource-json`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-res/src/packlets/resource-json). See the project's own [CLAUDE.md](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-res/CLAUDE.md) for architecture details.

---

## Decision shortcuts

- **Context-conditional resources?** → `@fgv/ts-res`.

---

## Recent additions

*Newest first. Populated from each stream's `summary.sourceLine` — see the split brief's phase 2.*
