[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / FragmentEmbedder

# Type Alias: FragmentEmbedder

> **FragmentEmbedder** = (`record`) => `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ReadonlyArray`\<[`IEmbeddedFragment`](../interfaces/IEmbeddedFragment.md)\>\>\>

The fragment-granular sibling of [MemoryEmbedder](MemoryEmbedder.md): chunks a record's body
and embeds each chunk, returning one [IEmbeddedFragment](../interfaces/IEmbeddedFragment.md) per chunk. The
chunking policy (window size, overlap) lives entirely in the consumer's embedder
— the core stays chunking-agnostic, exactly as it stays embedder-agnostic for
the record-granular path. Used by the store's fragment-embed-on-write hook.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\> |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ReadonlyArray`\<[`IEmbeddedFragment`](../interfaces/IEmbeddedFragment.md)\>\>\>
