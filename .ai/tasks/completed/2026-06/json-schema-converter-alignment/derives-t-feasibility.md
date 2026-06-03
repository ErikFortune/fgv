# Feasibility: `json-schema-derives-T` (TypeBox-style)

**Status:** complete
**Author:** senior-developer (phase-2 sub-spike)
**Date:** 2026-06-02
**Companion docs:** [derives-t-feasibility-brief.md](./derives-t-feasibility-brief.md), [state.md](./state.md), [research.md](./research.md)

---

## §Verdict

**Feasible — tractable, no phantom-type gymnastics, implementation is straightforward.**

Schema-derives-T for the LLM-tool JSON Schema subset is cleanly implementable with a small set of factory functions and a recursive `Static<S>` mapped type. The phantom-tag pattern requires no advanced TS tricks beyond what the fgv codebase already uses (branded types, mapped types). The `object` / optional-field interaction is the only non-trivial mapped-type case, and it has a well-understood solution using TS's key-remapping and conditional types. Depth concerns are not a real risk for the 2–3 level nesting the LLM subset uses in practice. The fgv `Converter<T>` surface accepts a derived `T` with no retrofit required — `Converters.object` is already generic over `T`; the adapter simply passes `Static<typeof schema>` as `T` and that resolves at the call site. The combinator surface needed is 7 factories, well within scope. Recommend commissioning the alignment stream.

---

## §Part A — Type-level mechanics

### A.1 Phantom-tag pattern

TypeBox's mechanism is straightforward: every schema node is a plain JavaScript value that also carries a phantom `static` property at the type level (not present at runtime). `Static<S>` is simply `S['static']` — a property access on the type parameter. The phantom property is never emitted to JavaScript but TypeScript sees it during type-checking.

For the LLM subset, a minimal fgv variant needs these types:

```typescript
// Phantom marker — a unique symbol prevents accidental duck-typing
declare const _phantom: unique symbol;

// Base schema node. Every factory returns something extending this.
interface ILlmSchema<T> {
  readonly [_phantom]: T;    // phantom — exists only in the type system
  readonly _type: string;    // discriminant for the adapter's runtime switch
}

// Static<S> — extract the phantom type from any schema node
type Static<S extends ILlmSchema<unknown>> = S extends ILlmSchema<infer T> ? T : never;
```

Runtime objects returned by factories carry `_type` (a real string field) but no `[_phantom]` field — it is declared only in the interface so TypeScript tracks it during type-checking without emitting it.

### A.2 Leaf factories

Each leaf factory returns a tagged value that carries a concrete `T` in the phantom slot:

```typescript
interface ILlmStringSchema extends ILlmSchema<string> { _type: 'string'; enum?: string[] }
interface ILlmNumberSchema extends ILlmSchema<number> { _type: 'number' | 'integer' }
interface ILlmBooleanSchema extends ILlmSchema<boolean> { _type: 'boolean' }

function string(opts?: { description?: string }): ILlmStringSchema
function number(opts?: { description?: string }): ILlmNumberSchema
function integer(opts?: { description?: string }): ILlmNumberSchema
function boolean(opts?: { description?: string }): ILlmBooleanSchema
function enumOf<T extends string>(values: readonly T[], opts?: { description?: string }):
  ILlmSchema<T>
```

`Static<ReturnType<typeof string>>` = `string`. `Static<ReturnType<typeof enumOf<'a'|'b'>>>` = `'a' | 'b'`. These are simple property-access resolutions — no recursive unfold, no conditional-type depth penalty.

### A.3 Optional wrapper

TypeBox's optional handling: a property wrapped in `Optional()` gains an extra marker in the schema node's type that the `object` factory's `Static<>` reads to decide which properties get `?:`.

```typescript
declare const _optional: unique symbol;

interface ILlmOptional<S extends ILlmSchema<unknown>> extends ILlmSchema<Static<S> | undefined> {
  readonly [_optional]: true;   // phantom marker
  readonly _type: 'optional';
  readonly _schema: S;          // real field — adapter needs it at runtime
}

function optional<S extends ILlmSchema<unknown>>(schema: S): ILlmOptional<S>
```

The `_schema` field is a *real* runtime field (needed by the adapter to recurse). The `[_optional]` symbol is only type-level.

### A.4 Object factory and the required/optional split

