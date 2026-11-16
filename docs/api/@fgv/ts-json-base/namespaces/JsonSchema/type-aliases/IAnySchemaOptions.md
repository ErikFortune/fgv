[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / IAnySchemaOptions

# Type Alias: IAnySchemaOptions

> **IAnySchemaOptions** = `Omit`\<[`ISchemaOptions`](../interfaces/ISchemaOptions.md), `"nullable"`\>

Options for the `anyValue` factory: the annotations only.

## Remarks

There is no `nullable`, because a node that accepts any JSON value already accepts `null`.
