[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IEdgeTarget

# Interface: IEdgeTarget

The physical address of a linked-to record: the `(scope, id)` pair that
uniquely identifies it. Both components are required because a bare
[MemoryId](../type-aliases/MemoryId.md) is NOT unique across scopes — per-scope codecs (e.g. the
medium-term codec's `turn-<n>` stems) legally mint the same stem under
different scopes, so an edge that carried only the id would be ambiguous.
`(scope, id)` matches the store's `getById(scope, id)` addressing and the
index's composite primary key.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | [`MemoryId`](../type-aliases/MemoryId.md) | The target record's stable file-stem id (unique WITHIN [IEdgeTarget.scope](#property-scope)). |
| <a id="property-scope"></a> `scope` | `readonly` | [`MemoryScopeKey`](../type-aliases/MemoryScopeKey.md) | The scope the target record lives under. |
