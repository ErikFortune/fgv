# Stream brief: `json-schema-derives-t`

**Status:** 🟢 ready to commission
**Integration branch:** `json-schema-derives-t` (off `release`, currently sitting on top of `chore/json-schema-derives-t-spike-prep` so the spike substrate + feasibility verdict ride into release in the same squash) → squash to `release` at close
**Workflow shape:** single implementation PR onto integration branch
**Package surface:** new packlet `@fgv/ts-json-base/json-schema-builder` (or similar — exact packlet name is a small Phase-B-equivalent choice in this brief). No surface change to any existing exports. New types/factories/adapters/serializers live in the new packlet; tests likewise.

---

## Mission

Ship the **schema-derives-T** alignment capability in `@fgv/ts-json-base`: a small set of factory functions that build a typed JSON Schema value, plus a `Static<S>` type-level extractor, plus a runtime adapter that materializes the schema into a fgv `Converter<Static<S>>`, plus a JSON-format emitter and a parse-from-raw-JSON-Schema entry point for the MCP boundary.

The feasibility spike already produced concrete sketches. **This stream's job is to land those sketches as production code**, not to redesign them. Open design questions (small, all named below in §Phase-B-equivalent decisions) are bounded; the implementing agent makes calls and documents them in state.md.

**Hard sequencing:** `ai-assist-client-tools` Phase B/C is **held** for this stream. The `IAiClientToolConfig.parametersSchema: JsonObject` shape adopts the new typed schema authoring as part of Phase C; consumers (personaility) get verify-not-assert end-to-end from day one of layer-1 tool-use.

---

## Design source-of-truth (read in full before any coding)

The two artifacts that already live on the integration branch and constitute the design specification for this stream:

1. **`.ai/tasks/active/json-schema-converter-alignment/derives-t-feasibility.md`** — the phase-2 spike's verdict + sketches for Parts A (type-level mechanics, 7-factory surface, optional/required split, `Static<S> = S['static']`), B (adapter shape, `toJson`, `fromJson`, MCP boundary), and C (cost/sequencing).
2. **`.ai/tasks/active/json-schema-converter-alignment/research.md`** — phase-1 spike. §3.3 has the drift-detection test pattern (not adopted as the shipping path, but worth keeping in test coverage so the alignment story is end-to-end demonstrable).

These two docs are the **specification**. The brief below stakes out the shipping contract; the design docs explain the mechanics.

---

## Locked design (from the feasibility spike — reproduced for the agent's convenience)

### The 7 factories (LLM-tool subset)

```ts
JsonSchema.string()
JsonSchema.number()
JsonSchema.integer()
JsonSchema.boolean()
JsonSchema.enumOf(<literal-array>)
JsonSchema.array(<inner>)
JsonSchema.object({ key: <inner>, ... })
JsonSchema.optional(<inner>)
```

Each factory returns a schema value carrying a phantom `static` property; the schema value also carries the JSON Schema runtime data. `Static<S>` extracts the type via `S['static']`.

### Public API (this is the stream's exported surface)

```ts
export namespace JsonSchema {
  export function string(opts?: { description?: string; enum?: readonly string[] }): IStringSchema;
  export function number(opts?: { description?: string }): INumberSchema;
  export function integer(opts?: { description?: string }): IIntegerSchema;
  export function boolean(opts?: { description?: string }): IBooleanSchema;
  export function enumOf<const T extends readonly (string | number)[]>(values: T, opts?: { description?: string }): IEnumSchema<T>;
  export function array<S extends ILlmSchema>(items: S, opts?: { description?: string }): IArraySchema<S>;
  export function object<P extends Record<string, ILlmSchema>>(properties: P, opts?: { description?: string; additionalProperties?: boolean }): IObjectSchema<P>;
  export function optional<S extends ILlmSchema>(inner: S): IOptionalSchema<S>;

  // Runtime → Converter adapter
  export function toConverter<S extends ILlmSchema>(schema: S): Converter<Static<S>>;

  // Wire-format emission
  export function toJson(schema: ILlmSchema): JsonObject;

  // MCP boundary parse (returns opaque-phantom schema for unknown-T MCP descriptors)
  export function fromJson(json: JsonObject): Result<ILlmSchema<JsonObject>>;
}

export type Static<S extends ILlmSchema> = S['static'];
```

The exact factory shapes, opt-bag fields, and `_type` discriminant names are open to the agent's discretion as long as the contract above is preserved.