This is the trickiest mapped-type case. The `object` factory receives a record of property schemas, some of which may be `ILlmOptional<...>`. It must produce a type where optional properties carry `?:` and required ones don't.

```typescript
type ILlmProperties = Record<string, ILlmSchema<unknown>>;

// Extract keys where the schema is optional
type OptionalKeys<P extends ILlmProperties> = {
  [K in keyof P]: P[K] extends ILlmOptional<infer _> ? K : never
}[keyof P];

type RequiredKeys<P extends ILlmProperties> = Exclude<keyof P, OptionalKeys<P>>;

// The derived object type
type ObjectStatic<P extends ILlmProperties> =
  { [K in RequiredKeys<P>]: Static<P[K]> } &
  { [K in OptionalKeys<P>]?: Static<P[K]> };

interface ILlmObjectSchema<P extends ILlmProperties> extends ILlmSchema<ObjectStatic<P>> {
  _type: 'object';
  _properties: P;                         // real field for adapter
  additionalProperties?: false;
  description?: string;
}

function object<P extends ILlmProperties>(
  properties: P,
  opts?: { additionalProperties?: false; description?: string }
): ILlmObjectSchema<P>
```

**Round-trip verification** (the key example from the brief):

```typescript
const MemorySchema = object({
  query: string(),
  limit: optional(number()),
});
type Memory = Static<typeof MemorySchema>;
// Memory = { query: string } & { limit?: number }
//        = { query: string; limit?: number }       ← correct
```

The `ObjectStatic<P>` mapped type resolves in one pass — no recursion on `ObjectStatic` itself — so there is no depth-accumulation penalty. TypeScript eagerly computes the intersection when all four types (`RequiredKeys`, `OptionalKeys`, required sub-map, optional sub-map) are known, which they are since `P` is concrete at the call site.

### A.5 Array factory

```typescript
interface ILlmArraySchema<S extends ILlmSchema<unknown>> extends ILlmSchema<Array<Static<S>>> {
  _type: 'array';
  _items: S;    // real field for adapter
  description?: string;
}

function array<S extends ILlmSchema<unknown>>(items: S, opts?: { description?: string }):
  ILlmArraySchema<S>
```

`Static<ILlmArraySchema<S>>` = `Array<Static<S>>` — one level of recursion, fully eager.

### A.6 Nested example with full resolution

```typescript
const ToolSchema = object({
  action: enumOf(['run', 'stop'] as const),
  config: object({
    timeout: optional(integer()),
    tags: array(string()),
  }),
});

type ToolArgs = Static<typeof ToolSchema>;
// = { action: 'run' | 'stop';
//     config: { timeout?: number; tags: string[] } }
```

Resolution path:
1. `enumOf(['run','stop'] as const)` → `ILlmSchema<'run'|'stop'>`
2. `optional(integer())` → `ILlmOptional<ILlmNumberSchema>` → carries `Static = number|undefined`
3. `array(string())` → `ILlmArraySchema<ILlmStringSchema>` → carries `Static = string[]`
4. Inner `object({timeout, tags})` → `ObjectStatic = { timeout?: number; tags: string[] }`
5. Outer `object({action, config})` → `ObjectStatic = { action: 'run'|'stop'; config: { timeout?: number; tags: string[] } }`

At 2 levels of nesting the resolution is 5 discrete property lookups. At 3 levels it is 7. The TypeBox performance problem (documented in issue threads) manifests at 10+ levels of nested objects with union members. The LLM tool subset rarely goes beyond 2 levels; 3 is the practical ceiling. **Depth is not a real concern for this scope.**

### A.7 Compile-time error quality

TypeBox's notoriously cryptic errors stem from its large combinator surface (40+ types) and heavily-distributed conditional types. The fgv variant has 7 factories with narrow, simple signatures. Passing a primitive instead of a schema:

```typescript
object({ x: 5 })  // TS error: Type 'number' is not assignable to type 'ILlmSchema<unknown>'
```

The error names the failing parameter and the expected interface — readable. Mismatched optionality (calling `optional(5)`) gives:
```
Argument of type 'number' is not assignable to parameter of type 'ILlmSchema<unknown>'
```
Also readable. The narrow surface avoids the distribution explosion that makes TypeBox errors hard to read.

