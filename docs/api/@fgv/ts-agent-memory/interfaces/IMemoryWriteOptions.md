[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryWriteOptions

# Interface: IMemoryWriteOptions

Options for [IMemoryStore.put](IMemoryStore.md#put).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-expected"></a> `expected?` | `readonly` | [`MemoryWriteExpectation`](../type-aliases/MemoryWriteExpectation.md) | Write only if the address still holds what the caller read: the `envelope.seq` of the record (for a versioned kind, of the entity's current version), or `'absent'` for "nothing there". **Remarks** Checked under the store's write lock, after the address is resolved and before any dedup, so a same-entity write that landed since the caller's read is a `conflict` and writes nothing. Absent, the write is unconditional, as before. **The guarantee is in-process.** It covers writers that share one store instance per root — which the store's own single-writer guard enforces within a process. It is not fencing: a second process writing the same storage is outside it. |
