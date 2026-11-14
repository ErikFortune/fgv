# Research: `json-schema-converter-alignment`

**Status:** complete — recommendation below
**Author:** general-purpose research agent
**Date:** 2026-06-02
**Companion docs:** [brief.md](./brief.md), [state.md](./state.md), [`ai-assist-client-tools/design.md` §2.1](../ai-assist-client-tools/design.md)

---

## TL;DR

**Recommendation: Direction A (Schema → Converter), bounded — but ship it as a *second-phase* additive extension, not as a Phase-C blocker for `ai-assist-client-tools`.**

- The fgv Converter combinator surface is **not currently reflection-friendly enough** to drive Direction B at low cost (most combinators are opaque `BaseConverter` closures with no public fields exposing their inner converter / element converter / option set). Adding reflection would touch every basic combinator in `ts-utils/conversion` — broad blast radius on an established surface.
- Direction A, scoped to the LLM-tool-use JSON Schema subset (`type`, `properties`, `required`, `description`, `enum`, nested object/array, `additionalProperties`), is a **small, contained, additive** new factory in `ts-json-base`. Estimated 300–500 lines of implementation + tests. No changes to existing exported surfaces.
- Direction C (status quo) is **viable** for the LLM-tool-use case as Phase B/C of `ai-assist-client-tools` proceed; the alignment burden on a 1–3-field tool config is small and a 10-line round-trip drift test catches the realistic failure modes. The spike's recommendation does **not** block Phase C — it informs a *later* additive convenience.
- The fgv-native answer to "consumer authors one and gets the other for free" is **author JSON Schema → derive a `Converter<JsonObject>` (or a typed `Converter<T>` if `T` is supplied by the consumer)**. This matches the asymmetry of the actual problem: the wire format is the *contract* (the LLM provider defines it), the typed runtime shape is a consumer concern.

The full doc walks the reasoning. Cost comparison is in §3; recommended sequencing in §4.

---

## Reading-list pointers used

- `libraries/ts-utils/src/packlets/conversion/{converter,baseConverter,basicConverters,objectConverter,stringConverter}.ts` — reflection surface of the Converter base classes and combinators.
- `libraries/ts-utils/src/packlets/validation/{validator,validatorBase,object,validators}.ts` — Validators (in-place sibling).
- `libraries/ts-json-base/src/packlets/converters/converters.ts` — JSON-shaped converters (`jsonObject`, `jsonValue`, `stringifiedJson`, etc.).
- `libraries/ts-json-base/src/packlets/validators/validators.ts` — JSON validators.
- `.ai/tasks/active/ai-assist-client-tools/design.md` §2.1 — the JSON-Schema-as-source-of-truth recommendation this spike pressure-tests.
- `.ai/instructions/CODING_STANDARDS.md` (Type-Safe Validation section) — anti-pattern: manual type-checking + cast; required pattern: `Converters.object` / `Validators.object`.
- External: Zod v4 (`z.toJSONSchema`), AJV (`ajv.compile<T>` + `JSONSchemaType<T>`), TypeBox (`Type.Static<typeof S>` over an in-memory JSON Schema), `json-schema-to-typescript` (build-time `.d.ts` emission).

---

## §1 Direction A — Schema → Converter

### 1.1 OSS precedents

