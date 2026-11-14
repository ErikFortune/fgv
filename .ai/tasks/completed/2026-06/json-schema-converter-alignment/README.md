# `json-schema-converter-alignment` — completed (spike)

**Status:** ✅ shipped as part of the `json-schema-derives-t` cluster (PR #441 / cluster-close 2026-06-03).

**Shape:** two-phase research spike that pressure-tested the JSON-Schema-vs-Converter authoring alignment question and produced the feasibility verdict that led to the `json-schema-derives-t` stream.

---

## What this spike was for

The `ai-assist-client-tools` Phase A design recommended **JSON Schema as the parameter source-of-truth** for client-tool configs. Erik flagged the authoring concern: a consumer authoring both a JSON Schema (wire) and a Converter/Validator (runtime) over the same shape is error-prone and likely to drift. Worth investigating whether fgv could align the two so consumers author one and get the other for free.

Three directions surveyed:

- **(A) Schema → Converter** — author JSON Schema; runtime gets a Converter.
- **(B) Converter → Schema** — author Converter; wire format emitted on demand.
- **(C) Status quo** — keep them parallel; rely on tests for alignment.

## Phase 1 — broad survey (research.md, ~440 lines)

Surveyed OSS precedents (AJV, Zod v4, TypeBox), sketched fgv-native options per direction, compared costs.

**Phase-1 recommendation: Direction A** with AJV-style consumer-supplied `T` — `JsonSchema.toConverter<T>(schema)` in `ts-json-base`, ~300-500 lines impl + 300-400 tests, no surface change to existing exports.

**Erik retracted the recommendation in review** (2026-06-02): "Type assertion via `.toConverter()` doesn't give us any greater protection against drift than just decoupling schema and the converter entirely — just the illusion of greater protection, which is arguably worse." Also flagged that Direction B fails at the MCP boundary where tool definitions arrive as schema with no Converter to generate from.

Only remaining direction with real verify-not-assert end-to-end: **schema-derives-T (TypeBox-style)** — the schema value carries phantom type tags such that `Static<typeof schema>` mechanically derives the runtime type with no place for the consumer to assert.

## Phase 2 — feasibility sub-spike (derives-t-feasibility.md)

Tested whether TypeBox-style schema-derives-T is tractable for the LLM-tool JSON Schema subset against the existing fgv `Converter<T>` surface.

**Verdict: FEASIBLE.** Phantom-tag pattern requires no advanced TypeScript tricks beyond what the fgv codebase already uses (branded types). `Static<S> = S['static']` is property-access, not recursive conditional — no depth penalty at the LLM subset's typical nesting (~2-3 levels). Object/property optionality maps cleanly through a standard `OptionalKeys` / `RequiredKeys` mapped-type split. The existing `Converter<T>` surface needs no retrofit; the adapter is a recursive switch over the `_type` discriminant composing existing `Converters.*` primitives.

Estimated scope: ~505 lines impl + ~620 lines tests, single new packlet in `ts-json-base`. Compatible with `IAiClientToolConfig.parametersSchema: JsonObject` via `schema.toJson()` at the call site. MCP boundary: `fromJson(rawJsonObject)` returns `ISchemaValidator<JsonObject>` (later widened to `ISchemaValidator<JsonValue>` per L3 of the implementation review).

Erik chose **Option 1** from the verdict's sequencing options: commission the alignment stream immediately and hold `ai-assist-client-tools` Phase B/C for it. Resulting stream: `json-schema-derives-t` (PR #441), shipped in the same cluster-close as this spike.

## Outcome

- Direction A in its AJV-style form: **retracted by Erik review** — assertion ≠ verification.
- Direction B (Converter → Schema): **rejected on multiple grounds** — blast radius across ts-utils combinators (closures-over-data idiom doesn't expose captured converters) AND fails at MCP boundary.
- Status quo (Direction C): **viable interim** with drift-detection test pattern from research.md §3.3; superseded by the chosen schema-derives-T path.
- **Schema-derives-T (TypeBox-style)**: chosen and shipped via `json-schema-derives-t` stream. Schema IS the validator; `Static<S>` derives `T` mechanically; the consumer authors a single value and gets verified-not-asserted type safety end-to-end.

## Artifacts

- `brief.md` — phase-1 commission brief (3 directions to survey).
- `research.md` — phase-1 spike output (~440 lines covering OSS survey, fgv-native sketches per direction, cost comparison, recommendation that was subsequently retracted).
- `derives-t-feasibility-brief.md` — phase-2 commission brief (focused feasibility test on schema-derives-T).
- `derives-t-feasibility.md` — phase-2 feasibility verdict (Parts A type mechanics, B composition with `Converter<T>`, C cost + sequencing + stop conditions).
- `state.md` — decisions log + history through both phases + the chain of retractions and pivots.

## What this spike taught the workflow substrate

- **Type-assertion-vs-verification is a real distinction.** A `Schema → Converter<T>` API that requires the consumer to supply `T` provides no more drift protection than a fully decoupled schema + converter. Erik's review framing — "the illusion of safety is arguably worse than honest decoupling" — is the durable lesson; the AJV approach was rejected on this principle.
- **The MCP boundary constrains which direction makes sense.** Converter-first authoring works for hand-written code but fails when the schema arrives at runtime (MCP-discovered tools). Schema-first authoring (with `Static<>` derivation) works in both directions. Direction choice is forced by the consumption surface, not authoring convenience.
- **Phase-2 sub-spike pattern** — pivoting on review feedback. Phase 1 produced a clean recommendation; Erik's review pivoted the direction; phase 2 tested the new direction's feasibility before committing implementation. The two-spike sequence cost less than a wrong full implementation would have.

## Stream linkage

| Stream | Status |
|---|---|
| `json-schema-converter-alignment` (this spike) | ✅ shipped as Spike artifact in the same cluster-close as the implementation stream |
| `json-schema-derives-t` | ✅ shipped (PR #441) — built on schema-derives-T verdict |
| `discriminated-object-self-fix` (PR #442) | ✅ shipped to release 2026-06-03 — upstream Converter primitive fix that the derives-t stream depended on |
| `ai-assist-client-tools` | 🟡 held — was waiting for derives-t; can now resume Phase B with typed-schema authoring as the locked target |
