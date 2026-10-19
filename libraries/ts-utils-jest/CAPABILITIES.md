# `@fgv/ts-utils-jest` — Result-aware Jest matchers

> **This file is authoritative for what ``@fgv/ts-utils-jest`` provides and what not to hand-roll.**
> `README.md`, where present, is getting-started material. The always-loaded index at
> [`.ai/instructions/LIBRARY_CAPABILITIES.md`](../../.ai/instructions/LIBRARY_CAPABILITIES.md)
> routes here; it never duplicates this content.


---

[libraries/ts-utils-jest](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-utils-jest)

`toSucceed`, `toFail`, `toSucceedWith`, `toFailWith`, `toSucceedAndSatisfy`, `toFailWithDetail`, `toSucceedAndMatchSnapshot`, plus `toFailTest*` for testing custom matchers. **Always use these in tests instead of `.orThrow()` + assertions.** Includes ANSI color stripping for stable cross-env snapshots.

---

---

## Decision shortcuts

- **Jest matchers for `Result<T>`?** → `@fgv/ts-utils-jest`.

---

## Recent additions

*Newest first. **Generated** — see the repo index; do not hand-edit inside the markers.*

<!-- BEGIN GENERATED: recent-additions -->

- **2026-09-26** — A converter handed an Object.create(null) value now returns a Result instead of throwing — isKeyOf, strictObject and six ts-json / ts-res-ui-components property probes stopped calling hasOwnProperty on the object itself. ([#700](https://github.com/ErikFortune/fgv/pull/700))

<!-- END GENERATED: recent-additions -->
