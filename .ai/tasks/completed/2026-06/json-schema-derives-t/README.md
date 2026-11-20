# `json-schema-derives-t` — shipped

**Shipped:** 2026-06-03 via PR #441 (squashed into integration branch `json-schema-derives-t`); cluster-close to `release` 2026-06-03.

**Package surface:** new packlet `@fgv/ts-json-base/json-schema-builder` (consumer-facing `JsonSchema` namespace) — ~505 lines impl + ~620 lines tests. No surface change to existing exports.

---

## What shipped

Typed JSON Schema with derived static types for the LLM-tool JSON Schema subset. **Schema IS the validator** — call `schema.validate(input)` directly. The schema value is a typed builder that carries phantom type tags so `Static<typeof schema>` mechanically derives the runtime type — no place for the consumer to assert `T`, no drift between wire schema and runtime validation.

```ts
const Memory = JsonSchema.object({
  query: JsonSchema.string(),
  limit: JsonSchema.optional(JsonSchema.number())
});

type Memory = Static<typeof Memory>;
// Memory === { query: string; limit?: number }

Memory.validate(input);   // Result<Memory>
Memory.convert(input);    // Result<Memory> — applies coercion for non-strict schemas
Memory.toJson();           // raw JSON Schema (wire format for LLM tool definitions)

// MCP boundary parse — schemas arriving from MCP servers
JsonSchema.fromJson(rawJsonSchema);  // Result<ISchemaValidator<JsonValue>>
```

### 7 factories + `optional` modifier

`string`, `number`, `integer`, `boolean`, `enumOf`, `array`, `object`, `optional`. Each returns an `ISchemaValidator<T>` instance that extends `Validator<T>`.

### Five locked design decisions (documented in state.md)

1. **Packlet name** — `json-schema-builder`; consumer namespace `JsonSchema`.
2. **Strict numeric mode** — default strict (rejects `'42'` for `number()`); opt out via `{ strict: false }`.
3. **`additionalProperties` default** — `false` (LLM convention); opt in via `{ additionalProperties: true }`.
4. **Error messages** — reuse existing `Converters.object` / `Converters.strictObject` field-name-aware reporting; no parallel error system.
5. **`fromJson` out-of-subset cutoff** — fail on structural/assertive keywords (`$ref`, `oneOf`/`anyOf`/`allOf`, `pattern`, union `type` arrays, schema-valued `additionalProperties`, missing/unknown `type`). Silently ignore pure annotations (`title`, `default`, `format`, `examples`); preserve `description`.

### Dependencies + sequencing

