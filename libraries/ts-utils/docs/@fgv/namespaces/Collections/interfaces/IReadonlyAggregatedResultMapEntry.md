[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / IReadonlyAggregatedResultMapEntry

# Interface: IReadonlyAggregatedResultMapEntry\<TCOLLECTIONID, TITEMID, TITEM, TMETADATA\>

A read-only collection entry in an [aggregated result map](../../../../classes/AggregatedResultMap.md).

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
| <a id="ismutable"></a> `isMutable` | `readonly` | `false` |
| <a id="items"></a> `items` | `readonly` | [`IReadOnlyValidatingResultMap`](IReadOnlyValidatingResultMap.md)\<`TITEMID`, `TITEM`\> |
| <a id="metadata"></a> `metadata?` | `readonly` | `TMETADATA` |
