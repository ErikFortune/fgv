# `json-schema-options`: validate the options, never throw from a factory

**Shipped 2026-10-18** onto `integration/asks` (PR #740).
Origin: user decision 6c, 2026-10-18 (`personality-asks-2026-10/followups.md`). Builds on
`json-schema-constraints` (#734) and `json-schema-shapes` (#736).

---

## What it is

`JsonSchema` factories threw on incoherent options (`minimum > maximum`, a non-JSON `default`, a
non-integer member of an integer enum). The repo rule is that fallible operations return `Result`,
but schemas nest, so a `Result` from every factory would force an unwrap at every level.

## What shipped

- **Validated options.** `numberOptions`, `integerOptions`, `stringOptions` and `schemaOptions`
  each return a `Result` of a nominal instance holding a frozen copy.
- **Factories accept only validated or plain options.** Plain options hold only what cannot be
  wrong. A constraint key, `default` or `examples` on a raw literal is a compile error.
- **`nullable: true` survives validation**, so the nullable overloads are unchanged.
- **The non-string enum factories return `Result`**, because what can be wrong is the value list.
- **`fromJson`** builds through the same path, with unchanged messages.
- **Removed:** `validateNumberOptions` and `validateStringOptions`.

```ts
const age = JsonSchema.integer(JsonSchema.integerOptions({ minimum: 0 }).shouldNotFail('age bounds'));
```

## What changed shape

- **`default` and `examples` need validation too.** Both are checked at run time, and every factory
  threw on them.
- **Integers have their own `integerOptions`.** An integer range is stricter than a number range.
- **No source consumer changed.** Every non-test call site passed `{ description }` only.

See `result.md` for the consumer list and the gate counts, and `state.md` for the design reasoning.
