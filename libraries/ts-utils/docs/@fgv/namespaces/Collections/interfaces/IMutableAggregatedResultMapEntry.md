[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / IMutableAggregatedResultMapEntry

# Interface: IMutableAggregatedResultMapEntry\<TCOLLECTIONID, TITEMID, TITEM, TMETADATA\>

A mutable collection entry in an [aggregated result map](../../../../classes/AggregatedResultMap.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCOLLECTIONID` *extends* `string` | `string` |
| `TITEMID` *extends* `string` | `string` |
| `TITEM` | `unknown` |
| `TMETADATA` | `unknown` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="id"></a> `id` | `readonly` | `TCOLLECTIONID` |
| <a id="ismutable"></a> `isMutable` | `readonly` | `true` |
| <a id="items"></a> `items` | `readonly` | [`ValidatingResultMap`](../classes/ValidatingResultMap.md)\<`TITEMID`, `TITEM`\> |
| <a id="metadata"></a> `metadata?` | `public` | `TMETADATA` |