### A.8 `fromJson` parse path (phantom reconstruction)

When a raw `JsonObject` arrives at the MCP boundary (no factory call, no phantom tags), it must be parsed into the typed schema value. `fromJson` is a runtime parse; its return type cannot carry a phantom `T` (since `T` is unknown from a raw JSON object). Two options:

**Option 1 — `fromJson` returns `ILlmSchema<JsonObject>` (opaque type).** The parsed schema can be passed to `toConverter` which returns `Converter<JsonObject>`. The consumer gets runtime validation but no compile-time `T`. This is the right behavior: an MCP-discovered schema has no statically-known `T`.

**Option 2 — `fromJson` is not in scope for the LLM-tool authoring use case.** MCP consumers parse raw JSON Schema into a typed schema value for validation purposes, not for type-derivation. `toConverter(rawSchema)` where `rawSchema: JsonObject` (not `ILlmObjectSchema<P>`) returns `Converter<JsonObject>`, not `Converter<Static<typeof rawSchema>>`. This is fine — there is no static type to derive.

The recommendation is Option 2: `fromJson(raw: JsonObject)` returns `Result<ILlmSchema<JsonObject>>` — the phantom `T` is pinned to `JsonObject`, which is the honest type when the schema arrives at runtime. `toConverter` is overloaded to accept either a typed schema value (derives `T`) or the opaque `ILlmSchema<JsonObject>` (returns `Converter<JsonObject>`). No special `fromJson` is needed to reconstruct phantom tags — they cannot be reconstructed from a runtime value.

---

## §Part B — Composition with fgv `Converter<T>`

### B.1 Adapter shape

The adapter is a recursive descent over the schema value's `_type` discriminant. No changes to existing fgv primitives are needed — it purely composes them.

```typescript
// toConverter.ts (new packlet)

function toConverter<S extends ILlmSchema<unknown>>(
  schema: S
): Result<Converter<Static<S>>> {
  switch (schema._type) {
    case 'string':
      return succeed(Converters.string as Converter<Static<S>>);

    case 'number':
    case 'integer': {
      const base = Converters.number;
      const c = schema._type === 'integer'
        ? base.withConstraint((n) => Number.isInteger(n) || fail(`${n}: not an integer`))
        : base;
      return succeed(c as unknown as Converter<Static<S>>);
    }

    case 'boolean':
      return succeed(Converters.boolean as Converter<Static<S>>);

    case 'enum':
      return succeed(Converters.enumeratedValue(schema.enum) as unknown as Converter<Static<S>>);

    case 'array': {
      const arraySchema = schema as ILlmArraySchema<ILlmSchema<unknown>>;
      return toConverter(arraySchema._items)
        .onSuccess((inner) => succeed(Converters.arrayOf(inner) as unknown as Converter<Static<S>>));
    }

    case 'optional': {
      const optSchema = schema as ILlmOptional<ILlmSchema<unknown>>;
      return toConverter(optSchema._schema)
        .onSuccess((inner) => succeed(inner.optional() as unknown as Converter<Static<S>>));
    }

    case 'object': {
      const objSchema = schema as ILlmObjectSchema<ILlmProperties>;
      return _buildObjectConverter(objSchema) as Result<Converter<Static<S>>>;
    }

    default:
      return fail(`unsupported schema type: ${(schema as { _type: string })._type}`);
  }
}
```

**Type-flow through the adapter:** The `as unknown as Converter<Static<S>>` casts inside the switch arms are correctness-preserving. The outer function signature promises `Converter<Static<S>>`; inside each arm, `S` is narrowed to a concrete subtype (e.g. `ILlmStringSchema`) so `Static<S>` = `string`, and `Converters.string` is `Converter<string>` — the cast merely crosses the gap between the concrete arm type and the generic return type, and is structurally correct. This is the same cast pattern used throughout the existing fgv Converter factories. There are no loose `as any` casts.

### B.2 Object converter construction

