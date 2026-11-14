# Spike brief: `json-schema-converter-alignment`

**Status:** 🟡 research spike — single-output deliverable, no code
**Workflow shape:** parallel research spike (not a full design-triage-implement cycle)
**Output:** `.ai/tasks/active/json-schema-converter-alignment/research.md`
**Package surface (target, for context):** likely `@fgv/ts-json-base` (new packlet or extension to existing converters/validators); possibly cross-cuts `@fgv/ts-utils` Converter/Validator surfaces. The spike answers **whether** to extend, not what to ship.

---

## Mission

The `ai-assist-client-tools` Phase A design ([design.md §2.3](../ai-assist-client-tools/design.md)) currently recommends **JSON Schema as the parameter source-of-truth** for client-tool configs — consumers author it directly. Erik flagged this as worth a deeper look: authoring both a JSON Schema AND a typed Converter/Validator for the same shape (one for the wire, one for runtime validation) is **error-prone and likely problematic** — they drift, they disagree at boundary edges, and the consumer pays the alignment cost.

**Spike question:** Is there a fgv-native way to **align** the two so the consumer authors one and gets the other for free? Erik is open to either direction:

- **Generate Converter/Validator from JSON Schema** — consumer authors schema (the wire shape), runtime gets a Converter that produces the typed shape.
- **Generate JSON Schema from Converter/Validator** — consumer authors Converter (the typed shape), wire format gets emitted on demand.
- **Status quo** — keep them parallel; rely on tests / code review for alignment.

The spike researches the design space and returns a recommendation. Implementation is **not in scope** — that becomes its own stream if the recommendation is "yes, build it."

---

## What the spike must answer

### 1. Direction A — Schema → Converter

For each option, name the precedent (existing OSS library or fgv pattern that does this), the strengths, and the failure modes:

- TypeScript type generation from JSON Schema (e.g. `json-schema-to-typescript`)
- Runtime validator generation from JSON Schema (e.g. `ajv`, `zod` schema importers)
- Fgv-native: a `JsonSchema.toConverter<T>(schema): Converter<T>` factory in `ts-json-base`, leveraging the existing Converter primitives. What's the typing story — does `T` have to be supplied by the consumer, can it be inferred, is it always `unknown` at runtime?

Key constraints:
- Must produce a `Converter<T>` that conforms to fgv's `Result<T>`-returning contract.
- Must handle the JSON Schema features actually used by LLM provider function-calling (`type: object`, `properties`, `required`, `description`, `enum`, nested object/array, `additionalProperties`). Out of scope for LLM tool use: `$ref`, `oneOf`/`anyOf`/`allOf` polymorphism, `pattern` regexes, custom format validators (date/time/email/etc.).
- Loss-of-information concerns: a JSON Schema may not fully constrain the runtime type the consumer wants (branded types, refined types). How does the generated Converter compose with consumer-side refinement?

### 2. Direction B — Converter → Schema

- Add a `toJsonSchema()` capability to the `Converter<T>` surface (or a sibling factory). What's the coverage — which Converter combinators can produce a Schema, which can't (e.g. `Converters.generic` with arbitrary user logic)?
- Same constraints: handle the JSON Schema features LLM providers actually accept.
- Loss-of-information concerns in this direction: how does a `Converters.brandedString` map to JSON Schema (drop the brand and emit `string`? Emit `pattern` for branded ID formats? Surface as advisory metadata?).
- This is the direction that aligns with fgv's preference for code-first typing — but it's the harder of the two if the Converter surface wasn't designed with reflection in mind.

### 3. Direction C — Status quo

Keep authoring both. The spike must take this seriously as the answer: if (A) or (B) would cost ~1000+ lines of generation code to handle the LLM-relevant schema subset, and consumers can verify alignment with a 10-line round-trip test (`Converter.convert(JSON.parse(JSON.stringify(sampleValue))).orThrow()`), the status quo may win on cost/benefit.

Output should explicitly compare:
- Authoring cost per tool (lines of code, cognitive overhead).
- Drift detection cost (test setup, CI cycles).
- New-tool addition cost (consumer onboarding ergonomics).

### 4. Recommendation + scope sketch

If recommending (A) or (B):

- **Sketch the surface** at the level of "what does `JsonSchema.toConverter<T>(schema)` look like for a tool author?" — one code example per direction.
- **Scope the work**: file count, packlets touched, blast radius. This is a sub-phase sketch, not a phase-by-phase plan.
- **Sequencing relative to `ai-assist-client-tools`**: can this ship alongside Phase C of `ai-assist-client-tools` (layer 1) so consumers adopt the aligned authoring from day one? Or does it run later as an additive extension?

If recommending (C):

- Sketch the test pattern the spike recommends consumers use to catch drift.
- Confirm `ai-assist-client-tools` Phase C ships `JsonObject` / JSON Schema as-is.

---

## Cross-link with `ai-assist-client-tools`

This spike runs in parallel with Phase A review of `ai-assist-client-tools`. The spike's output **may** affect Phase C's authoring story for tool parameters — but it does **not** block Phase B (triage) of `ai-assist-client-tools`. The seam (`IAiClientTool` config carrying a JSON Schema) is the right shape regardless; the spike answers whether the consumer authors that schema directly or generates it from a Converter (or vice versa).

Coordinate any cross-references in the spike's research.md.

---

## Out of scope

- **Implementation of any direction.** This is a research spike; the output is `research.md` with a recommendation.
- **Generalizing to non-LLM use cases.** Future consumers of generated schemas (config validation, REST endpoint schemas, etc.) can drive their own scoping rounds. The LLM tool-use case is the forcing function.
- **Schema dialects beyond JSON Schema draft-07-ish.** All four LLM providers accept the same conservative subset; the spike doesn't need to cover JSON Schema 2020-12 features, `dependentRequired`, etc.
- **Runtime perf benchmarking.** Out of scope at the research level; surface as a Phase C question if perf seems load-bearing.

---

## Reading list

1. `libraries/ts-utils/src/packlets/conversion/` — current Converter surface; `Converters.object`, `Converters.string`, etc.
2. `libraries/ts-utils/src/packlets/validation/` — Validators (the in-place sibling).
3. `libraries/ts-json-base/src/packlets/converters/` — existing JSON-shaped converters; `Converters.jsonObject`, etc.
4. `libraries/ts-json-base/src/packlets/validators/` — JSON validators.
5. `.ai/tasks/active/ai-assist-client-tools/design.md` §2.3 (the JSON-Schema-as-source-of-truth decision this spike pressure-tests).
6. `.ai/instructions/CODING_STANDARDS.md` §§ Type-Safe Validation; Converter/Validator patterns.
7. Light external survey of `ajv`, `zod`, `typebox`, `io-ts`, and any OSS library that does schema↔runtime-validator generation in either direction.

---

## Deliverable shape

A single research doc at `.ai/tasks/active/json-schema-converter-alignment/research.md` covering §§ 1–4 above. Suggested length: ~300–600 lines. Reserve for surface sketches the substantial complexity; if the recommendation is "status quo," the doc may be shorter and end with the test pattern sketch.

`state.md` gets updated with the research-complete row when ready.

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep + research output | (this PR) | open → release; research.md added once complete |
| Follow-on stream (if recommendation is to build) | TBD | not yet commissioned |
