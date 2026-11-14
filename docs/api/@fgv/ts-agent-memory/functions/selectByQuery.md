[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / selectByQuery

# Function: selectByQuery()

> **selectByQuery**(`entries`, `query`): [`IIndexedMemoryEntry`](../interfaces/IIndexedMemoryEntry.md)[]

Apply the shared scope / kind / tag / provenance-source / predicate pre-filter
to a set of indexed entries, returning the surviving records (unordered,
unlimited).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `entries` | readonly [`IIndexedMemoryEntry`](../interfaces/IIndexedMemoryEntry.md)[] |
| `query` | [`IMemoryQuery`](../interfaces/IMemoryQuery.md) |

## Returns

[`IIndexedMemoryEntry`](../interfaces/IIndexedMemoryEntry.md)[]
