[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / OptionalKeys

# Type Alias: OptionalKeys\<P\>

> **OptionalKeys**\<`P`\> = `{ [K in keyof P]: P[K] extends ISchemaValidator<infer U> ? undefined extends U ? K : never : never }`\[keyof `P`\]

The keys of `P` whose schemas are optional (wrapped with the `optional` modifier).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-p"></a> `P` *extends* [`ILlmProperties`](ILlmProperties.md) |
