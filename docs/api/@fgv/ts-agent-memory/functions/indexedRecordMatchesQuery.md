[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / indexedRecordMatchesQuery

# Function: indexedRecordMatchesQuery()

> **indexedRecordMatchesQuery**(`entry`, `query`): `boolean`

Whether an indexed entry satisfies a query's scope / kind / tag /
provenance-source / predicate pre-filter (the axes shared by every v1
retriever). The `semantic` / `asOf` / link axes are NOT applied here — those
are each retriever's own concern.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `entry` | [`IIndexedMemoryEntry`](../interfaces/IIndexedMemoryEntry.md) |
| `query` | [`IMemoryQuery`](../interfaces/IMemoryQuery.md) |

## Returns

`boolean`