| Library | What it does | Strengths | Failure modes / fit with fgv |
|---|---|---|---|
| **AJV** ([docs](https://ajv.js.org/guide/typescript.html)) | Compiles arbitrary JSON Schema (draft-04 → 2020-12) at runtime into a fast validator function. With `JSONSchemaType<T>` the schema is type-checked against a consumer-supplied `T`; `ajv.compile<T>(schema)` returns a type-narrowing predicate. | Mature, fast, full schema dialect coverage, code-generation under the hood. Type narrowing works as a TS guard. | Throws / returns boolean — not Result-shaped. `JSONSchemaType<T>` does not support discriminated unions / type-infers from schemas (it goes T → schema-shape, not schema → T). Heavy dep. Doesn't *produce* a `T` type from a schema; `T` is supplied. |
| **Zod v4 native** ([Zod JSON Schema docs](https://zod.dev/json-schema)) | `z.toJSONSchema(schema)` — Zod-to-JSON-Schema is the new direction. `fromJSONSchema` is an [open feature request (#5233)](https://github.com/colinhacks/zod/issues/5233) — **not** shipped natively as of Zod 4. | Schema export is high-quality (preserves descriptions, handles enums, supports `additionalProperties`, targets draft-07 / 2020-12 / OpenAPI 3.0). | The reverse direction (Schema → Zod) is community-supplied (`json-schema-to-zod`) and lossy. Demonstrates that "schema-from-validator" is the *easier* direction in Zod's experience. |
| **TypeBox** ([readme](https://github.com/sinclairzx81/typebox#readme)) | The schema **is** the runtime representation: `Type.Object({...})` returns a plain JSON Schema object; `Type.Static<typeof S>` derives the TS type at the type level; `TypeCompiler.Compile(S)` derives the runtime validator from the same object. | Single source of truth. Idiomatic for JSON-Schema-first authoring. Validator compiler is fast (codegen). | Authoring is not Converter-shaped (no transformation, just validation). The TS-inference is what makes it pleasant — that piece relies on heavy mapped/conditional types. Doesn't return `Result<T>`. |
| **`json-schema-to-typescript`** | Build-time `.d.ts` emission from a JSON Schema. | Useful for *typing* the consumer's callback when the schema is wire-authored. | Build-time only; no runtime validator. Complementary, not competitive. |

**Net signal from OSS:** Schema → Validator (Direction A) is a well-trodden path with multiple mature reference implementations. Validator → Schema (Direction B) is harder; the most successful instance (Zod v4) is itself author-validator-first, but native Schema → Validator (`fromJSONSchema`) is conspicuously absent from Zod 4 as of mid-2026 and is still an open feature request.

### 1.2 Fit with fgv

The Result-pattern constraint is the load-bearing differentiator. None of the OSS libraries return `Result<T>`; they throw or return booleans. A fgv-native `JsonSchema.toConverter<T>(schema)` must produce a `Converter<T, IJsonConverterContext>` that participates in `.onSuccess` / `.withErrorFormat` chains the same way `Converters.jsonObject` does today.

The actual implementation is straightforward — walk the JSON Schema node tree, emit existing converter primitives at each node. Concretely:

| JSON Schema node | Maps to existing fgv primitive |
|---|---|
| `{ type: 'string' }` | `Converters.string` (ts-json-base) |
| `{ type: 'string', enum: [...] }` | `Converters.enumeratedValue([...])` |
| `{ type: 'number' }` / `'integer'` | `Converters.number` (with integer check via `.withConstraint`) |
| `{ type: 'boolean' }` | `Converters.boolean` |
| `{ type: 'array', items: <sub> }` | `Converters.arrayOf(toConverter(sub))` |
| `{ type: 'object', properties, required, additionalProperties }` | `Converters.object({...}, { optionalFields, strict })` — fields built by recursing on each property; `optionalFields` = `Object.keys(properties) \ required`; `strict: additionalProperties === false` |

The conservative LLM-tool-use subset (`type`, `properties`, `required`, `description`, `enum`, nested object/array, `additionalProperties`) is fully reachable by composing the existing combinators. No new primitives required.

### 1.3 Sketch: `JsonSchema.toConverter` in `ts-json-base`

```typescript
// libraries/ts-json-base/src/packlets/json-schema/toConverter.ts (new packlet)

/**
 * The conservative JSON Schema subset accepted by LLM provider function-calling
 * APIs. Branded so consumers cannot accidentally pass arbitrary JsonObject.
 *
 * Out of scope (deliberately): $ref, oneOf/anyOf/allOf, pattern, custom formats,
 * dependentRequired, conditional subschemas.
 */
export type LlmToolJsonSchema = Brand<JsonObject, 'LlmToolJsonSchema'>;

/** Validates and brands an arbitrary JsonObject as an LlmToolJsonSchema. */
export const llmToolJsonSchema: Converter<LlmToolJsonSchema, IJsonConverterContext>;

/**
 * Produces a runtime Converter from a JSON Schema describing an LLM tool's
 * parameter shape.
 *
 * The result type defaults to JsonObject (the schema validates *shape*, not
 * a typed domain object). Callers who want a stronger type can supply T
 * explicitly — this is an unverified assertion at the type level (same shape
 * as ajv's `ajv.compile<T>(schema)`); runtime validation still happens via
 * the schema.
 *
 * @example
 *   const converter = JsonSchema.toConverter(toolSchema).orThrow();
 *   const args = converter.convert(rawArgsFromModel); // Result<JsonObject>
 *
 * @example
 *   interface IWeatherArgs { city: string; units?: 'metric' | 'imperial' }
 *   const converter = JsonSchema.toConverter<IWeatherArgs>(weatherSchema).orThrow();
 *   const args = converter.convert(rawArgs); // Result<IWeatherArgs>
 */
export function toConverter<T = JsonObject>(
  schema: LlmToolJsonSchema | JsonObject
): Result<Converter<T, IJsonConverterContext>>;
```

**Typing story (the question from brief.md §1):** `T` is **consumer-supplied** (defaulting to `JsonObject`). Inferring `T` from the schema at the type level requires conditional-types reflection on the JsonObject contents — TypeBox does this, but it's a substantial type-system project on its own (deep recursion limits, distributive conditionals, etc.) and lives in a different design space from the rest of the Converter surface. For the LLM tool-use case, the consumer's callback already declares its parameter type; consumers either:

1. Pass `JsonObject` and parse inside the callback (the current `ai-assist-client-tools` design).
2. Supply `T` as a TypeScript hint matching what they authored in JSON Schema (the AJV pattern). Drift between `T` and the schema is a consumer-side concern — `JSONSchemaType<T>` in AJV exists to catch this *statically* in narrow cases, but at the cost of fairly involved type machinery.

For the spike's scope, **option (1) + option (2) with no static cross-check** is the right pragmatic level: the runtime Converter is real and Result-shaped; the static cross-check is a future optional enhancement.

**Loss-of-information concerns.** The Converter produced from a JSON Schema cannot reconstruct branded types or refined types — JSON Schema has no representation for "this string is a `UserId`". The fgv idiom for this composition already exists:

```typescript
// Consumer supplies the brand layer on top of the generated converter:
const baseConverter = JsonSchema.toConverter<{ id: string }>(schema).orThrow();
const brandedConverter = baseConverter.map((raw) =>
  succeed({ id: raw.id as UserId })
);
```

This is the same composition pattern used today when chaining `Converters.string` with `.withBrand('UserId')`. No new affordance needed.

### 1.4 What this would cost to build

- One new packlet under `libraries/ts-json-base/src/packlets/json-schema/` (sibling to `json-file`, `converters`, `validators`).
- `toConverter.ts` (the dispatch / recursion) — ~150 lines.
- A small `LlmToolJsonSchema` branded type + a Converter that validates the schema shape itself (i.e. enforces the conservative subset and rejects out-of-scope features with a clear error message) — ~100 lines. This is the key safety net: rather than silently accepting `$ref` and producing a wrong validator, the factory **rejects** schemas outside the supported subset.
- Tests covering the LLM tool-use subset — ~300–400 lines (100% coverage target).
- Public-API exports + TSDoc — small.

Estimated total: **300–500 lines impl + 300–400 lines tests**. One packlet, one publishing surface, no touch to existing exports. Blast radius: contained.

### 1.5 Failure modes specific to fgv

- **`additionalProperties: false` mismatch with `Converters.object`'s `strict` option.** Today `Converters.object` defaults to `strict: false` (extra fields silently dropped). JSON Schema's default for `additionalProperties` is `true` (extra fields allowed *and preserved*). Direction A must reconcile these: when the schema sets `additionalProperties: false`, emit `Converters.strictObject`; when unset, emit `Converters.object` (silently drops extras — matches schema's "allowed" but not "preserved"). Document this as an intentional simplification of the LLM-tool subset (LLM-returned arguments shouldn't carry meaningful extra fields anyway).
- **`description` propagation.** JSON Schema `description` annotations are LLM-visible, not validator-visible. The generated Converter cannot emit them in error messages without piping `description` through to `Converters.object`'s `description` option. This is straightforward and lossless.
- **`enum` ordering.** `Converters.enumeratedValue` accepts a `ReadonlyArray<T>`; JSON Schema `enum` is an array. Trivial pass-through.

---

## §2 Direction B — Converter → Schema

### 2.1 What it would take

Adding `toJsonSchema()` to the `Converter<T>` surface requires every combinator to know how to describe itself. Today, the reflection surface on `Converter<T>` is:

```typescript
interface Converter<T, TC = unknown> extends ConverterTraits {
  readonly isOptional: boolean;
  readonly brand?: string;
  convert(from: unknown, context?: TC): Result<T>;
  // ... transformation methods (.map, .withBrand, .optional, .withConstraint, ...)
}
```

`brand` and `isOptional` are the *only* introspectable state. The actual conversion logic is a closure inside `BaseConverter._converter`. `ObjectConverter` happens to additionally expose `fields: FieldConverters<T, TC>` and `options: ObjectConverterOptions<T>` — which is what makes Direction B *thinkable* — but `arrayOf`, `recordOf`, `mapOf`, `oneOf`, `enumeratedValue`, `literal`, `tuple`, `delimitedString`, `validated`, `validateWith`, `generic`, `transform`, `transformObject` all return bare `BaseConverter` instances with no public access to the data they captured.

### 2.2 Coverage table

| Combinator | Schema-emittable? | Lossless? | Notes |
|---|---|---|---|
| `Converters.string` | ✅ | ✅ | `{ type: 'string' }` |
| `Converters.number` | ⚠️ | ⚠️ | `Converters.number` accepts numeric strings (`'42'`); JSON Schema `type: 'number'` does not. Lossy — the emitted schema would over-reject relative to the converter, or the consumer must accept that the Converter is permissive in a way the schema isn't. |
| `Converters.boolean` | ⚠️ | ⚠️ | Same — converter accepts `'true'` / `'false'` strings; schema does not. |
| `Converters.literal(v)` | ✅ | ✅ | `{ const: v }` (draft-06+) or `{ enum: [v] }` |
| `Converters.enumeratedValue([...])` | ✅ | ✅ | `{ enum: [...] }` |
| `Converters.object({...}, opts)` | ✅ | ⚠️ | Possible — fields are exposed. Lossy on `strict: false` (extras dropped silently, schema would say `additionalProperties: true` meaning "preserved"). |
| `Converters.strictObject({...})` | ✅ | ✅ | `additionalProperties: false` |
| `Converters.arrayOf(inner)` | ❌ | — | Inner converter not exposed. **Surface change required.** |
| `Converters.recordOf(inner)` / `Converters.mapOf` | ❌ | — | Same. |
| `Converters.oneOf([...])` | ❌ | — | Inner converters not exposed. Even if exposed, `oneOf` semantics in the converter are "first-match wins", not JSON Schema's "exactly-one-match". Emits as `anyOf`, not `oneOf`. |
| `Converters.tuple([...])` | ❌ | — | Not exposed. |
| `Converters.delimitedString` | ❌ | ❌ | Transforms string → array; no JSON Schema analog (the schema would describe one shape; the converter ingests another). |
| `Converters.validated(c, v)` / `.withConstraint(predicate)` | ❌ | ❌ | Predicates are opaque functions. Cannot be reflected as JSON Schema constraints. |
| `Converters.generic(fn)` | ❌ | ❌ | Arbitrary user function. By design opaque. |
| `Converters.transform` / `Converters.transformObject` | ❌ | ❌ | Source-to-dest shape transforms — fundamentally not the same shape on both sides. JSON Schema cannot describe the transform. |
| `.withBrand(b)` | ✅ (lossy) | ❌ | Brand is exposed; emits as `string` (drop brand) or as schema annotation `x-fgv-brand: 'UserId'` (advisory). |
| `.optional()` | ✅ | ✅ | Flag is exposed via `isOptional`. |

**Net coverage:** the *core* subset that LLM tool-use cares about (`string`, `number`, `boolean`, `enumeratedValue`, `object` with `strict`, `arrayOf`) is technically reachable **but `arrayOf`, `recordOf`, `oneOf`, `tuple` require exposing their inner converters as a public readonly field** — a surface change to four+ combinators in `ts-utils/conversion/basicConverters.ts`. Plus a new `toJsonSchema(): JsonObject` method on the `Converter<T>` interface and a default implementation that returns "I don't know how to describe myself, emit `{}` or fail" for opaque combinators.

### 2.3 Loss-of-information analysis

The brief asks specifically about branded types: emitting a `Converters.brandedString` (i.e. `Converters.string.withBrand('UserId')`) as JSON Schema has three options:

1. **Drop the brand:** emit `{ type: 'string' }`. Schema is lossy but valid against LLM providers. Lossless inverse: not possible (the brand is gone).
2. **Annotate:** emit `{ type: 'string', 'x-fgv-brand': 'UserId' }`. LLM providers ignore unknown annotations. Inverse: possible if the importer recognizes `x-fgv-brand`.
3. **Format hint:** emit `{ type: 'string', format: 'uuid' }` for known formats. Doesn't generalize. Not applicable to arbitrary brands.

Option 1 is the realistic choice. Option 2 is cute but adds a new dialect concern and a synchronization burden. Option 3 doesn't generalize.

### 2.4 Cost to build

- **Surface change on `Converter<T>` interface:** new optional `toJsonSchema(): JsonObject` method. Default implementation on `BaseConverter` returns `{}` or fails; specialized implementations on every combinator that should emit schema.
- **Expose inner converter on `arrayOf` / `recordOf` / `oneOf` / `tuple` / `mapOf` / `delimitedString` / `validated`:** each needs a subclass of `BaseConverter` (currently they return `new BaseConverter(closure)`) that holds the inner converter as a `public readonly`. ~6 combinators × ~30–60 lines each = ~300 lines of *purely additive* surface change.
- **`toJsonSchema()` implementations:** per-combinator, ~10–30 lines each. ~150 lines.
- **Tests:** higher than Direction A because the coverage matrix is wider — ~600 lines.
- **Cross-cuts:** the surface change to `arrayOf` et al. lives in `ts-utils` (an **established surface** per `ACTIVE_DEVELOPMENT.md`), so additivity is critical and well-trodden, but the surface change is *broad* (every consumer's `arrayOf(inner)` now returns a slightly more reflective object, even if the public type is unchanged).

Estimated total: **~600 lines impl + 600 lines tests + cross-cutting surface change to ts-utils**. Blast radius: medium — touches `ts-utils/conversion`, which is the most-imported packlet in the monorepo.

### 2.5 Why this direction is harder *for fgv specifically*

Zod's path (`z.toJSONSchema`) succeeded because Zod's combinators are introspectable by design — every Zod schema node carries a discriminant tag (`_zod.def.type`) plus the captured constructor arguments. The fgv Converter combinator surface predates schema-emission as a design goal; the closures-over-data idiom is everywhere. Retrofitting reflection on every combinator is feasible but is a separate, larger workstream than Direction A.

**A weaker form of Direction B** — only `ObjectConverter` and a handful of leaf converters get `toJsonSchema()`, the rest are *not* schema-emittable and the consumer authors a JSON-Schema-emittable subset of the Converter surface — is also viable, but then the consumer is back to authoring two parallel things (the schema-emittable subset *and* anything that needs `.generic` or `.transform`), just with one of them being a Converter rather than a JSON Schema.

---

## §3 Direction C — Status quo

### 3.1 What "status quo" actually means here

The `ai-assist-client-tools` Phase A design recommends: consumer authors `parametersSchema: JsonObject` (raw JSON Schema) on `IAiClientToolConfig`. If the consumer wants to validate the model-returned `args: JsonObject` in their callback before processing, they author a separate `Converter<TArgs>` for that shape.

The drift risk is real: the JSON Schema describes a contract to the LLM; the Converter describes a contract to the consumer's code. If a developer adds a new optional field to the schema and forgets the converter (or vice versa), the model can send a value the callback rejects, or the callback can demand a field the model was never told to provide.

### 3.2 Cost comparison

For a typical LLM tool — a 1–5 field config — the actual line counts:

| Item | Direction A (Schema → Converter) | Direction B (Converter → Schema) | Direction C (status quo) |
|---|---|---|---|
| **Per-tool authoring cost** | ~10–20 lines of JSON Schema (single source). Converter is one call: `JsonSchema.toConverter<T>(schema).orThrow()`. | ~10–20 lines of Converter code. Schema is one call: `converter.toJsonSchema()`. | ~10–20 lines of JSON Schema + ~10–20 lines of Converter = ~20–40 lines, plus a 5–10 line drift test. |
| **Library implementation cost** | 300–500 lines impl + 300–400 lines tests, one new packlet, no surface change | ~600 lines impl + ~600 lines tests + surface change to 6+ combinators in ts-utils | 0 lines library — but every consumer ships a drift test |
| **Drift detection cost** | None at runtime (single source); type-level `T` vs. schema is consumer's static concern | None (single source) | One round-trip test per tool: ~10 lines (sample value → `converter.convert(JSON.parse(JSON.stringify(sample))).orThrow()`) |
| **New-tool onboarding** | Read JSON Schema, write JSON Schema, get Converter for free. Familiar to LLM-tool authors. | Read Converter API, write Converter, get Schema for free. Requires learning fgv-specific combinators first. | Write both, write drift test. Highest cognitive load per tool. |
| **Maintenance over time** | Schema is the canonical source — refactoring the typed view requires either updating `T` (still consumer-side) or accepting `JsonObject` and parsing inline. | Converter is canonical — refactoring the schema requires re-emitting. Schema diff in PRs is harder to read than Converter diff. | Both can drift independently; tests catch most cases. |

### 3.3 Recommended drift-detection test pattern (if Direction C wins)

For a tool with config `{ name, description, parametersSchema, callback }` plus an internal `Converter<TArgs>`:

```typescript
// libraries/<consumer-of-ai-assist>/src/test/unit/weatherTool.test.ts

import '@fgv/ts-utils-jest';
import { weatherToolSchema, weatherArgsConverter } from '../../packlets/weather-tool';
import { JsonSchema } from '@fgv/ts-json-base'; // *if Direction A ships*
import { Validators } from '@fgv/ts-utils';

describe('weatherTool', () => {
  // Sample arguments that should be valid against both the schema and the converter.
  const validSample = { city: 'Seattle', units: 'metric' as const };

  test('a sample argument set valid against the schema is also accepted by the converter', () => {
    // Round-trip through JSON to simulate the wire path.
    const overWire = JSON.parse(JSON.stringify(validSample));
    expect(weatherArgsConverter.convert(overWire)).toSucceedWith(validSample);
  });

  test('the schema describes the exact field set the converter accepts', () => {
    // Static drift catch: list the required fields from the schema and the converter
    // and assert they line up. This is the manual version of the alignment.
    const schemaRequired = (weatherToolSchema.required as string[]).slice().sort();
    const schemaProperties = Object.keys(weatherToolSchema.properties as object).sort();
    expect(schemaRequired).toEqual(['city']);
    expect(schemaProperties).toEqual(['city', 'units']);
    // The converter exposes its fields via ObjectConverter.fields (a public readonly).
    // If the converter is wrapped (e.g. .map / .withBrand), this assertion needs a
    // different shape — most LLM tools won't need that.
  });

  test('the converter rejects fields the schema does not advertise', () => {
    const sneaky = { ...validSample, hackerField: 'oops' };
    // strictObject rejects; the model should never send this anyway.
    expect(weatherArgsConverter.convert(sneaky)).toFailWith(/hackerField/i);
  });
});
```

**Key properties of this pattern:**

- Doesn't require new library surface. Works today against `Converters.object` / `Converters.strictObject`.
- The "required fields match" assertion catches the most common drift (someone adds an optional field on one side only).
- The round-trip-through-JSON assertion catches type mismatches that escape TS (e.g. schema declares `units: { type: 'string' }`, converter declares `units: Converters.number`).
- Recommended idiom: each tool author writes one test file with these three tests. ~30 lines per tool.

**What this pattern does *not* catch:**

- Description / docstring drift (the schema's `description` says "City name" but the callback's TSDoc says "ZIP code"). No automated cure for this; code review catches it.
- Constraint drift (schema says `enum: ['metric', 'imperial']`, converter uses `Converters.string` instead of `Converters.enumeratedValue`). Catchable with a more elaborate test, but rapidly approaches the implementation cost of Direction A itself.

---

## §4 Recommendation and sequencing

### 4.1 Recommendation: Direction A, after `ai-assist-client-tools` Phase C

**The fgv-native alignment story is `JsonSchema.toConverter<T>(schema)` in `ts-json-base`. Direction B is too invasive on an established surface; Direction C is too leaky on the LLM-tool-use case as the count of tools grows.** But this is a *later* additive convenience — not a Phase-C blocker.

#### Why Direction A over Direction B

1. **Smaller blast radius.** Direction A is a single new packlet in `ts-json-base` with no changes to existing exports. Direction B requires reflection retrofits across the most-imported packlet in the monorepo (`ts-utils/conversion`).
2. **Schema is the contract.** For LLM tool use, the JSON Schema is what the LLM provider receives — it *is* the source of truth in the deployment graph. The Converter exists to make the model's reply ergonomic in TypeScript. Letting the contract drive the runtime artifact aligns with how the system actually composes.
3. **Aligns with how consumers actually write LLM tools.** A 5-tool agent ships 5 JSON Schemas the model sees and 5 typed handlers. The schema is shared with the model (and may be hand-tuned for prompt-engineering reasons — e.g. tighter `description` strings); the Converter is purely internal validation. Letting the schema author drive both keeps the prompt-tuning loop tight.
4. **The "single declaration" win is real.** A 3-field schema becomes one declaration; today it would be one schema + one converter + one drift test. The convenience is meaningful at scale (10+ tools).
5. **The fgv combinator surface stays as designed.** No reflection retrofit on `arrayOf` / `recordOf` / `oneOf` / `tuple`. Established-surface stability obligations honored.

#### Why "after Phase C" and not "alongside Phase C"

- Phase C of `ai-assist-client-tools` can ship today with the recommended `IAiClientToolConfig.parametersSchema: JsonObject` shape. The shape is *correct* whether or not `JsonSchema.toConverter` exists.
- Direction A is a **convenience** layered on top of that surface, not a precondition for it. Consumers who want stronger runtime typing can adopt `JsonSchema.toConverter<T>` once it ships; consumers who are happy parsing `JsonObject` in their callback keep working unchanged.
- Trying to land Direction A *alongside* Phase C pushes the spike's recommendation onto Phase C's critical path. Phase C is already a substantial stream (per the design.md §4.2 sub-phase sketch); adding a new ts-json-base packlet to its scope adds risk without unblocking anything.
- A consumer building tools today with the status-quo pattern (schema + converter + drift test) can migrate trivially to `JsonSchema.toConverter` later: drop the hand-written converter, replace with the generated one. **No deprecation churn.**

#### Sequencing

| Stream | Work | Timing |
|---|---|---|
| `ai-assist-client-tools` Phase B / C | Ships `IAiClientToolConfig.parametersSchema: JsonObject` and the round-trip orchestrator. Consumers author JSON Schema directly + their own converter where they want runtime typing. | Per existing plan; not affected by this spike. |
| `json-schema-converter-alignment` follow-on (if commissioned) | New packlet `libraries/ts-json-base/src/packlets/json-schema/`: `LlmToolJsonSchema` brand, `llmToolJsonSchema` schema validator, `toConverter<T>(schema)` factory. Tests. Public-API exports. | Lands after Phase C of `ai-assist-client-tools` is in `release`. Independent stream — no cross-stream dependency on `ai-assist-client-tools` once Phase C is in. |
| Follow-on consumer adoption | Existing tools rewrite their hand-written converters as `JsonSchema.toConverter` calls. Pure simplification. | Opportunistic; not blocking. |

### 4.2 Scope sketch for the follow-on stream

**Package surface touched:** `@fgv/ts-json-base` only. New packlet; no edits to existing packlets.

**Files (estimated):**

```
libraries/ts-json-base/src/packlets/json-schema/
├── index.ts                              # public re-exports (~30 lines)
├── llmToolJsonSchema.ts                  # branded type + schema-of-schemas validator (~150 lines)
├── toConverter.ts                        # the Schema → Converter recursion (~200 lines)
└── test/                                 # under test/unit/packlets/json-schema/ at the package root
    ├── llmToolJsonSchema.test.ts         # ~200 lines
    └── toConverter.test.ts               # ~250 lines
libraries/ts-json-base/src/index.ts       # one new namespace re-export
```

**Blast radius:** contained — one new packlet, one new top-level namespace (`JsonSchema`), no edits to existing public exports.

**Acceptance criteria for the follow-on:**

- `JsonSchema.toConverter(schema)` succeeds for any schema in the LLM-tool-use subset and fails with a clear message for any feature outside it (`$ref`, `oneOf`/`anyOf`/`allOf`, `pattern`, custom `format`).
- The generated Converter returns `Result<JsonObject>` by default; `<T>` overload narrows the type-level result without changing runtime behavior.
- `LlmToolJsonSchema` brand prevents callers from accidentally passing an arbitrary `JsonObject` as a tool schema (catches "I authored a config schema not a tool schema" mistakes at the call site).
- 100% coverage; standard rush gates pass.
- Integration: at least one sample tool in the `ai-assist` testbed migrated to `JsonSchema.toConverter` as a smoke test.

**Estimated effort:** ~1 implementing-agent stream cycle (~600–900 lines total). Single PR.

### 4.3 What this does *not* deliver

- It does not handle arbitrary JSON Schema (no `$ref` resolution, no compositional schemas). The brief explicitly scopes these out, and the brand prevents misuse.
- It does not infer `T` from the schema. Consumers either accept `JsonObject` or supply `T` as a hint. `JSONSchemaType<T>`-style static cross-check is a possible future addition, separately commissioned.
- It does not add `toJsonSchema()` to the Converter surface. Direction B is left on the table as a possible future expansion if a strong use case emerges *outside* LLM tool use (e.g. publishing fgv-Converter-described shapes to OpenAPI). For LLM tool use specifically, Direction A is sufficient.

### 4.4 If Erik wants to ship Direction A alongside Phase C

The spike is not blocking either way, but if shipping aligned is a goal:

- The new packlet has no dependency on `ai-assist` — it can land independently in a `ts-json-base` PR before or in parallel with Phase C of `ai-assist-client-tools`.
- Phase C of `ai-assist-client-tools` would adopt `JsonSchema.toConverter` in its testbed sample tools as documentation rather than as a hard dependency.
- The sequencing risk is just that the follow-on stream's PR + Phase C's PR both want to land near the same alpha; the orchestrator can decide whether that risk is worth eating.

---

## Anti-recommendations (explicitly *not* recommending)

- **Don't add `toJsonSchema()` to the `Converter<T>` interface at this time.** Direction B's coverage matrix has too many opaque combinators; the surface change is broader than the value, and consumers who currently write `.generic` or `.transform` cannot participate. Defer until a concrete use case beyond LLM-tool-use forces the question.
- **Don't generate `T` from JSON Schema via TypeScript conditional types.** TypeBox-style `Type.Static<typeof S>` is impressive but is a large, separable type-system project. The pragmatic AJV-style "consumer supplies `T` as a hint" is sufficient for LLM-tool-use and skips a multi-week type-system spike.
- **Don't ship a more permissive `JsonSchema.toConverter` that accepts arbitrary draft-07 / 2020-12 schemas.** The branded `LlmToolJsonSchema` input type is load-bearing: it forces the consumer to consciously declare "this is an LLM tool schema, conservative subset", and the factory rejects out-of-scope features loudly rather than silently producing a wrong validator. A "be permissive, do the best we can" implementation would be a bug farm.
- **Don't redesign the Converter API.** Out of scope per the brief. Direction A composes existing primitives; no API change.

---

## Open question to surface to the orchestrator

None blocking. One advisory note:

- The `Converters.number` accepts numeric strings (`'42'` → `42`); `JsonSchema.toConverter` for `{ type: 'number' }` would inherit this behavior. This is technically *more* permissive than the schema strictly allows. For LLM tool use it's harmless (LLMs return numbers as numbers in JSON). For other future use cases (e.g. validating REST request bodies) it could be unexpected. Suggest a `JsonSchema.toConverter(schema, { strictTypes: true })` option in the follow-on stream's design phase if this surfaces as a concern — but defer the decision to that stream.

---

## Appendix: sample consumer code (illustrative, for the recommendation)

What a tool author would write *today* (status quo / Phase C as designed):

```typescript
// Phase C as currently designed in ai-assist-client-tools
const weatherSchema: JsonObject = {
  type: 'object',
  properties: {
    city: { type: 'string', description: 'City name' },
    units: { type: 'string', enum: ['metric', 'imperial'] }
  },
  required: ['city'],
  additionalProperties: false
};

interface IWeatherArgs { city: string; units?: 'metric' | 'imperial' }

const weatherArgsConverter = Converters.strictObject<IWeatherArgs>({
  city: Converters.string,
  units: Converters.enumeratedValue(['metric', 'imperial'] as const).optional()
});

const weatherTool: IAiClientTool = {
  config: { type: 'client_tool', name: 'getWeather', description: '...', parametersSchema: weatherSchema },
  callback: async (_name, args) => {
    return weatherArgsConverter.convert(args)
      .onSuccess((validated) => succeed(JSON.stringify(getForecast(validated))));
  }
};

// + drift test (see §3.3)
```

What the same author would write *after* the Direction A follow-on ships:

```typescript
const weatherSchema = JsonSchema.llmToolJsonSchema.convert({
  type: 'object',
  properties: {
    city: { type: 'string', description: 'City name' },
    units: { type: 'string', enum: ['metric', 'imperial'] }
  },
  required: ['city'],
  additionalProperties: false
}).orThrow();

interface IWeatherArgs { city: string; units?: 'metric' | 'imperial' }

const weatherArgsConverter = JsonSchema.toConverter<IWeatherArgs>(weatherSchema).orThrow();

const weatherTool: IAiClientTool = {
  config: { type: 'client_tool', name: 'getWeather', description: '...', parametersSchema: weatherSchema },
  callback: async (_name, args) => {
    return weatherArgsConverter.convert(args)
      .onSuccess((validated) => succeed(JSON.stringify(getForecast(validated))));
  }
};

// No drift test needed — single source.
```

The diff is small but real: one declaration instead of two, no drift test. At 10+ tools, the cumulative savings are meaningful; at 1–2 tools, the status quo is fine.