### Adapter — recursive switch on `_type`

`toConverter` walks the schema tree and composes existing `Converters.*` (no new combinators). For each `_type`:

- `'string'` / `'number'` / `'integer'` / `'boolean'` → `Converters.string` / `Converters.number` / etc.
- `'enum'` → `Converters.enumeratedValue(values)`.
- `'array'` → `Converters.arrayOf(toConverter(items))`.
- `'object'` → `Converters.object({ key: toConverter(inner) | Converters.optionalField(toConverter(inner.inner)), ... })`.
- `'optional'` → wrapped inline by the parent `object` factory; not a freestanding adapter case (or handled if appearing freestanding).

The `as unknown as Converter<Static<S>>` cast at each arm is correctness-preserving because the phantom-type and the runtime data are constructed together by the factories — the cast bridges a compile-time fact the type system can't see directly.

### `toJson` — strip phantoms, emit JSON Schema

Walks the schema tree and emits standard JSON Schema (`{ type: 'object', properties, required, additionalProperties }`, `{ type: 'string', enum, description }`, etc.). Phantom properties don't exist at runtime so no stripping is necessary at JS level; the function just constructs the JSON Schema object from the schema value's runtime data.

### `fromJson` — MCP boundary parse

Validates that the input JSON is in the LLM-tool subset. On success returns `Result<ILlmSchema<JsonObject>>` — the phantom-`T` is opaquely `JsonObject` because the actual type is unknown at the MCP boundary. On out-of-subset features (`$ref`, `oneOf`, etc.) returns `fail(...)`.

This is the **honest** behavior; the MCP boundary doesn't get type-derivation magic, just runtime validation against the wire-format schema. Consumers who want typed access to MCP-discovered tools assert `as ILlmSchema<MyType>` at their own risk (and a follow-up stream can add a `fromJsonWithT<T>(json, schema)` that takes a TypeBox-style schema-pair as evidence — out of scope here).

---

## Phase-B-equivalent decisions for the implementing agent

The feasibility spike left these small calls open. Resolve in implementation, document in state.md decisions log:

1. **Packlet name.** `json-schema-builder`? `llm-schema`? `schema-builder`? Default: `json-schema-builder` (descriptive, matches the consumer-facing nature). Pick one; name it in state.md.
2. **Strict numeric mode.** `Converters.number` accepts numeric strings (e.g. `'42'`). Feasibility doc flags this as a phase-C question. Recommended default: strict (reject numeric strings). Provide a `{ strict: false }` opt-out on `JsonSchema.number()` for consumers who want the existing permissive behavior. Document the decision either way.
3. **`additionalProperties` default.** JSON Schema default is `true`; LLM-tool common convention is `false`. Recommended: default to `false` (most LLM providers reject objects with extras anyway), with an opt-in `{ additionalProperties: true }` on `JsonSchema.object`. Document.
4. **Error message strategy.** When `toConverter`-generated Converter fails, the error message should name which schema field failed. The feasibility doc didn't sketch this. Use the existing `Converters.object` field-name-aware error reporting; verify it works through the adapter; don't invent a parallel error reporter.
5. **`fromJson` strictness on out-of-subset features.** Recommended: return `fail()` with a clear "feature X is out of the LLM-tool subset" message. Some MCP servers may emit `description`-only fields that are technically out of subset but harmless; recommend pass-through for ignorable fields, `fail()` for structural out-of-subset (`$ref`, `oneOf`, etc.). Document the cutoff.

These are five small choices, not a Phase B triage cycle. Agent decides + documents.

---

## Acceptance criteria

