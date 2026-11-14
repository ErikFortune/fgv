[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryWriteResult

# Interface: IMemoryWriteResult

The success value returned by `memory_write.execute`.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-entityid"></a> `entityId` | `readonly` | [`EntityId`](../type-aliases/EntityId.md) | The domain [EntityId](../type-aliases/EntityId.md) the write targeted. |
| <a id="property-id"></a> `id` | `readonly` | [`MemoryId`](../type-aliases/MemoryId.md) | The stored record's [MemoryId](../type-aliases/MemoryId.md). |
| <a id="property-kind"></a> `kind` | `readonly` | [`Kind`](../type-aliases/Kind.md) | The record's [Kind](../type-aliases/Kind.md). |
| <a id="property-outcome"></a> `outcome` | `readonly` | [`MemoryWriteOutcome`](../type-aliases/MemoryWriteOutcome.md) | What the write did — see [MemoryWriteOutcome](../type-aliases/MemoryWriteOutcome.md). |
| <a id="property-scope"></a> `scope` | `readonly` | [`MemoryScopeKey`](../type-aliases/MemoryScopeKey.md) | The scope the stored record lives in. Together with [id](#property-id) it is the record's address — the `{ id, scope }` a later write links to it with. **Remarks** It is resolved through the store after the put commits. With `FileTreeMemoryStore` that cannot fail, because `put` encodes through the same codecs. A custom `IMemoryStore` whose `resolveIdentity` disagrees with its own `put` would see `memory_write` report a failure for a write that was in fact persisted. |