- **`discriminated-object-self-fix`** (PR #442, merged to release 2026-06-03) — the `jsonSchemaConverter` MCP-boundary parser uses `Converters.discriminatedObject` recursively for nested `array.items` and `object.properties.*` schemas. The recursion via `self` only works because PR #442 fixed `discriminatedObject` to thread `self` to per-arm converters. Sequencing: PR #442 landed first; this stream merged release into the integration branch to pick it up; the revision rebuilt on the corrected primitive.
- **`json-schema-converter-alignment`** spike (sibling artifact in this cluster) — design specification for the schema-derives-T approach. The feasibility verdict in `derives-t-feasibility.md` is the source-of-truth this stream implements.
- **`ai-assist-client-tools`** — Phase B/C held for this stream. Now unblocked; Phase B commissions next with typed-schema authoring as the locked target for `IAiClientToolConfig.parametersSchema`.

---

## Iteration story — four Copilot rounds + code-reviewer + structural pivots

This PR went through more iteration than most streams; the iteration was load-bearing in each round.

### v1 (commits `a942902`, `7abb1ee`)

First-pass implementation. Used `toConverter(schema)` switching on `_type` + procedural `_parseNode` switch in `fromJson`. Erik flagged the anti-patterns; both `_type` switches and manual `JsonObject` inspection violate `CODING_STANDARDS.md` § Type-Safe Validation.

### v2 — schema IS the validator (commits `a8ed0a0`, `7308f73`)

Full rewrite per Erik's design direction. `toConverter.ts` and `toJson.ts` deleted. Each factory returns an `ISchemaValidator<T>` instance that extends `Validator<T>`; `toJson()` is a method on each. `fromJson` rebuilt on `Converters.discriminatedObject` with arms recursing via `self`.

Required PR #442 (`Converters.discriminatedObject` self-fix) as a precursor — the recursion through `self` was only possible after that fix. The "extend the primitive, don't work around it" doctrine drove the upstream fix instead of a lazy-thunk closure workaround.

### Round-1 / round-2 Copilot fixes (commit `3f582c9c`)

12 findings addressed in one sweep:

- **L1** — `fromJson` rejected enum schemas with conflicting `type` field (was silently normalizing `{ type: 'integer', enum: ['a'] }` to a string enum). Enum dispatch moved from `oneOf` to explicit `if ('enum' in raw)` pre-flight to prevent fallthrough.
- **L2** — arm bodies rewritten using `Converters.field` / `Converters.optionalField` to eliminate the `from as Record<string, unknown>` procedural-inspection anti-pattern that v2 ostensibly retired but had merely relocated from `_parseNode` into the arm bodies.
- **L3** — `fromJson` return type changed from `ISchemaValidator<JsonObject>` to `ISchemaValidator<JsonValue>` — honest supertype covering primitives, arrays, AND objects. Eliminated multiple round-trip casts.
- **L4** — unsafe `result as unknown as Failure<...>` cast at factories.ts:233 rewritten via direct chain + phantom-only cast (Erik's direct comment: "chain results").
- **L5–L11** — docstring accuracy fixes, TSDoc `{@link}` cleanup to eliminate 45 `ae-unresolved-link` warnings from api.md, `toConverter.test.ts` rename + header comment update.

Plus the P2 path-threading fix (commit `09c67aee`) before Copilot round 1 — `fromJson` now threads JSON Pointer path through nested object/enum parsing via a context-typed Converter (`Converter<T, string>`), so error messages name the actual failing node (e.g. `#/properties/config/properties/inner: ...` instead of always `#: ...`).

### Round-3 Copilot fix (commit `2076bf8a`) — load-bearing structural catch

**The substantive catch of the iteration cycle.** Each schema validator class overrode `validate()` but inherited a placeholder `convert()` returning `true`. When schemas were used as field validators inside `Converters.object` / `Converters.arrayOf` (which call `.convert()` on children, not `.validate()`), the placeholder accepted any value and passed it through typed as the declared static type. Real type-soundness hole.

Four surface symptoms:

- `JsonSchema.object({ n: JsonSchema.number({ strict: false }) }).validate({ n: 'nope' })` succeeded with `{ n: 'nope' as number }`.
- `JsonSchema.array(JsonSchema.number({ strict: false }))` accepted `['42']` typed as `number[]`.
- Nested `JsonSchema.object` skipped child validation.
- `JsonSchema.optional(inner)` lost inner transformations.

One root cause: validator/convert asymmetry on the subclasses.

Fix: every schema class now overrides both `validate()` and `convert()` routing through the same internal logic. `ArraySchemaValidator` switched from `Validators.arrayOf` (in-place) to `Converters.arrayOf` (calls `convert()` on elements). `OptionalSchemaValidator` routes `convert()` through `inner.convert()`. Coverage tests added for all four previously-silent failure modes.

Code-reviewer and the earlier Copilot rounds missed this because top-level tests exercise `validate()` directly; only nested-as-field-validator usage exercises `convert()`. Round 3 was where Copilot earned its keep.

### Round-4 sweep (commits `8a1f8455`) — diminishing returns

Three small items: one missed `JsonObject` → `JsonValue` drift site in `index.ts`, state.md decisions-log accuracy on enum dispatch (impl uses pre-flight, not `oneOf`), one judgment call (`_descriptionField` non-string handling) deliberately not flipped per round-3's documented rationale.

No new structural findings. **Copilot review loop converged at round 4 on diminishing returns per L33** (4 of 10 rounds used).

---

## Anti-patterns retired

- No `switch (_type)` anywhere in dispatch — polymorphism via `Validator<T>` inheritance + `Converters.discriminatedObject` arm dispatch.
- No `from as Record<string, unknown>` / `'key' in raw` / `Array.isArray(items)` manual `JsonObject` inspection inside `fromJson` — each arm declares expected fields via `Converters.field` / `Converters.optionalField`.
- No `as unknown as Converter<Static<S>>` casts — the schema IS the validator; no separate adapter step.

## Gates (final)

- `rush build` clean monorepo-wide.
- `rushx lint` + `rushx fixlint` clean in `libraries/ts-json-base`.
- `rushx test` — 100% coverage on the `json-schema-builder` packlet. One pre-existing unrelated failure (`mutableFsTree` `permission-denied` test; `TECH_DEBT.md` P4).
- api-extractor report regenerated; zero new `ae-unresolved-link` warnings (45 eliminated by round-1 TSDoc cleanup).
- `minor` rush change file for `@fgv/ts-json-base`.
- `LIBRARY_CAPABILITIES.md` entry under `@fgv/ts-json-base`.
- No `any`; no `Result<void>`; Result-pattern conformance.
- **`code-reviewer` agent run on v2 revision** per L32: Approved (no P1; P2 path-threading fix landed in `09c67aee`).
- **Copilot review loop** per L33: 4 rounds; converged on diminishing returns.

## Substrate note (carried over from in-flight)

The implementing agent created `state.md` because the substrate-prep PR #440 was not present on the integration branch at implementation start (only the alignment-spike substrate was). The design specification (`derives-t-feasibility.md`) and the implementation contract (the kickoff brief) were complete, so the gap did not block implementation. Documented in state.md as a process note.

## What this stream taught the workflow substrate

- **Round 3 of the Copilot loop earned its keep.** The structural validator/convert symmetry bug was invisible at top-level tests but real when schemas were nested as field validators. This is exactly the case L33's "agent judges diminishing returns" framing exists for — round 3 was clearly substantive, round 4 was clearly nitpick. Stop on judgment, not round count.
- **Multi-round iteration is OK when each round adds value.** Four rounds is unusual but each round had a specific load-bearing finding. The L33 cap (10 rounds) is for runaway loops, not for "this PR took several rounds" situations.
- **"Extend the primitive, don't work around it" beat lazy-thunk closure.** When v2 needed recursive discriminated-union parsing, fixing `Converters.discriminatedObject` (PR #442) once let this stream and all future recursive parsers use the primitive cleanly. The lazy-thunk closure workaround would have worked but accumulated implicit debt across consumers.
- **The schema-IS-the-validator framing collapses three entities (schema, converter, JSON emission) into one with three views.** The v1 design had separate `toConverter()` and `toJson()` functions; v2 made the schema value carry both behaviors as methods. Simpler consumer API + harder to drift because the three views all derive from the same authored value.

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep | #440 (closed; substrate created on integration branch by implementation agent) | superseded |
| Phase-1 spike output | (closed in favor of #439) | superseded |
| Phase-2 spike output | #439 (closed in favor of integration branch's bundled squash) | superseded |
| Implementation (v1 + v2 + 4 Copilot rounds) | #441 | ✅ merged to integration 2026-06-03 |
| Discriminated-object-self-fix dependency | #442 | ✅ merged to release 2026-06-03 |
| Cluster-close (integration → release) | (this housekeeping PR) | open |
