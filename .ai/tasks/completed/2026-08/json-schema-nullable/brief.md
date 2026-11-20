# Stream brief — `json-schema-nullable`

**Status: SHIPPED 🟢 — ask verified against source, external premise verified independently,
three consequences added that the ask did not have, all three implemented.**
Filed 2026-08-22 from a PersonAIlity ask. **Blocked on nothing but sequencing** — see below.
**Shape:** additive on `@fgv/ts-json-base`'s `json-schema-builder` packlet, with **required**
follow-through in `@fgv/ts-extras`' `ai-assist` packlet. Medium priority, and the consumer
says so themselves: nothing is broken, they are on `json-object` and it works on four
providers.

## The ask

A way to express **required-and-nullable** in the `JsonSchema` LLM-tool subset, so a field
can be present-but-null rather than absent. Either a `'null'` node usable in a union, or a
`nullable` flag on `ISchemaOptions` that emits `type: ['string', 'null']` and widens
`Static<S>` to `T | null`.

## Why it matters to them, in one line

`mode: 'schema'` is **the only structured-output mode that reaches Anthropic at all** — its
only lane is forced tool use and a forced tool needs a schema to force to. So this is not a
polish item on top of `json-object`; it is the difference between four providers and five.

## Verification — claim by claim, against `release`

| claim | verdict |
|---|---|
| `SchemaNodeType` has no `null` / `nullable` / union | ✅ `types.ts:30-37` — eight members, none of them |
| `ISchemaOptions` carries only `description` | ✅ `factories.ts:41-46` |
| so an absent-able field has exactly one spelling, `optional(...)` | ✅ |
| `hasOptionalProperties` then refuses that schema for the two OpenAI strict formats | ✅ `structuredOutput.ts:301`, gated on `isOpenAiStrictFormat` |
| …and routes it through `onUnsupported` rather than a 400 | ✅ `structuredOutput.ts:304-307` |
| Gemini and Anthropic have no all-required rule and are unaffected | ✅ — our own docstring says exactly this |
| OpenAI's documented idiom is to keep the key in `required` and make the type nullable | ✅ **verified independently**, and with a correction — see below |

**Every claim holds.** The consumer explicitly asked us to verify the OpenAI premise rather
than take it from them, which was the right instinct, and it turned up something.

### The correction: `nullable: true` is the *wrong* spelling for OpenAI

OpenAI strict mode wants the **union array** `{"type": ["string", "null"]}`. The
OpenAPI-style `{"type": "string", "nullable": true}` is **ignored** — it does not produce a
nullable field, and it fails silently rather than loudly.

The consumer's proposal is still correct: they asked for an option *named* `nullable` that
*emits* the union array. But the name and the emission are different dialects, and a reader
who assumes the option emits its own name will be wrong in a way no test in this repo would
catch. Name it deliberately, and say in the TSDoc what it emits.

## Three things the ask did not have

### 1. Our own `fromJson` rejects exactly what this would emit — and that breaks the proxy path

`fromJson.ts:441-442`:

```ts
if (Array.isArray(raw.type)) {
  return fail(`${path}: union 'type' arrays are not supported`);
}
```

`callProxiedCompletion` forwards `structuredOutput` with the schema in **draft-07 wire form**,
and the proxy reconstitutes it with `JsonSchema.fromJson(raw)`. So the moment `toJson()` can
emit `type: ['string','null']`, **our own reconstitution refuses our own emission** and every
nullable schema breaks over the proxy — the path this consumer already uses.

`fromJson` must learn the `[T, 'null']` shape in the same stream. Not a follow-up: shipping
the emitter without the parser ships a schema that cannot survive a round trip through our
own code.

### 2. Gemini needs the *other* spelling, and the sanitizer passes `type` through verbatim

`toGeminiParameterSchema` (`toolFormats.ts:228`) strips `additionalProperties` and `$schema`
and **recurses everything else unchanged**, so `type: ['string','null']` would reach Gemini
as-is. Gemini's `responseSchema` is an **OpenAPI 3.0** subset, where nullability is
`nullable: true` and a union `type` array is not valid.

