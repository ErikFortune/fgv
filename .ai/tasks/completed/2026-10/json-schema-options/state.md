# State: `json-schema-options`

Worker-owned. Base `integration/asks` at `b90de8b2b`; branch `json-schema-options` from `620f4b850`.

## Status

Implementation, consumer sweep, docs and gates complete. Not merged; no PR opened (orchestrator's).

## Design decisions (and why)

### Branded, frozen validated options; plain options for what cannot be wrong

- `numberOptions` / `integerOptions` / `stringOptions` / `schemaOptions` each return
  `Result<Validated…Options<T>>`. The brand is `Brand<T, …>` from `@fgv/ts-utils` (type only); the
  value is the check's copy, `Object.freeze`d, so neither the caller nor the holder can mutate it
  out of coherence after the check.
- Each is **generic in `T`** with `opts: T & Record<Exclude<keyof T, keyof I…Options>, never>`. The
  generic keeps literal types (`nullable: true`, `additionalProperties: true`) so the factories'
  overloads still resolve exactly; the `Record<…, never>` restores the excess-property check a
  generic parameter otherwise loses (`numberOptions({ minimun: 0, description })` is a compile
  error — pinned).
- **`nullable` stays on the options**, not a separate argument. With the generic, a validated
  `{ minimum: 0, nullable: true }` carries `nullable: true` in its type and matches the existing
  `(… ) & { nullable: true }` overload, so `Static` is `number | null` with no new argument shape.
  A separate argument would have doubled every overload set. A widened `nullable: boolean` falls to
  the non-null overload, exactly as a raw `{ nullable: flag }` always did.
- **Plain options** (`PlainSchemaOptions`, `PlainNumberSchemaOptions`, `PlainStringSchemaOptions`,
  `PlainObjectSchemaOptions`, `PlainAnySchemaOptions`) hold only keys that cannot be incoherent —
  `description`, `title`, `nullable`, plus `strict` / `format` / `additionalProperties` on their
  node kinds. Every constraint key **and `default` / `examples`** is declared `?: never`. The
  `never` keys are load-bearing: a union `Plain | Validated` would otherwise let
  `{ minimum: 0, description: 'x' }` through (TypeScript's excess-property check on a union accepts a
  key any member declares).
- **Integer vs number.** `integerOptions` exists because "the range holds an integer" is stricter
  than "holds a number" (`exclusiveMinimum: 0, exclusiveMaximum: 1`). `ValidatedNumberOptions` is
  branded with the union `'ValidatedNumberOptions' | 'ValidatedIntegerOptions'`, so integer-validated
  options are accepted by `number` (sound), and `numberOptions` output is refused by `integer` at
  compile time (pinned).
- The options factories' failure messages carry **no `JsonSchema.x:` prefix**, so `fromJson` can call
  them and keep its `#/path: <message>` errors byte-identical; a declaration's `.shouldNotFail(label)`
  supplies the context.

### `default` / `examples` are fallible, so they moved behind validation

The brief says plain `ISchemaOptions` "(annotations and `nullable`)" stays accepted directly. But
`default` and `examples` are checked at run time (each must be JSON; `NaN` type-checks as `number`
and is not JSON), and the old factories threw on them — `boolean`, `enumOf`, `array`, `object`,
`record`, `anyValue` included. "Factories must contain no `throw`" cannot hold if those stay raw, so
they are `never` on the plain types and arrive through `schemaOptions` (or the node's own options
factory). `description` / `title` / `nullable` stay raw, as the brief intends. Only test files in the
repo used `default` / `examples` on a factory.

### Non-string enum factories return `Result`

`numberEnumOf` / `integerEnumOf` / `booleanEnumOf` validate a **value list** (empty, NaN, non-integer)
that has no option object to validate first, so per the brief's second branch they return
`Result<ISchemaValidator<T>>` and accept the full `ISchemaOptions` (they check annotations
themselves, since they can report). `enumOf` (strings) never threw on its values and still returns
the node.

### Removed

`validateNumberOptions` / `validateStringOptions` — redundant with `numberOptions` /
`integerOptions` / `stringOptions`. No consumer outside `ts-json-base`'s own tests.

## Former `throw`s

`factories.ts` had exactly one `throw` site, `_coherent(...).orThrow()`, reached from every
factory except `optional`:

| factory | thrown for | now |
|---|---|---|
| `number` / `integer` | incoherent range, non-JSON annotation | fails at `numberOptions` / `integerOptions` |
| `string` | bad length, non-JSON annotation | fails at `stringOptions` |
| `boolean`, `enumOf`, `array`, `object`, `record`, `anyValue` | non-JSON `default` / `examples` | fails at `schemaOptions` |
| `numberEnumOf` / `integerEnumOf` / `booleanEnumOf` | bad member list, non-JSON annotation | the factory returns a `Failure` |

## Open questions

None blocking. For the orchestrator: the brief's example
`JsonSchema.integer(JsonSchema.numberOptions({ minimum: 0 }).shouldNotFail('age bounds'))` does not
compile under this design — it is `integerOptions` for an integer. That is deliberate (see above).
