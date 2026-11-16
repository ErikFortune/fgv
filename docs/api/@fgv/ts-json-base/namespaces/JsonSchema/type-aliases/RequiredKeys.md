[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / RequiredKeys

# Type Alias: RequiredKeys\<P\>

> **RequiredKeys**\<`P`\> = `Exclude`\<keyof `P`, [`OptionalKeys`](OptionalKeys.md)\<`P`\>\>

The keys of `P` whose schemas are required (i.e. not optional).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-p"></a> `P` *extends* [`ILlmProperties`](ILlmProperties.md) |
