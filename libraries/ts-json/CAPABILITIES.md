# `@fgv/ts-json` — templating, conditionals, diff, edit

> **This file is authoritative for what ``@fgv/ts-json`` provides and what not to hand-roll.**
> `README.md`, where present, is getting-started material. The always-loaded index at
> [`.ai/instructions/LIBRARY_CAPABILITIES.md`](../../.ai/instructions/LIBRARY_CAPABILITIES.md)
> routes here; it never duplicates this content.


---

[libraries/ts-json](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-json)

| Packlet | Use for |
|---|---|
| [`editor`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-json/src/packlets/editor) | `JsonEditor` — deep merge JSON objects in-place, clone, with rule plugins. |
| [`converters`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-json/src/packlets/converters) | `JsonConverter` with mustache templating + conditional property syntax (`?key`, `?[match]`, `?default`) and multi-value expansion. |
| [`context`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-json/src/packlets/context) | `JsonContext`, `CompositeJsonMap` — context objects fed into the templating converter. |
| [`diff`](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-json/src/packlets/diff) | `detailedDiff`, `threeWayDiff` — structural JSON diffs. |

---

---

## Decision shortcuts

- **JSON templating or conditional inclusion?** → `JsonConverter` from `@fgv/ts-json/converters`.
- **Deep-merging JSON?** → `JsonEditor.mergeObjectInPlace` from `@fgv/ts-json/editor`.
- **Diffing JSON?** → `@fgv/ts-json/diff`.

---

## Recent additions

*Newest first. Populated from each stream's `summary.sourceLine` — see the split brief's phase 2.*
