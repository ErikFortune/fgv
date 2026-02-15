[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / ICompositeId

# Interface: ICompositeId\<TCOLLECTIONID, TITEMID\>

Represents a composite ID constructed of two strongly-typed string IDs
separated by a delimiter.

## Type Parameters

| Type Parameter |
| ------ |
| `TCOLLECTIONID` *extends* `string` |
| `TITEMID` *extends* `string` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="collectionid"></a> `collectionId` | `readonly` | `TCOLLECTIONID` |
| <a id="itemid"></a> `itemId` | `readonly` | `TITEMID` |
| <a id="separator"></a> `separator` | `readonly` | `string` |
