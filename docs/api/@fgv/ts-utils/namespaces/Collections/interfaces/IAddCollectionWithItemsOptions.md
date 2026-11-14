[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Collections](../README.md) / IAddCollectionWithItemsOptions

# Interface: IAddCollectionWithItemsOptions\<TMETADATA\>

Options for [addCollectionWithItems](../classes/AggregatedResultMapBase.md#addcollectionwithitems).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tmetadata"></a> `TMETADATA` | `unknown` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-isimmutable"></a> `isImmutable?` | `readonly` | `boolean` | If true, the collection will be immutable (read-only). Defaults to false (mutable). |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `TMETADATA` | Optional metadata to attach to the collection. |