- [ ] New packlet `@fgv/ts-json-base/<packlet-name>` exports the 7 factories + `Static<S>` + `toConverter` + `toJson` + `fromJson` + supporting types.
- [ ] Static type inference works as the feasibility doc sketches: `Static<typeof Schema> === { ...derived shape... }` for every factory combination including nested object/array/optional. Tests assert this via `expectTypeOf` or equivalent.
- [ ] Runtime adapter composes existing `Converters.*` primitives; no new combinators in `ts-utils/conversion`; no retrofit anywhere.
- [ ] `toJson` round-trips: every schema value emits the JSON Schema it semantically represents; tested against fixture schemas covering all factory combinations.
- [ ] `fromJson` round-trips for in-subset schemas: `toJson(fromJson(rawJson).orThrow())` is structurally equal to `rawJson`. Out-of-subset features `fail()` cleanly.
- [ ] `Result` pattern throughout. No `any`. No `Result<void>`.
- [ ] Result-pattern compliance: factories are infallible (no Result wrapping); `fromJson` and `toConverter`-generated converters return `Result<T>` per fgv convention.
- [ ] 100% statements/branches/functions/lines on the new packlet.
- [ ] `rush build` passes monorepo-wide (no consumer breakage anywhere — new packlet is additive).
- [ ] `rushx lint` passes in `libraries/ts-json-base`.
- [ ] `rushx fixlint` was run before final commit.
- [ ] api-extractor report regenerated (`libraries/ts-json-base/etc/ts-json-base.api.md`); committed.
- [ ] `minor` rush change file for `@fgv/ts-json-base` describing the additive new packlet.
- [ ] `LIBRARY_CAPABILITIES.md` entry added under `@fgv/ts-json-base` describing the new packlet, naming the canonical `Static<>` extraction pattern, and pointing at the LLM-tool-use motivating consumer (`@fgv/ts-extras/ai-assist`). Cross-link `Decision shortcuts (start here)` with a "Need typed JSON Schema for LLM tool authoring? → ..." entry.
- [ ] `code-reviewer` agent run on the final diff per L32; findings resolved or dispositioned; summary in the PR description.
- [ ] Copilot review loop driven per L33; stopped on diminishing returns or 10-round cap; status in PR description.

---

## Out of scope

- **`ai-assist-client-tools` Phase B/C** — separate stream, holding for this one to land. Do **not** touch `ai-assist-client-tools` substrate or the design.md. The next stream after this lands will commission Phase B against an updated design with the typed-schema authoring.
- **JSON Schema features beyond the LLM-tool subset** — no `$ref`, no `oneOf`/`anyOf`/`allOf`, no `pattern`, no custom formats, no JSON Schema 2020-12. If a consumer needs them later, separate scoping round.
- **TypeBox-style full combinator parity** — the 7-factory surface is deliberate. Don't pre-emptively add factories for unscoped use cases.
- **A typed `fromJsonWithT<T>(json, schema)`** that takes a schema-pair as evidence and produces `ILlmSchema<T>` for MCP-discovered tools — explicitly deferred per feasibility doc Part B closing.
- **A consumer-facing tutorial / README rewrite for `ts-json-base`** — `LIBRARY_CAPABILITIES.md` entry is sufficient; consumer-side docs land when ai-assist-client-tools Phase C ships the consuming surface.
- **Performance benchmarking** — out of scope at the implementation level; surface as a follow-up only if a real perf concern materializes during testbed integration.

---

## Reading list (start here)

**Design specification (required):**

1. `.ai/tasks/active/json-schema-converter-alignment/derives-t-feasibility.md` — Parts A, B, C with all the sketches.
2. `.ai/tasks/active/json-schema-converter-alignment/research.md` — §3.3 for the drift-detection test pattern (useful as a test case showing the new approach replaces the manual pattern).

**Existing surfaces this stream composes against (required):**

3. `libraries/ts-utils/src/packlets/conversion/` — `Converters.string`, `Converters.number`, `Converters.boolean`, `Converters.enumeratedValue`, `Converters.object`, `Converters.optionalField`, `Converters.arrayOf`. The adapter descends into these.
4. `libraries/ts-json-base/src/packlets/converters/` — existing JSON-shaped converters (`Converters.jsonObject`, `Converters.jsonValue`). The new packlet should fit alongside without overlap.
5. `libraries/ts-json-base/src/packlets/` — packlet layout convention.
6. `libraries/ts-json-base/etc/ts-json-base.api.md` — api-extractor baseline.
7. `.ai/instructions/CODING_STANDARDS.md` — Result pattern, Type-Safe Validation, Pre-PR Validation Checklist, Review-loop discipline (L32 + L33).
8. `.ai/instructions/LIBRARY_CAPABILITIES.md` — the existing `@fgv/ts-json-base` entry that this stream extends.

**Reference (light skim):**

9. TypeBox source (github.com/sinclairzx81/typebox) — for prior-art on the phantom-tag pattern; do **not** mirror the API or combinator surface.
10. `.ai/tasks/active/ai-assist-client-tools/design.md` §2.3 — the consumer surface that adopts this stream's output in the next stream.

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep | (this PR) | open → integration branch |
| Implementation | TBD | not yet commissioned |
| Cluster close (integration → release) | TBD | after implementation merges to integration |
