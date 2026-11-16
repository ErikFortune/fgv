[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryToolItemProjection

# Interface: IMemoryToolItemProjection

The part of an agent-visible result item that a host
[projectItem](ICreateMemoryToolsParams.md#property-projectitem) hook produces. The
tool layer adds [id](IMemoryToolResultItem.md#property-id) and
[scope](IMemoryToolResultItem.md#property-scope) on top, so a hook neither supplies
nor can remove them.

## Extended by

- [`IMemoryToolResultItem`](IMemoryToolResultItem.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-body"></a> `body` | `readonly` | `unknown` | The record body (a markdown string in B1). |
| <a id="property-entityid"></a> `entityId` | `readonly` | [`EntityId`](../type-aliases/EntityId.md) | The record's domain [EntityId](../type-aliases/EntityId.md). |
| <a id="property-handle"></a> `handle` | `readonly` | `string` | The display key: the host mnemonic when a [handleFor](ICreateMemoryToolsParams.md#property-handlefor) hook is supplied, the raw [MemoryId](../type-aliases/MemoryId.md) otherwise. It is for display and for referring to the record in prose. It is NOT an address: links and context seeds use [id](IMemoryToolResultItem.md#property-id) + [scope](IMemoryToolResultItem.md#property-scope). |
| <a id="property-kind"></a> `kind` | `readonly` | [`Kind`](../type-aliases/Kind.md) | The record's [Kind](../type-aliases/Kind.md). |
| <a id="property-tags"></a> `tags` | `readonly` | readonly `string`[] | The record's tags. |
