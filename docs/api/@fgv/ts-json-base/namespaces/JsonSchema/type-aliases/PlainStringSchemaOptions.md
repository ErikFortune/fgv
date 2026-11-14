[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / PlainStringSchemaOptions

# Type Alias: PlainStringSchemaOptions

> **PlainStringSchemaOptions** = [`PlainSchemaOptions`](PlainSchemaOptions.md) & `Pick`\<[`IStringSchemaOptions`](../interfaces/IStringSchemaOptions.md), `"format"`\> & \{ readonly \[K in StringOneOf\<typeof schemaLengthConstraintKeywords\> \| StringOneOf\<typeof schemaPatternConstraintKeywords\>\]?: never \}

The `string` options accepted as a plain object literal: the
`plain annotations` and `format`, which is an annotation
and cannot be incoherent. The length keywords and `pattern` are declared `never` and arrive
through `stringOptions`.
