[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMergeStrategy

# Interface: IMergeStrategy

Strategy for combining the result sets of the retrievers a
[HybridRetriever](../classes/HybridRetriever.md) composes. Injectable so a consumer can weight,
re-rank, or intersect instead of the default union.

## Methods

### merge()

> **merge**(`resultSets`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IMemoryRecord`](IMemoryRecord.md)\<`unknown`\>[]\>

Merge the per-retriever result sets into a single ordered result.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resultSets` | readonly (readonly [`IMemoryRecord`](IMemoryRecord.md)\<`unknown`\>[])[] | One entry per composed retriever, in composition order. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IMemoryRecord`](IMemoryRecord.md)\<`unknown`\>[]\>
