# Stream state: `json-schema-derives-t`

**Status:** 🟢 implementation revised — schema IS the validator (no `toConverter`/`toJson.ts`); PR update pending
**Workflow shape:** alignment stream (single-PR new packlet)
**Design spec:** [`../json-schema-converter-alignment/derives-t-feasibility.md`](../json-schema-converter-alignment/derives-t-feasibility.md) (phase-2 feasibility verdict — Parts A/B/C)
**Last updated:** 2026-06-03 (implementing agent — major API revision complete)

---

## Mission

Ship the schema-derives-T capability as a new packlet in `@fgv/ts-json-base`: 7 factories + `optional` modifier + `Static<S>` + `fromJson` + supporting types, for the LLM-tool JSON Schema subset. Schema values ARE the validators (`ISchemaValidator<T>` extends `Validator<T>`). Strictly additive; no existing surface change anywhere in the monorepo.

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
| **(Revision) Schema IS the validator** | `ISchemaValidator<T>` extends `Validator<T>`; `toConverter.ts` and `toJson.ts` deleted | The v1 design had three entities (schema, converter, JSON emission) requiring callers to import and chain. The revised design collapses schema and validator: each factory returns an `ISchemaValidator<T>` instance with `validate(input)` and `toJson()` methods. This matches the "schema IS the validator" idiom used in other typed-schema libraries and is simpler for consumers. `fromJson` returns `ISchemaValidator<JsonObject>` (opaque). |
| **(Revision) `fromJson` enum dispatch** | `Converters.oneOf([_enumArm, _typeDiscriminatedArm])` — enum arm leads | Non-enum nodes have a `type` field so `discriminatedObject` covers them; enum nodes have no `type` (only `enum`). Leading the `oneOf` with the enum arm makes enum nodes dispatch correctly without requiring a `type` field. The pre-flight check ensures non-enum nodes without `type` fail with a descriptive error (not a spurious "no enum field" message). |
| **(Revision) `ObjectSchemaValidator` uses `Converters.object` internally** | `_buildObjectConverter` returns `Converter<ObjectStatic<P>>`, stored as `_converter`, `validate()` overridden | `Validators.object` is in-place (passes extra properties through on success). Object schemas in lenient mode (`additionalProperties: true`) must still only surface declared properties in the validated value — callers rely on the TypeScript type `ObjectStatic<P>` to be accurate at runtime. Using `Converters.object` ensures a new output object with only declared fields is produced. The same override pattern is used for non-strict `NumberSchemaValidator`. |

---

## History

| Date | Event | Notes |
|---|---|---|
| 2026-06-02 | Phase-2 feasibility verdict: **feasible** | `derives-t-feasibility.md` delivered (design spec). Phantom-tag mechanism tractable; `Converter<T>` needs no retrofit; ~505 lines impl + ~620 lines tests, single new `ts-json-base` packlet. |
| 2026-06-03 | Implementation complete (v1) | New `json-schema-builder` packlet (`JsonSchema` namespace) in `@fgv/ts-json-base`: `types.ts` (phantom types, `Static`, `ObjectStatic`), `factories.ts` (7 factories + `optional`), `toConverter.ts` (adapter composing existing `Converters.*`), `toJson.ts` (wire emission), `fromJson.ts` (opaque parse). 5 in-flight calls resolved (above). 65 tests, **100% coverage** on the new packlet; `rushx build` + `rushx lint` green; api-extractor report regenerated; `minor` rush change file added; `LIBRARY_CAPABILITIES.md` updated. One pre-existing unrelated test failure (`mutableFsTree` read-only-permission check) fails only because the container runs as `root` (root bypasses `0o444`) — not introduced by this stream. PR opened onto `json-schema-derives-t`. |
| 2026-06-03 | Major API revision (v2) | Revised from "schema + separate converter" to "schema IS the validator" design. `toConverter.ts` DELETED. `toJson.ts` DELETED. `factories.ts` REWRITTEN: all factory classes extend `Validation.Base.GenericValidator<T>` (via `SchemaValidatorBase`) implementing `ISchemaValidator<T>` which extends `Validator<T>`; `schema.validate(input)` replaces `toConverter(schema).convert(input)`; `schema.toJson()` method on each class replaces standalone `toJson()`. `fromJson.ts` REWRITTEN using `Converters.discriminatedObject` + `Converters.oneOf` with pre-flight checks in `jsonSchemaConverter`; arm functions are hoisted function declarations referencing `jsonSchemaConverter` by name for recursive calls (safe via closure, `no-use-before-define` disabled at 2 sites). Key design decisions: `ObjectSchemaValidator` uses `Converters.object` internally (not `Validators.object`) to achieve proper property stripping; `c8 ignore` on unreachable placeholder ValidatorFunc for non-strict `NumberSchemaValidator`. `ISchemaValidator<JsonObject>` replaces `ILlmSchema<JsonObject>` on public surface. Tests rewritten. 100% coverage; `rushx build` + `rushx lint` green; api-extractor report regenerated; rush change file + `LIBRARY_CAPABILITIES.md` updated. |

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Implementation | `feat(ts-json-base): typed JSON Schema with derived static types (schema-derives-T)` → `json-schema-derives-t` | open |
| Cluster-close | TBD | orchestrator opens after this PR merges to the integration branch |
