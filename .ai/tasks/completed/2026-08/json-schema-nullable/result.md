# Result — `json-schema-nullable`

**Shipped 2026-08-23.** Additive on `@fgv/ts-json-base`, with the required follow-through in
`@fgv/ts-extras`.

## What shipped

`nullable: true` on every `JsonSchema` factory.

```ts
JsonSchema.object({
  statement: JsonSchema.string({ nullable: true }),   // required, and may be null
  polarity: JsonSchema.enumOf(['pos', 'neg'], { nullable: true })
});
```

- **`Static<S>` widens to `T | null`** — via one overload per factory. Pinned by compile-time
  assertions with a `@ts-expect-error` on the non-nullable slot, because a runtime-only check
  passes just as well against an un-widened `Static`.
- **The validator accepts `null`** in both `validate` and `convert`, through a single
  `_orNull` on the base class. One owner, so a node cannot accept `null` on one method and
  reject it on the other.
- **The wire schema emits the draft-07 union** `type: ['string', 'null']`.
- **A nullable `enumOf` carries `null` in `enum` too.** Not decoration: a reader consulting
  `enum` alone would otherwise reject the value `type` says is allowed.

## Why this unblocks a provider rather than polishing a surface

`mode: 'schema'` is **the only structured-output mode that reaches Anthropic at all** — its
only lane is forced tool use, and a forced tool needs a schema to force to. The consumer was
on `json-object`, which works on four providers and not that one.

The blocker was that OpenAI strict mode requires **every** property in `required`, so
`optional(...)` is unsendable there — `hasOptionalProperties` refuses it and routes through
`onUnsupported`. That left three routes and all three were worse than staying put; the third
(make everything required) meant faking absence with an empty-string sentinel the converter
maps back, which is **the schema-and-check drift the one-object design exists to remove,
reintroduced one layer down.**

Required-and-nullable is the fourth route, and it is the one OpenAI documents.

## The correction to the ask

The consumer asked us to verify their OpenAI premise rather than take it from them. It holds
— and turned up something they did not have: **OpenAI ignores the OpenAPI-style
`{"nullable": true}`**; only the union array works.

So the option's *name* and its *emission* are deliberately different dialects, and that is
now stated on the option's own TSDoc and pinned by a test asserting the emitted keys never
contain `nullable`. A reader who assumed the option emits its own name would have been wrong
in a way nothing here would have caught.

## Three consequences the ask did not have — all in our code

### 1. `fromJson` refused what `toJson` now emits

`fromJson` rejected union `type` arrays outright, and `callProxiedCompletion` reconstitutes
forwarded schemas with it. Shipping the emitter without the parser would have meant **our own
code refusing our own output**, breaking every nullable schema on the proxy path the consumer
already uses.

`fromJson` now admits exactly `[<type>, 'null']` (either order) and **still refuses every
other union** — widening to general unions would let the parser accept schemas the rest of the
subset cannot represent.

Pinned by a round-trip suite (emit → parse → emit, plus *"a reparsed node accepts null"*,
because emitting the right JSON is not the same as reconstituting the right validator).
**Watched failing first**: reverting the parser's acceptance turns exactly those 7 tests red
and leaves the 15 emission/validation tests green — which is what confirms the round-trip
suite pins the parser half specifically.

### 2. Gemini needs the other spelling, and the sanitizer passed `type` through verbatim

`toGeminiParameterSchema` now translates `type: [T, 'null']` → `type: T` + `nullable: true`,
and drops the `null` member from a nullable enum's values. **The two dialects are mutually
exclusive** — OpenAI ignores the keyword, Gemini rejects the union — so without this, a change
made to unblock the fifth provider would have broken one of the four that already work.

Also pinned in the negative: a **non**-nullable schema comes back untouched, and a general
union passes through unchanged rather than being assigned an invented meaning. Watched
failing: neutering the translation turns exactly those 4 tests red.

One fix covers both lanes — the Gemini structured-output wire uses the same sanitizer as the
client-tool path.

### 3. `enum` nullability is a different emission

