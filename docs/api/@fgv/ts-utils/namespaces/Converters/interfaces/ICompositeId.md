[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Converters](../README.md) / ICompositeId

# Interface: ICompositeId\<TCOLLECTIONID, TITEMID\>

Represents a composite ID constructed of two strongly-typed string IDs
separated by a delimiter.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tcollectionid"></a> `TCOLLECTIONID` *extends* `string` |
| <a id="type-parameter-titemid"></a> `TITEMID` *extends* `string` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-collectionid"></a> `collectionId` | `readonly` | `TCOLLECTIONID` |
| <a id="property-itemid"></a> `itemId` | `readonly` | `TITEMID` |
| <a id="property-separator"></a> `separator` | `readonly` | `string` |
