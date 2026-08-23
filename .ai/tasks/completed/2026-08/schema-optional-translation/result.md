# Result — `schema-optional-translation`

**Shipped 2026-08-23.** Additive on `@fgv/ts-extras`; docs-only on `@fgv/ts-json-base`.

## What shipped

`ISchemaStructuredOutputRequest.adaptOptionalToNullable?: boolean`, defaulting off. When set, on a
format that requires every property to be `required`, an optional property **whose node already
admits `null`** is listed in `required` instead of the whole schema being refused.

```ts
JsonSchema.object({ start: JsonSchema.optional(JsonSchema.number({ nullable: true })) })
// wire, unadapted:  properties.start = {type:['number','null']},  required absent
// wire, adapted:    properties.start = {type:['number','null']},  required: ['start']
```

The node is untouched. **Only its membership in `required` changes.**

## We gave them the spelling they asked for and refused the semantics

The ask proposed `adaptOptionalToNullable?: boolean` documented as *"the caller is **asserting
something about its own validator**, which is the fact only the caller has."*

**It is not a fact only the caller has. It is written on the schema.** `OptionalSchemaValidator.toJson()`
delegates to its inner schema, so optionality lives *only* in the parent's `required` array. Measured
rather than reasoned about:

```
optional(string({nullable:true}))  wire {"type":["string","null"]}  {} OK  {b:null} OK  {b:'x'} OK
optional(string())                 wire {"type":"string"}           {} OK  {b:null} FAIL
```

So hoisting a nullable optional narrows the permitted replies from *absent-or-null-or-value* to
*null-or-value* — a strict **subset** of what the supplied schema already accepts. No reply the
emitted schema permits can fail the original.

The difference is not pedantic, because an assertion is **worse than inert**: a caller with
`optional(string())` could have set the boolean and received a wire schema their own validator
rejects at runtime — exactly the drift `hasOptionalProperties` was written to prevent. The proposed
flag makes the hazard *sayable*. Reading the condition off the schema makes it *unsayable*. Same
discipline as `resolveJsonOutput`'s runtime-evidenced `expectedKind`, and as `JsonSchema` itself.

Their underlying complaint was right and is fixed: they now author
`optional(number({ nullable: true }))`, which **states what their converter does** — it accepts
absent *and* `null`, which they measured — rather than what one provider demands. The provider
knowledge moves to `resolveStructuredOutput`, which is where they said it belonged.

## The verification is the original check, re-run

```ts
const strict = isOpenAiStrictFormat(format);
const adapt  = strict && request.adaptOptionalToNullable === true;
const raw    = adapt ? hoistNullableOptionals(schema.toJson()) : schema.toJson();
if (strict && hasOptionalProperties(raw)) { /* refuse exactly as before */ }
```

The rewrite only ever removes optionality that was safe to remove, so re-running the *existing*
guard on its output is the whole verification. **There is no second notion of correctness to keep in
sync** — a property that is genuinely not nullable survives the rewrite untouched, trips the guard,
and routes through `onUnsupported` as it always did. A partly-hoistable schema therefore degrades or
fails **whole**; it never sends a half-adapted schema.

## A defect the tests caught in our own implementation

The first implementation gated the hoist on the **flag alone**, not the format. The test asserting
the flag is *inert on Gemini* went red: it hoisted there too, narrowing a reply on a provider that
has no all-required rule and never needed it narrowed. Now gated on both.

Worth naming because it is the failure mode this whole stream is about, one level up: a rewrite
justified by one provider's constraint, applied where that constraint does not exist. The test
existed only because "the flag must be inert where the rule does not apply" was written into the
brief as a criterion rather than discovered afterwards.

## Tests

Eleven new tests, **all watched failing first**. Neutering `adapt` to `false` turned exactly three
red — the two hoist-behaviour tests and the adapt-specific error message — and left the other eight
green, which is the right partition: the safety-property test, the back-compat test, the
degrade-whole test and the Gemini-inert test all describe behaviour that must hold *without* the
feature.

The load-bearing one pins the safety argument directly rather than inferring it from the wire:

```ts
expect(hoistableSchema.validate({ a: 'x', b: null })).toSucceedWith({ a: 'x', b: null });
expect(optionalPropSchema.validate({ a: 'x', b: null })).toFail();   // the converse
```

`hoistNullableOptionals` is also tested directly for its recursion contract over malformed nodes
(`null`, primitives, arrays as property values). It is `@internal` and deliberately **not** added to
the packlet entry point — imported with the `@rushstack/packlets/mechanics` disable this repo already
uses in five other test files, rather than widening the public surface for a test.

## Gates

| gate | result |
|---|---|
| `rushx build` / `lint` / `test` (`@fgv/ts-extras`) | pass, **100%** all four metrics, 2773 tests |
| `rushx lint` / `test` (`@fgv/ts-json-base`) | pass, **100%**, 983/984 (see below) |
| `rushx fixlint` | run before the final commit |
| repo-wide `rush rebuild` | exit 0, **zero warnings** |
| repo-wide `rush test` | **blocked — see below**; every consuming package tested explicitly instead |
| change files | both packages |

Four `tsdoc/syntax` warnings arrived with the new docstring (a code span wrapped across a line with
braces in it) and were fixed, not suppressed — per the repo rule that a local warning is a CI failure.

## The repo-wide `rush test` gate is currently unavailable, and that is worth recording

The acceptance criteria promoted in #656 require a repo-wide `rush test` for a change that widens
what a function *accepts*. It cannot be satisfied as written: `@fgv/ts-json-base` fails one
pre-existing test when the suite runs as **root** (`mutableFsTree` → *"returns permission-denied for
read-only file"*; `chmod 0444` does not stop root writing), and Rush **blocks every dependent** of a
failed project. `@fgv/ts-extras` and all its consumers were skipped, so the green-looking gate
covered nothing that mattered.

Substituted an explicit run over every package consuming either changed surface —
`ts-extras`, `ts-extras-mcp`, `ts-extras-ollama`, `ts-agent-memory`, `ts-prompt-assist`,
`ts-web-extras`, `ts-extras-argon2`, and `samples/testbed` (the sample that broke on four consecutive
contract streams). All pass; testbed's only warnings are the unrelated `punycode` Node deprecation.

**This is a real gap in a gate that is one PR old**, filed in `TECH_DEBT.md`: the environmental
failure makes the repo-wide suite unrunnable to completion, so the checkbox silently degrades to
"tested nothing downstream". Whoever fixes the root/`chmod` test restores the gate.
