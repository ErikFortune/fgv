[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryToolResultItem

# Interface: IMemoryToolResultItem

A single agent-visible `memory_search` / `memory_context` / `memory_read`
result item. Its address is [id](#property-id) +
[scope](#property-scope); its display key is
[handle](IMemoryToolItemProjection.md#property-handle).

## Remarks

A bare id is unique only within a scope (the MTM codec mints `turn-<n>` under
every conversation), so every item carries the scope its record lives in as
well as its id. The tool descriptions tell the model to copy both into a
`memory_write` link target or a `memory_context` seed. The tool layer always
sets `id` and `scope`, after any host projection, so a
[projectItem](ICreateMemoryToolsParams.md#property-projectitem) hook cannot drop or
override them.

## Extends

- [`IMemoryToolItemProjection`](IMemoryToolItemProjection.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-body"></a> `body` | `readonly` | `unknown` | The record body (a markdown string in B1). |
| <a id="property-entityid"></a> `entityId` | `readonly` | [`EntityId`](../type-aliases/EntityId.md) | The record's domain [EntityId](../type-aliases/EntityId.md). |
| <a id="property-handle"></a> `handle` | `readonly` | `string` | The display key: the host mnemonic when a [handleFor](ICreateMemoryToolsParams.md#property-handlefor) hook is supplied, the raw [MemoryId](../type-aliases/MemoryId.md) otherwise. It is for display and for referring to the record in prose. It is NOT an address: links and context seeds use [id](#property-id) + [scope](#property-scope). |
| <a id="property-id"></a> `id` | `readonly` | [`MemoryId`](../type-aliases/MemoryId.md) | The record's [MemoryId](../type-aliases/MemoryId.md) (`envelope.id`), unique within [scope](#property-scope). |
| <a id="property-kind"></a> `kind` | `readonly` | [`Kind`](../type-aliases/Kind.md) | The record's [Kind](../type-aliases/Kind.md). |
| <a id="property-scope"></a> `scope` | `readonly` | [`MemoryScopeKey`](../type-aliases/MemoryScopeKey.md) | The scope the record lives in — the address the store read it from, derived from its `(kind, entityId)` by the store's codecs (see `scopedAddressOf`). |
| <a id="property-tags"></a> `tags` | `readonly` | readonly `string`[] | The record's tags. |
