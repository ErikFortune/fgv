[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IIndexedMemoryRecord

# Interface: IIndexedMemoryRecord

A memory record paired with the [scope](../type-aliases/MemoryScopeKey.md) it lives
under. The scope is not carried on the [IMemoryEnvelope](IMemoryEnvelope.md) (it is derived
from the entity id by the codec), so the store threads it alongside the
record when patching or rebuilding the index. The `(scope, id)` pair is the
index's primary key, keeping records distinct across scopes that reuse a
filename stem (e.g. `turn-0` under different conversations in Phase C).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-record"></a> `record` | `readonly` | [`IMemoryRecord`](IMemoryRecord.md)\<`unknown`\> | The memory record itself. |
| <a id="property-scope"></a> `scope` | `readonly` | [`MemoryScopeKey`](../type-aliases/MemoryScopeKey.md) | The scope the record is stored under. |