So the two spellings are **mutually exclusive across the two providers**: OpenAI ignores
`nullable: true`, Gemini rejects the union array. The sanitizer has to translate, and this is
the whole reason the sanitizer exists — the same shape as the `additionalProperties` case it
already handles.

**Without this, adding nullable breaks Gemini, which works today.** That is the failure mode
to protect against: a change made to unblock the fifth provider that quietly costs one of the
four already working.

### 3. `enum` nullability is not the same emission

The union-array rewrite works for `string` / `number` / `integer` / `boolean` / `array` /
`object`. For an `enum` node the value list itself has to carry `null`
(`{"type": ["string","null"], "enum": ["a","b",null]}`), so `enumOf` needs its own handling
rather than falling out of a shared `type`-widening helper.

## Design — a flag, not a wrapper node, and the reason is a silent wrong answer

The wrapper (`JsonSchema.nullable(inner)`, a new `_type`) is tempting: one generic function
instead of an overload per factory, trivial typing (`ISchemaValidator<Static<S> | null>`), and
sibling-consistent with `optional` and `array`, which are both wrappers.

**It loses on one point, and the point is decisive.** The object factory decides `required` by
reading `prop._type !== 'optional'` (`factories.ts:350`, `:390`). So `nullable(optional(x))`
presents `_type: 'nullable'` to its parent, the key silently lands in `required`, and the
field stops being optional — **no error, no test failure, wrong schema.** A wrapper design
makes correctness depend on composition order in exactly the direction this surface exists to
prevent.

A `nullable?: boolean` on `ISchemaOptions` has no ordering to get wrong:
`optional(string({ nullable: true }))` is the only way to write it. The cost is one overload
per factory to widen `Static<S>` to `T | null`, which is mechanical.

**Recommend the flag** — which is what the consumer proposed, for a different reason than the
one they gave.

## Explicitly NOT in scope

Three exclusions the consumer named, all correct and all adopted:

- **No relaxation of `hasOptionalProperties`.** Its reasoning holds and its three rejected
  repairs are the right three to reject. **Note the subtlety** — that docstring rejects
  "rewriting optional to required-and-nullable" on the grounds that it *"changes what the
  model must emit … so the reply would no longer satisfy the caller's own validator"*. That
  objection is about the **library silently rewriting** a schema the caller authored as
  optional. It **evaporates when the caller authors nullable directly**, because then the
  validator and the wire schema are the same object and cannot disagree. This ask is not a
  reversal of that rejection — it is what makes the rejection affordable to keep.
- **No change to `onUnsupported`.** Degrade-and-tell-me stays the default; the required
  enforcement report is what makes it safe.
- **No schema inference from a `Converter`.** They considered asking and talked themselves
  out of it, correctly: a `Converter` is a parser, not a declaration, and deriving a schema
  from one is guessing.

## Sequencing

Do **not** start before **#654** merges. It is open on `@fgv/ts-agent-memory-sqlite-vec`, and
while the packages do not overlap, the publish tranche is the constraint, not the code.

*(Satisfied — #654 merged as `a50009f3` before this stream began.)*

## Gates

- [ ] `rushx build` / `lint` / `test` at 100% in `@fgv/ts-json-base` **and** `@fgv/ts-extras`
- [ ] **Repo-wide `rush rebuild`** — widens a published schema surface with several consumers
- [ ] Change files for **both** packages
- [ ] A round-trip test: `nullable` schema → `toJson()` → `fromJson()` → validates the same
      values. This is the one that pins consequence 1, and it must be seen to fail first
- [ ] A Gemini-sanitizer test asserting the union array becomes `nullable: true`, pinning
      consequence 2 — and one asserting a **non**-nullable schema is unchanged, so the
      translation cannot silently fire on everything
- [ ] `enumOf` nullability tested separately from the scalar factories (consequence 3)
- [ ] A test that a nullable-and-required schema passes `hasOptionalProperties` — the whole
      point of the ask, and the assertion that would catch a regression in either direction
- [ ] `Static<S>` widening verified at the type level, not just at runtime
- [ ] `LIBRARY_CAPABILITIES.md`: the `JsonSchema` entry and the structured-output decision
      shortcut both describe the subset's vocabulary and must name the new spelling
- [ ] Consumer note: confirmation, the `nullable: true` correction, and the three consequences
