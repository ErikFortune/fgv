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

*Newest first. **Generated** — see the repo index; do not hand-edit inside the markers.*

<!-- BEGIN GENERATED: recent-additions -->

- **2026-09-26** — A converter handed an Object.create(null) value now returns a Result instead of throwing — isKeyOf, strictObject and six ts-json / ts-res-ui-components property probes stopped calling hasOwnProperty on the object itself. ([#700](https://github.com/ErikFortune/fgv/pull/700))

<!-- END GENERATED: recent-additions -->
