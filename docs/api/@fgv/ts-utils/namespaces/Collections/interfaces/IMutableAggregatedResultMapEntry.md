[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Collections](../README.md) / IMutableAggregatedResultMapEntry

# Interface: IMutableAggregatedResultMapEntry\<TCOLLECTIONID, TITEMID, TITEM, TMETADATA\>

A mutable collection entry in an [aggregated result map](../../../classes/AggregatedResultMap.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tcollectionid"></a> `TCOLLECTIONID` *extends* `string` | `string` |
| <a id="type-parameter-titemid"></a> `TITEMID` *extends* `string` | `string` |
| <a id="type-parameter-titem"></a> `TITEM` | `unknown` |
| <a id="type-parameter-tmetadata"></a> `TMETADATA` | `unknown` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `TCOLLECTIONID` |
| <a id="property-ismutable"></a> `isMutable` | `readonly` | `true` |
| <a id="property-items"></a> `items` | `readonly` | [`ValidatingResultMap`](../classes/ValidatingResultMap.md)\<`TITEMID`, `TITEM`\> |
| <a id="property-metadata"></a> `metadata?` | `public` | `TMETADATA` |
