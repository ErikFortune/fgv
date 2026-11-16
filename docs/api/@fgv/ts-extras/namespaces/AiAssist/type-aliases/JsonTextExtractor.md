[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / JsonTextExtractor

# Type Alias: JsonTextExtractor

> **JsonTextExtractor** = (`text`) => [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

A function that pulls a JSON-shaped substring out of arbitrary model text.
Implementations strip whatever wrappers the model added (fences, preamble,
trailing prose) and return the JSON-shaped substring ready for `JSON.parse`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>