```typescript
function _buildObjectConverter<P extends ILlmProperties>(
  schema: ILlmObjectSchema<P>
): Result<Converter<ObjectStatic<P>>> {
  const fieldResults: Record<string, Result<Converter<unknown>>> = {};
  for (const [key, propSchema] of Object.entries(schema._properties)) {
    fieldResults[key] = toConverter(propSchema);
  }
  const errors: string[] = [];
  const fields: Record<string, Converter<unknown>> = {};
  const optionalKeys: string[] = [];

  for (const [key, result] of Object.entries(fieldResults)) {
    if (result.isFailure()) {
      errors.push(`property ${key}: ${result.message}`);
    } else {
      fields[key] = result.value;
      if (schema._properties[key]._type === 'optional') {
        optionalKeys.push(key);
      }
    }
  }
  if (errors.length > 0) {
    return fail(errors.join('\n'));
  }

  const strict = schema.additionalProperties === false;
  const converterFn = strict ? Converters.strictObject : Converters.object;
  return succeed(
    converterFn(fields as FieldConverters<ObjectStatic<P>>, { optionalFields: optionalKeys })
  );
}
```

The `fields as FieldConverters<ObjectStatic<P>>` cast is load-bearing but correct: by construction, every key in `fields` holds a `Converter<T>` where `T = Static<P[key]>`, which is exactly what `FieldConverters<ObjectStatic<P>>` requires. The type parameter `ObjectStatic<P>` was computed at compile time from the factory call; the runtime converter assembly mirrors it exactly.

### B.3 Wire-format emission (`toJson`)

