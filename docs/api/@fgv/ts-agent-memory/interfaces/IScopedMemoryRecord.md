[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IScopedMemoryRecord

# Interface: IScopedMemoryRecord

A record paired with its scope-qualified [address](IEdgeTarget.md), as
yielded by [IMemoryRecordSource.list](IMemoryRecordSource.md#list). The address is required because
[InMemoryCosineIndex.rebuild](../classes/InMemoryCosineIndex.md#rebuild) keys each re-embedded entry on the
scope-qualified target, not a bare [MemoryId](../type-aliases/MemoryId.md) — two records that share a
filename stem across scopes must not collide when the whole vault is re-indexed.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-record"></a> `record` | `readonly` | [`IMemoryRecord`](IMemoryRecord.md)\<`unknown`\> | The record itself, passed to the embedder. |
| <a id="property-target"></a> `target` | `readonly` | [`IEdgeTarget`](IEdgeTarget.md) | The record's scope-qualified `(scope, id)` address. |
