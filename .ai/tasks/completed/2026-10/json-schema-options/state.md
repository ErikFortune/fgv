# State: `json-schema-options`

Worker-owned. Base `integration/asks` at `b90de8b2b`; branch `json-schema-options` from `620f4b850`.

## Status

Implementation, consumer sweep, docs and gates complete. Not merged; no PR opened (orchestrator's).

## Design decisions (and why)

### Validated options; plain options for what cannot be wrong

*Superseded in part by "Review round 1" below: the brand is now a nominal class, not `Brand<T>`.*

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

## Review round 1 (deep review: P1 brand holes)

The type-only brand (`Brand<T, …>` intersected onto a frozen object) had two holes, both repro'd by
the reviewer: a spread kept the brand on an unfrozen, unchecked copy
(`number({ ...v, maximum: -1 })`), and a literal could carry `__brand` and forge it.

**Mechanism chosen: nominal classes with an ES `#private` field.** `ValidatedSchemaOptions`,
`ValidatedNumberOptions` (and its subclass `ValidatedIntegerOptions`) and `ValidatedStringOptions`
each hold the frozen options in `#options`, read through a public `options` getter. Why this
mechanism:

- **Type level.** A class with a `#private` member is compared nominally: no object literal,
  however shaped, is assignable to it. A spread of an instance has a type without the private member,
  so it is not assignable to the class either. To stop a spread passing as **plain** options, each
  class carries a public `kind` discriminant (spread copies it) and the plain types declare
  `kind?: never`. Both are pinned with `@ts-expect-error`.
- **Run time.** `#options` is not an own enumerable property, so a spread copies only `kind` (pinned
  by `toEqual({ kind: … })`). Factories read options through `instanceof`, so a cast-forged object is
  read as plain, not as validated, and nothing throws.
- **Why not a `unique symbol` brand or TypeScript `private`?** A symbol property is an ordinary
  own property, so spreading copies it and the hole reopens. TypeScript `private` is nominal at the
  type level but leaves the options as a spreadable own property at run time. `#private` is the only
  one of the three that closes both levels. It downlevels at the rig's `es2017` target; the build and
  the suite are green on that target.
- **Generics kept.** The classes are generic in `T` and covariant through `#options: Readonly<T>`,
  so the nullable overloads are written `ValidatedNumberOptions<{ nullable: true }>`, and inference
  stays exact. `ValidatedIntegerOptions extends ValidatedNumberOptions` and adds its own
  `#integer`, so integer options are accepted by `number`, and number options are refused by
  `integer` because they lack that member.
- **Construction.** Constructors are private/protected. The free functions call `@internal` static
  `_create` methods, which run the existing checks.

**P2, index signatures.** A `Record<string, unknown>` (or any index-signature type) is assignable
to the plain types: TypeScript does not check an index signature against optional `never` keys.
There is no cheap type-level close that keeps the overloads non-generic, so this is documented on
`PlainSchemaOptions` as a known limitation and pinned by a test. The pin shows the value's
constraints applied as given, with no throw.
