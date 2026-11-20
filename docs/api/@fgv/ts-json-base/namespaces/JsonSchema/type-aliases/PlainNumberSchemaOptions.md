[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / PlainNumberSchemaOptions

# Type Alias: PlainNumberSchemaOptions

> **PlainNumberSchemaOptions** = [`PlainSchemaOptions`](PlainSchemaOptions.md) & `Pick`\<[`INumberSchemaOptions`](../interfaces/INumberSchemaOptions.md), `"strict"`\> & `{ readonly [K in StringOneOf<typeof schemaNumberConstraintKeywords>]?: never }`

The `number` / `integer` options accepted as a plain object literal: the
`plain annotations` and `strict`. Every range keyword is
declared `never`, so a raw `{ minimum: 0 }` is a compile error — range keywords arrive through
`numberOptions` or `integerOptions`.
