[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / PlainSchemaOptions

# Type Alias: PlainSchemaOptions

> **PlainSchemaOptions** = `Pick`\<[`ISchemaOptions`](../interfaces/ISchemaOptions.md), `"description"` \| `"title"` \| `"nullable"`\> & `object`

The options a factory accepts as a plain object literal: the ones that cannot be wrong —
`description`, `title` and `nullable`.

## Type Declaration

| Name | Type |
| ------ | ------ |
| `default?` | `never` |
| `examples?` | `never` |
| `kind?` | `never` |

## Remarks

A factory never fails, so it accepts unchecked only what needs no check. `default` and
`examples` must be JSON values, which the type cannot fully guarantee (`NaN` is a `number`), so
they are declared `never` here and arrive through `schemaOptions`
instead, as validated options. `kind` is declared `never` so that a spread of a validated-options
instance, which copies its `kind` discriminant and nothing else, is not mistaken for plain options.

**What a factory reads from plain options:** only the plain keys — `description`, `title`,
`nullable`, `strict`, `format`, `additionalProperties` — each of its declared type. Every other
key, and a plain key of the wrong type, is ignored, so the validator and `toJson()` always agree.
That matters for one case the types do not catch: a value whose type has an index signature
(`Record<string, unknown>`, or an interface declaring `[key: string]: unknown`) is assignable to
every plain-options type, because TypeScript does not check an index signature against the
`never` keys. Such a value compiles, and its constraint keys are ignored rather than applied. An
object literal, a declared options interface, `Partial<…>` and `as const` are all refused at
compile time.