Handled in the enum node rather than falling out of the shared `type` widening, and `fromJson`
requires the two halves to **agree**: a node nullable in `type` but not `enum` (or the
reverse) is describing two different schemas, and there is no honest way to pick.

## A fourth consequence, which only CI found — and the gate that found it

`@fgv/ts-extras-mcp`'s end-to-end suite pinned a tool whose `inputSchema` used
`type: ['string','null']` as **un-adaptable**, because `fromJson` used to reject it. Widening
the parser moved that tool from `skipped` to `tools` — which is **correct and desirable**: an
MCP server offering a nullable field is now usable. The fixture was updated (and a *general*
union kept in its place, so the still-out-of-subset case stays pinned), and the package got a
change file for the behaviour change even though none of its source moved.

**The instructive part is which gate caught it.** The acceptance criteria say a change to a
shared contract must pass a repo-wide `rush rebuild`, and it did — with zero warnings. But
`rush rebuild` **builds**; it does not run other packages' tests. Nothing about this
regression was a type error: `fromJson` kept its signature and every consumer kept compiling.
What changed was *what it returns for an input it used to reject* — a behavioural widening,
invisible to a build.

The repo-wide `rush test` is the gate that matches that shape, and CI is where it ran first.
It is now in this stream's gate list, and it is a general point: **`rush rebuild` covers a
widened *type*; only a repo-wide test run covers a widened *behaviour*.** The existing
criterion was written from a case where an interface member became required, which a build
does catch.

## Design: the flag, not a wrapper node

A `JsonSchema.nullable(inner)` wrapper would have been one generic function instead of seven
overloads, and sibling-consistent with `optional` and `array`. **It loses on one decisive
point:** the object factory builds `required` by reading `prop._type !== 'optional'`, so
`nullable(optional(x))` would present `_type: 'nullable'` to its parent, the key would land in
`required`, and the field would silently stop being optional — no error, no failing test,
wrong schema. The flag has no ordering to get wrong.

This is where the consumer and we agreed on the answer for different reasons; theirs was
"closer to how the subset is shaped", which is also true.

## What was not touched, per the consumer's own exclusions

- **`hasOptionalProperties` is unchanged.** Its docstring rejects "rewriting optional to
  required-and-nullable" because *the library* doing that silently would break the caller's
  validator. That objection **evaporates when the caller authors it**, since then the
  validator and the wire schema are the same object. This ask is not a reversal of that
  rejection — it is what makes keeping it affordable. There is now a test asserting a
  nullable-and-required schema reaches OpenAI as `'schema'`, directly beside the suite
  asserting an optional one degrades.
- **`onUnsupported` is unchanged.** Degrade-and-tell-me stays the default.
- **No schema inference from a `Converter`.** They talked themselves out of asking, correctly.

## Gates

| gate | result |
|---|---|
| `rushx build` / `lint` / `test` (`@fgv/ts-json-base`) | pass, **100%** coverage |
| `rushx build` / `lint` / `test` (`@fgv/ts-extras`) | pass, **100%** on both touched files |
| repo-wide `rush rebuild` | pass, zero warnings — **and insufficient here, see above** |
| repo-wide `rush test` | pass; caught a behavioural regression in `@fgv/ts-extras-mcp` a build could not |
| change files | all three packages |
| round-trip and Gemini-translation tests | **watched failing first** — 7 and 4 red respectively |

One pre-existing suite failure is unrelated and reproduces at `HEAD`: `mutableFsTree.test.ts`
→ *"returns permission-denied for read-only file"*, which fails when the suite runs as **root**
because `chmod 0444` does not stop root writing.

## A note on the lint warnings

Seven `@rushstack/no-new-null` warnings arrived with the `| null` annotations. They carry the
sanctioned inline disable **with a reason**, matching what `JsonPrimitive` in this package's
own `json` packlet already does and what the `openaiChat` streaming adapter does in
`ts-extras`: the rule's carve-out is "except when describing legacy APIs", and JSON `null` on
a provider wire is exactly that. This is the one class of rule where the repo's
"never disable to make lint pass" rule meets a case the rule itself excludes — worth naming
rather than leaving as seven bare directives.
