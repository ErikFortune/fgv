[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / OptionalPropertyStatic

# Type Alias: OptionalPropertyStatic\<V\>

> **OptionalPropertyStatic**\<`V`\> = `V` *extends* [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<infer U\> ? `Exclude`\<[`U`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), `undefined`\> : `never`

The static value type carried by an optional property (the inner schema's static type,
without the `| undefined` that optionality adds — the `?` modifier conveys that separately).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-v"></a> `V` |
