[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryWriteConflict

# Interface: IMemoryWriteConflict

The detail of a failed conditional write: what the caller expected and what the store found.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-code"></a> `code` | `readonly` | `"conflict"` | Always `'conflict'`. |
| <a id="property-current"></a> `current` | `readonly` | [`MemoryWriteExpectation`](../type-aliases/MemoryWriteExpectation.md) | What the address held: the record's (or current version's) `seq`, or `'absent'`. |
| <a id="property-expected"></a> `expected` | `readonly` | [`MemoryWriteExpectation`](../type-aliases/MemoryWriteExpectation.md) | The `expected` the caller supplied. |