`toJson` strips phantom fields (they don't exist at runtime anyway) and emits standard JSON Schema:

```typescript
function toJson(schema: ILlmSchema<unknown>): JsonObject {
  switch (schema._type) {
    case 'string':    return { type: 'string', ...(schema.description && { description: schema.description }) };
    case 'number':    return { type: 'number', ...(schema.description && { description: schema.description }) };
    case 'integer':   return { type: 'integer', ...(schema.description && { description: schema.description }) };
    case 'boolean':   return { type: 'boolean', ...(schema.description && { description: schema.description }) };
    case 'enum':      return { type: 'string', enum: schema.enum };
    case 'optional':  return toJson(schema._schema);  // optionality is a property-level concern in JSON Schema
    case 'array':     return { type: 'array', items: toJson(schema._items) };
    case 'object': {
      const properties: Record<string, JsonObject> = {};
      const required: string[] = [];
      for (const [key, propSchema] of Object.entries(schema._properties)) {
        const isOpt = propSchema._type === 'optional';
        const inner = isOpt ? (propSchema as ILlmOptional<ILlmSchema<unknown>>)._schema : propSchema;
        properties[key] = toJson(inner);
        if (!isOpt) required.push(key);
      }
      return {
        type: 'object',
        properties,
        ...(required.length > 0 && { required }),
        ...(schema.additionalProperties === false && { additionalProperties: false }),
        ...(schema.description && { description: schema.description }),
      };
    }
    default: return {};
  }
}
```

The key point: `optional` wrappers are invisible in the emitted JSON Schema — they appear as absent entries in `required` on the parent object, which is the correct JSON Schema representation.

### B.4 Compatibility with `IAiClientToolConfig.parametersSchema: JsonObject`

The `ai-assist-client-tools` design (referenced in the brief) currently uses `parametersSchema: JsonObject`. Two interop shapes are possible:

**Option (a) — Overloaded `toConverter` + `toJson` for consumption at the call site.** Consumers with a typed schema value call `toJson(schema)` to get the `JsonObject` for `parametersSchema`, and `toConverter(schema)` to get the typed `Converter`. Consumers with a raw `JsonObject` (e.g. MCP-discovered) call `toConverter(raw)` which returns `Converter<JsonObject>`.

**Option (b) — Schema value implements a `toJSON()` method so it is structurally serializable as `JsonObject`.** This is appealing but the schema value's `_type` and `_properties` fields would appear in the serialized form, and JSON Schema consumers would see them as unknown fields — a problem.

**Recommendation: Option (a).** The `parametersSchema: JsonObject` field stays as-is in `IAiClientToolConfig`. Consumers with typed schemas call `toJson(schema)` explicitly. This is two lines (one schema construction, one `toJson` call) and is explicit. It avoids a structural mismatch between the schema value's internal representation and the wire JSON Schema. No change to `IAiClientToolConfig` is required.

If Erik later wants to merge the types, an alternative is `parametersSchema: ILlmSchema<unknown> | JsonObject` with overloaded handling inside the tool infrastructure — but that is a Phase C concern, not a precondition.

### B.5 `Converters.number` permissiveness

As noted in `research.md` §1.5, `Converters.number` accepts numeric strings (`'42'` → `42`). The derived Converter for `number` / `integer` inherits this behavior. For the LLM-tool use case this is benign — LLMs emit JSON numbers as numbers. For other uses (REST body validation), the behavior could be surprising.

This is a Phase-C design question: add a `{ strict?: boolean }` option to `toConverter` that wraps numeric converters with a `.withConstraint((n, v) => typeof v === 'number' || fail('not a number'))` guard. Deferring to the alignment stream.

---

## §Part C — Cost, sequencing, stop conditions

### C.1 Implementation scope

The implementation lives in a single new packlet in `ts-json-base`. No touch to existing exports.

**Estimated file layout:**

```
libraries/ts-json-base/src/packlets/json-schema/
├── index.ts               # re-exports (~25 lines)
├── types.ts               # ILlmSchema, ILlmOptional, ILlmObjectSchema, etc. (~120 lines)
├── factories.ts           # string(), number(), integer(), boolean(), enumOf(),
│                          # optional(), array(), object() (~100 lines)
├── toConverter.ts         # adapter recursion (~120 lines)
├── toJson.ts              # wire-format emission (~60 lines)
└── fromJson.ts            # parse from raw JsonObject → ILlmSchema<JsonObject> (~80 lines)

Total implementation: ~505 lines

libraries/ts-json-base/src/test/unit/packlets/json-schema/
├── types.test.ts          # phantom type round-trips at the type level (~80 lines)
├── factories.test.ts      # factory value shapes + Static<> spot-checks (~100 lines)
├── toConverter.test.ts    # each leaf + object + optional + array + nested (~220 lines)
├── toJson.test.ts         # wire-format correctness (~120 lines)
└── fromJson.test.ts       # parse + reject out-of-subset features (~100 lines)

Total tests: ~620 lines
libraries/ts-json-base/src/index.ts  # one new namespace export
```

**Comparison to phase-1 AJV-style estimate (~300–500 lines impl + 300–400 lines tests):** The derives-T version is ~200 lines larger across both dimensions. The additional cost is the `types.ts` phantom-type definitions and `fromJson.ts`. Neither is complex; the delta is bookkeeping, not difficulty.

**Blast radius:** `@fgv/ts-json-base` only. No touch to `ts-utils`, no new external dependencies. The new packlet is additive; existing packlets (`converters`, `validators`, `file-tree`, `json-file`) are untouched.

### C.2 MCP fit

MCP-discovered schemas arrive as raw `JsonObject`. The `fromJson(raw)` function:
1. Validates the raw object is within the LLM subset (fails with a clear error if `$ref`, `oneOf`, `anyOf`, `allOf`, `pattern`, or unsupported `format` appear).
2. Recursively reconstructs schema nodes tagged as `ILlmSchema<JsonObject>` (the opaque phantom type — `T` is `JsonObject` for all nodes since the actual type is unknown at the MCP boundary).
3. The resulting `ILlmSchema<JsonObject>` can be passed to `toConverter` which returns `Converter<JsonObject>` — runtime validation is real, just not statically typed to a narrower `T`.

This is the correct behavior for MCP: runtime validation without a derived static type. Consumers who want a stronger type must author the schema via factories (the authoring-time story).

**Out-of-subset failure mode:** `fromJson` returns `fail('unsupported feature: $ref at /properties/foo')` — explicit, actionable. Consumers know exactly what to remove or rewrite.

### C.3 Sequencing recommendation

The brief asks whether `ai-assist-client-tools` Phase B/C should hold for this work. The answer is **hold Phase C implementation for the alignment stream, but not Phase B**.

- **Phase B** (contract design, `IAiClientToolConfig` interface) does not depend on the schema type system. The recommended `parametersSchema: JsonObject` shape is correct whether or not the typed schema factories exist. Phase B should proceed as planned.
- **Phase C** (implementation of the tool invocation pipeline) would benefit from the typed schema surface being available — specifically, `fromJson` for MCP-discovered tools and `toConverter` for runtime arg validation. If Phase C lands without it, consumers use raw `JsonObject` and hand-roll converters, which is the status-quo direction and fully valid.
- The alignment stream (`json-schema-derives-T`) can run in parallel with Phase C or slightly ahead. It is a single-PR, contained new packlet. If it lands before Phase C closes, Phase C can adopt the typed schema factories in its testbed as a validation smoke-test. If it doesn't, Phase C proceeds with `JsonObject` and migrates later.

**Erik's stated inclination:** "I'm inclined to add that now and hold the AI tool work until it's ready." This is reasonable given the scoped estimate (~500 lines impl + ~620 lines tests, single packlet). The alignment stream is a 1–2 day implementing-agent cycle. Holding Phase C for it adds ~2–3 days of schedule risk in exchange for cleaner initial consumer code. Erik's call.

### C.4 Stop conditions

The following scenarios would flip the verdict from feasible to infeasible or borderline:

| Scenario | Likelihood | Impact | Outcome |
|---|---|---|---|
| `ObjectStatic<P>` mapped type causes TS perf cliff for realistic schemas | Very low — depth ≤3, no recursion on `ObjectStatic` itself | High | Fallback: Direction C with drift-detection tests per `research.md §3.3` |
| Optional/required interaction requires workaround visible to consumers | Low — the `OptionalKeys` / `RequiredKeys` split is well-precedented in TS utility types | Medium | Simplify: `optional()` marks properties via a naming convention (`key?: ...`) rather than a phantom marker — slightly less ergonomic authoring but same runtime behavior |
| `as unknown as Converter<Static<S>>` casts in the adapter are found to be unsound (e.g. TypeScript widens `Static<S>` in a way that breaks the cast) | Low — `Static<S>` is computed at the call site before the cast; narrowing is one-directional | High | Surface to orchestrator; would require explicit intermediate types per arm rather than a generic cast |
| Combinator surface bloats past 10 entries to cover realistic LLM schemas | Unlikely given the subset definition; `enumOf`, `string`, `number`, `integer`, `boolean`, `array`, `optional`, `object` = 8 | Low | Accepted; 10 is still well within a manageable surface |
| `fromJson` required for MCP cannot reliably reconstruct phantom types | Not applicable — `fromJson` intentionally pins `T = JsonObject`; no phantom reconstruction is attempted | — | By design, not a stop condition |

None of these stop conditions are likely to fire for the defined scope. If one does fire during implementation, the fallback is **status-quo Direction C** with the drift-detection test pattern from `research.md §3.3`. The AJV-style path remains off the table per Erik's review.

---

## §Closing recommendation

Schema-derives-T for the LLM-tool JSON Schema subset is **feasible**. The phantom-tag machinery is simple (7 factories, a single recursive `Static<S>` property-access type, one mapped type for optional/required splitting), the fgv `Converter<T>` surface needs no retrofit, and the blast radius is a single new packlet in `ts-json-base`. The implementation is ~500 lines with ~620 lines of tests — modestly larger than the AJV-style estimate but delivering meaningfully stronger type safety (derived, not asserted). The next step is an alignment stream commission once Erik reviews this verdict. If the verdict is accepted, recommend the orchestrator commissions `json-schema-derives-T` as an independent stream against `ts-json-base` with the phase-1 follow-on scope shape from `research.md §4.2` updated to reflect the phantom-type design described here.

---

## Appendix: union type approach note

An alternative to the `[_phantom]: unique symbol` approach is to store the phantom in a regular (runtime) field that is structurally present but semantically meaningless, like `_phantom: undefined`. This avoids unique-symbol module-boundary issues (the TypeBox issue #679 cited in the web search) at the cost of a runtime no-op field. For the fgv use case, where schemas are constructed and immediately passed to `toConverter` within the same package, module-boundary unique-symbol issues are unlikely. The brief directs toward TypeBox-style; the unique-symbol approach is cleaner and preferred. If module-boundary friction surfaces in practice, the `_phantom: undefined` fallback is a 5-line change.

---

*Sources consulted for TypeBox mechanism:*
- [TypeBox GitHub (sinclairzx81/typebox)](https://github.com/sinclairzx81/typebox)
- [TypeBox npm package (@sinclair/typebox)](https://www.npmjs.com/package/@sinclair/typebox)
- [TypeBox Optional/modifier discussion #835](https://github.com/sinclairzx81/typebox/discussions/835)
- [TypeBox unique-symbol module boundary issue #679](https://github.com/sinclairzx81/typebox/issues/679)
