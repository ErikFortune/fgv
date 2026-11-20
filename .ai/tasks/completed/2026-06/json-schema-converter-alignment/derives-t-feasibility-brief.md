# Spike brief (phase 2): `json-schema-derives-t-feasibility`

**Status:** 🟡 follow-up spike — single-output deliverable, no code
**Workflow shape:** focused-feasibility spike (sub-spike of `json-schema-converter-alignment`)
**Output:** `.ai/tasks/active/json-schema-converter-alignment/derives-t-feasibility.md`
**Predecessor:** `research.md` (Direction A recommendation, AJV-style consumer-supplied `T`)
**Target package surface (for context):** `@fgv/ts-json-base` — schema-derives-T addition to whatever Direction A ends up shipping.

---

## Why this spike exists (Erik's review of `research.md`, 2026-06-02)

The phase-1 spike recommended **Direction A** with **AJV-style consumer-supplied `T`** (`JsonSchema.toConverter<T>(schema)` — consumer asserts the type, runtime validates input against the schema, but TypeScript can't see whether `T` actually describes what the schema produces). Erik's review:

> Type assertion via `.toConverter()` doesn't give us any greater protection against drift than just decoupling schema and the converter entirely — just the illusion of greater protection, which is arguably worse. Especially given that it requires extra work.
>
> Upon reflection (hah), relying entirely on converter→schema would fail once we hit MCP, where the tool definition will be arriving as schema (leaving aside the blast radius noted in the research document — it wouldn't be sufficient even if it were easy).
>
> That means we need the spike for point 1. Let's commission that now.

**Two findings from the review:**

1. **AJV-style assertion is worse than honest status-quo decoupling.** Same drift risk, false sense of safety, extra authoring work. Not worth shipping.
2. **Converter → Schema (Direction B) is fundamentally insufficient for the MCP layer.** MCP tools arrive as schema descriptors; there's no Converter to generate from. Even with no blast radius, B would force a separate code path at the MCP boundary.

Conclusion: the **only** alignment direction worth building is **schema-derives-T** (TypeBox-style), and it must be tractable for the LLM-tool / MCP-tool JSON Schema subset for the alignment story to be worth doing at all.

---

## Mission

Determine feasibility, in two parts:

### Part A — Is schema-derives-T tractable for the LLM-tool / MCP-tool JSON Schema subset?

The LLM-tool subset (verified in phase-1 research):

- `type: 'object'` with `properties`, `required`, `additionalProperties: false`
- `type: 'string'` (plus optional `enum`, `description`)
- `type: 'number'` / `type: 'integer'` (plus optional `enum`, `description`)
- `type: 'boolean'`
- `type: 'array'` with `items`
- Nested objects and arrays
- Property `description` strings (no impact on `T`, but consumed by providers)

**Out of scope for this spike** (out-of-subset features): `$ref`, `oneOf` / `anyOf` / `allOf`, `pattern`, custom format validators, JSON Schema 2020-12 features. If schema-derives-T for the LLM subset works cleanly, those are separable extensions.

**The TypeBox pattern in one line:** the schema is a TypeScript value with phantom type tags such that `Static<typeof schema>` mechanically derives the runtime type. Authoring shape:

```ts
const MemorySchema = JsonSchema.object({
  query: JsonSchema.string(),
  limit: JsonSchema.optional(JsonSchema.number())
});
type Memory = Static<typeof MemorySchema>;
// Memory === { query: string; limit?: number }
```

Investigate:

- **Type-level mechanics.** Can the LLM subset be expressed with a small set of factory functions (`object`, `string`, `number`, `boolean`, `array`, `optional`, `enum`) where each return value carries a `__type` phantom such that the conditional-type / mapped-type machinery in `Static<>` resolves cleanly? Sketch the phantom-tagging shape and the `Static<>` resolution.
- **Compile-time error quality.** When a consumer writes a malformed schema (e.g. `JsonSchema.object({ x: 5 })`), do they get a useful TS error or "Type 'number' is not assignable to type 'never'" gibberish? TypeBox's error messages are notoriously cryptic; can the fgv version do better with a smaller surface?
- **Optional fields.** TypeBox-style `optional(...)` is the trickiest mapped-type case. How does it interact with `required` (in the emitted JSON Schema) and `?:` (in the derived TS type)? Verify the round-trip works without TS performance issues.
- **Inference depth.** TypeBox has known limits with deep nesting (TS `tsc --traceResolution` shows the unfold cost). The LLM subset is shallow (~2-3 levels max in practice). Confirm or refute that depth concern.
- **Combinator surface.** TypeBox publishes ~40+ combinators because it covers full JSON Schema. The LLM subset needs ~6-8. Confirm a small surface is sufficient.

### Part B — How does schema-derives-T compose with the existing fgv `Converter<T>` surface?

The end goal is `JsonSchema.toConverter(schema)` returning a `Converter<Static<typeof schema>>` — schema in, Converter out, `T` derived not asserted.

Investigate:

- **Adapter shape.** The Converter is the fgv runtime contract; how does the TypeBox-style schema value get rendered into the runtime Converter that does the actual validation? Likely a recursive descent that switches on the phantom-tag and assembles a `Converters.object` / `Converters.string` / etc. tree. Sketch.
- **Type-flow through the adapter.** `Static<typeof schema>` is a compile-time computation; the Converter at runtime returns `Result<T>` where `T = Static<typeof schema>`. Verify TS infers this correctly without manual `as` casts in `toConverter`'s implementation. If casts are needed, name them and verify they're correctness-preserving.
- **Wire-format emission.** The runtime schema (used by the LLM provider) is JSON. The TypeBox-style value needs a `toJson(schema)` function that strips phantom tags and emits the wire-format JSON Schema. Sketch.
- **Compatibility with the status-quo `IAiClientToolConfig.parametersSchema: JsonObject` shape.** Two options: (a) `parametersSchema` accepts either the typed schema value OR a `JsonObject`, with `toConverter` overloaded for both; (b) typed schema values include a `toJSON()` so they're structurally compatible with `JsonObject` consumers via implicit serialization. Pick a recommendation.
- **`Converters.number` numeric-string acceptance** flagged in `research.md` §4: does the derived Converter need a strictness setting, or is the LLM-tool use case satisfied by the existing permissive behavior? Surface as a phase-C question for the alignment stream.

### Part C — Cost + sequencing

If feasibility is confirmed:

- **Sketch the implementation scope.** File count, packlet location (probably `ts-json-base/json-schema` or sibling), test surface, blast radius. Compare to the phase-1 estimate (~300-500 lines impl + 300-400 tests for AJV-style Direction A).
- **MCP fit.** Confirm that MCP-discovered schemas (which arrive as raw JSON Schema, no phantom tags) can be parsed into the typed schema value at the MCP boundary — i.e. `JsonSchema.fromJson(rawJsonObject)` reconstructs phantom tags. Sketch the parse function and its failure-mode shape (what happens if the MCP server emits an out-of-subset feature like `$ref`).
- **Sequencing recommendation.** Erik's framing: "I'm inclined to add that now and hold the AI tool work until it's ready." Confirm or refute that ai-assist-client-tools Phase B/C should hold for this work, or propose an alternative shape (e.g. Phase B advances on contract design now; Phase C holds for alignment).
- **Stop conditions.** Name the scenarios under which feasibility fails and the fallback shape:
  - Phantom-type machinery has TS perf cliff at the depths the LLM subset needs.
  - Optional / required interaction can't be expressed without consumer-visible workarounds.
  - The combinator surface bloats past ~10 entries and starts to look like TypeBox proper.
  - In any of these: fallback is **status quo, Direction C** with the drift-detection test pattern from `research.md` §3.3. The AJV-style assertion path is explicitly **off the table** per Erik's review.

If feasibility is NOT confirmed:

- **Justify the call.** Specifically which mechanism (phantom tags, mapped types, conditional inference, deep recursion, etc.) breaks and why the workaround is worse than status-quo decoupling.
- **Confirm fallback to status-quo Direction C.** Reference `research.md` §3.3 for the recommended drift-detection test pattern.

---

## Reading list

1. **`.ai/tasks/active/json-schema-converter-alignment/research.md`** — phase-1 spike output. §3 (Direction C / status quo), §4 (Direction A recommendation) are the most directly relevant.
2. **`.ai/tasks/active/json-schema-converter-alignment/brief.md`** — phase-1 brief.
3. **`.ai/tasks/active/json-schema-converter-alignment/state.md`** — phase-1 decisions log.
4. **`.ai/tasks/active/ai-assist-client-tools/design.md`** §2.3 — where `parametersSchema: JsonObject` is currently recommended.
5. **`libraries/ts-utils/src/packlets/conversion/`** — fgv Converter primitives (especially `Converters.object`, `Converters.string`, `Converters.optionalField`, `Converters.arrayOf`, `Converters.enumeratedValue`). The adapter sketch in Part B descends into these.
6. **TypeBox source** (github.com/sinclairzx81/typebox) — phantom-tag pattern + `Static<>` machinery. Read enough of the type definitions to understand the mechanism; don't try to absorb the full combinator surface.
7. **`.ai/instructions/CODING_STANDARDS.md`** § Type-Safe Validation.

---

## Out of scope

- **Implementation.** This is a feasibility spike. Output is `derives-t-feasibility.md` with sketches + a feasibility verdict + a recommendation. The actual alignment-stream commission happens after Erik reviews this.
- **Generalizing beyond the LLM-tool JSON Schema subset.** Future consumers can drive separate scoping.
- **Reconciling with AJV-style Direction A.** That path is off the table per Erik's review. The spike does not need to compare schema-derives-T against AJV-style — the comparison is schema-derives-T vs status-quo Direction C.
- **Reconciling with Direction B (Converter → Schema).** Also off the table — fails at MCP per Erik's review.
- **No code changes.** Sketches in the doc are TypeScript pseudo-code only.

---

## Deliverable shape

A single doc at `.ai/tasks/active/json-schema-converter-alignment/derives-t-feasibility.md` covering Parts A, B, C above. Suggested length 200–400 lines — focused feasibility verdict, not a full design.

If the verdict is **feasible**: lead with the recommended implementation shape + scope estimate + sequencing. Erik's call after that.

If the verdict is **infeasible**: lead with the specific blockers, then the fallback to status-quo Direction C. Erik's call after that.

Either way, the doc must close with a one-paragraph recommendation: feasible / infeasible / borderline; if borderline, what would tip it.

Update state.md when complete. Retract the `Out of scope (Direction A follow-on): static T-from-schema inference` decision row (it's been retracted by Erik's review) and replace with a row reflecting the new spike output.

---

## When the spike is ready

1. Verify the doc answers Parts A, B, C.
2. Update state.md with a phase-2 history row + retracted/replaced decision rows.
3. Push to `chore/json-schema-derives-t-spike-prep`. Orchestrator opens or updates the PR after the agent finishes.
4. Do NOT commission a follow-on stream yourself. Erik reviews the verdict first.

---

## Stop-and-surface protocol

If during the spike you find an unexpected angle that materially changes the shape (e.g. "TypeBox-style schema-derives-T is feasible but the existing fgv Converter surface fundamentally can't accept a derived `T` without retrofit X"), STOP and surface to the orchestrator via a TODO at the top of `derives-t-feasibility.md` — don't paper over.

If you find that schema-derives-T for the LLM subset has an obvious tractable shape (no phantom-type tricks needed, just a small set of factories with a recursive `Static<>` mapped type), say so directly and skip the deep-recursion concerns — short answers are good.

**Begin.**
