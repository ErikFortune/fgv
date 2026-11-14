[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / ICascadeConflict

# Interface: ICascadeConflict\<TEntry\>

Describes editors that would be affected by a cascade operation.
Returned by [ICascadeOps.openEditor](ICascadeOps.md#property-openeditor) when the operation is blocked.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tentry"></a> `TEntry` *extends* [`ICascadeEntryBase`](ICascadeEntryBase.md) | [`ICascadeEntryBase`](ICascadeEntryBase.md) |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-conflictingeditors"></a> `conflictingEditors` | `readonly` | readonly [`ICascadeFind`](ICascadeFind.md)\<`TEntry`\>[] |
