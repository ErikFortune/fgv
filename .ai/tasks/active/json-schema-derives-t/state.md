# Stream state: `json-schema-derives-t`

**Status:** 🟢 implementation complete — PR open onto `json-schema-derives-t` (integration branch)
**Workflow shape:** alignment stream (single-PR new packlet)
**Design spec:** [`../json-schema-converter-alignment/derives-t-feasibility.md`](../json-schema-converter-alignment/derives-t-feasibility.md) (phase-2 feasibility verdict — Parts A/B/C)
**Last updated:** 2026-06-03 (implementing agent — implementation complete)

---

## Mission

Ship the schema-derives-T capability as a new packlet in `@fgv/ts-json-base`: 7 factories + `optional` modifier + `Static<S>` + `toConverter` + `toJson` + `fromJson` + supporting types, for the LLM-tool JSON Schema subset. Strictly additive; no existing surface change anywhere in the monorepo.

---

## Substrate note

The `json-schema-derives-t` substrate (brief.md/state.md) expected from substrate-prep PR #440 was **not present on the `json-schema-derives-t` integration branch** at implementation start (only the `json-schema-converter-alignment` spike substrate — including the design-spec feasibility doc — was present). The implementing agent created this `state.md` to satisfy the substrate-finalization contract. The design spec (`derives-t-feasibility.md`) and the implementation contract (kickoff brief) were complete, so this gap did not block implementation. Surfaced to the user in the session summary. The orchestrator moves this substrate (alongside the spike substrate) to `.ai/tasks/completed/` post-squash.

---

## Decisions log

| Decision | Resolution | Rationale |
|---|---|---|
| **(In-flight #1) Packlet name** | `json-schema-builder`, exported as the `JsonSchema` namespace from `@fgv/ts-json-base` | Recommended default. Directory name describes the capability (typed schema *building*); the consumer-facing namespace `JsonSchema` matches the name used in the spike's drift-test sketch (`research.md` §3.3) and the feasibility doc. |
| **(In-flight #2) Strict numeric mode** | Default **strict** (reject numeric strings) on `number()` / `integer()`; opt out via `{ strict: false }` | LLM tools emit JSON numbers as numbers, so strict is the right default and avoids the `Converters.number` numeric-string coercion (`'42'`→`42`) that `research.md` §1.5 flagged as surprising. Strict is composed from existing `Converters.isA(...)`; non-strict reuses `Converters.number` (+ an integer `withConstraint`). `fromJson` produces strict numeric converters (no wire keyword to express the opt-out). |
| **(In-flight #3) `additionalProperties` default** | Default **`false`** (reject unknown fields → `Converters.strictObject`); opt in via `{ additionalProperties: true }` (→ `Converters.object`) | LLM-tool convention. `toJson` emits `additionalProperties: false` only when false (true is the JSON Schema default and is omitted). `fromJson` honors JSON Schema semantics: an absent `additionalProperties` is lenient (true); only an explicit `false` produces a strict object. Authored-default → `false` → round-trips. |
| **(In-flight #4) Error message strategy** | Reuse the existing `Converters.object` / `Converters.strictObject` field-name-aware reporting; no parallel error system | The object converter already prefixes each field failure with the property name. The adapter adds per-property context (`${key}: ${msg}`) for schema-translation failures and otherwise lets the underlying converters report at convert-time. No new error machinery. |
| **(In-flight #5) `fromJson` out-of-subset cutoff** | **Fail** on compositional/assertive keywords (`$ref`, `oneOf`, `anyOf`, `allOf`, `not`, `if`, `then`, `else`, `pattern`), union `type` arrays, non-string / empty `enum`, tuple-form `items`, schema-valued `additionalProperties`, and missing/unknown `type`. **Pass through (ignore)** pure annotations with no validation semantics — draft-07 `format`, `title`, `default`, `examples`, and a spurious `description` on any node. | Structural/assertive keywords cannot be honored faithfully; silently dropping them would produce a looser converter than the schema describes — the exact "illusion of safety" the alignment stream exists to avoid. Draft-07 `format` is officially an annotation (validators MAY ignore), so ignoring it is spec-compliant pass-through, not false-safety. `pattern` is always assertive → fail. Failures carry a JSON-pointer-style path (`#/properties/foo: ...`). |
| Phantom carrier: optional `__staticType?: T` field, not a module-private `unique symbol` | Implementation detail (not one of the 5 calls) | This is a **published** package surface. A module-private `unique symbol` keying the phantom property cannot be named in the emitted `.d.ts` (TypeBox issue #679, flagged as the fallback in the feasibility appendix), which would break declaration emission / API Extractor for downstream consumers. An optional, never-assigned property carries `T` for `Static` extraction with no runtime field and clean `.d.ts` emission. The `_type` discriminant remains the structural gate. |

---

## History

| Date | Event | Notes |
|---|---|---|
| 2026-06-02 | Phase-2 feasibility verdict: **feasible** | `derives-t-feasibility.md` delivered (design spec). Phantom-tag mechanism tractable; `Converter<T>` needs no retrofit; ~505 lines impl + ~620 lines tests, single new `ts-json-base` packlet. |
| 2026-06-03 | Implementation complete | New `json-schema-builder` packlet (`JsonSchema` namespace) in `@fgv/ts-json-base`: `types.ts` (phantom types, `Static`, `ObjectStatic`), `factories.ts` (7 factories + `optional`), `toConverter.ts` (adapter composing existing `Converters.*`), `toJson.ts` (wire emission), `fromJson.ts` (opaque parse). 5 in-flight calls resolved (above). 65 tests, **100% coverage** on the new packlet; `rushx build` + `rushx lint` green; api-extractor report regenerated; `minor` rush change file added; `LIBRARY_CAPABILITIES.md` updated. One pre-existing unrelated test failure (`mutableFsTree` read-only-permission check) fails only because the container runs as `root` (root bypasses `0o444`) — not introduced by this stream. PR opened onto `json-schema-derives-t`. |

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Implementation | `feat(ts-json-base): typed JSON Schema with derived static types (schema-derives-T)` → `json-schema-derives-t` | open |
| Cluster-close | TBD | orchestrator opens after this PR merges to the integration branch |
