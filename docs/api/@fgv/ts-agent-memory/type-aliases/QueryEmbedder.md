[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / QueryEmbedder

# Type Alias: QueryEmbedder

> **QueryEmbedder** = (`text`) => `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Float32Array`\>\>

Embeds a query string into a vector for [IVectorIndex.query](../interfaces/IVectorIndex.md#query). Async and
`Result`-returning, since a real embedder does a network call.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Float32Array`\>\>
