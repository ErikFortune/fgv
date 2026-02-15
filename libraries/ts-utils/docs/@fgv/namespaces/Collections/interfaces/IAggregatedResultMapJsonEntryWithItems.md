[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / IAggregatedResultMapJsonEntryWithItems

# Interface: IAggregatedResultMapJsonEntryWithItems\<TCOLLECTIONID\>

JSON format for an [aggregated result map](../../../../classes/AggregatedResultMap.md) collection entry using a string-keyed items object.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCOLLECTIONID` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="id"></a> `id` | `readonly` | `TCOLLECTIONID` |
| <a id="ismutable"></a> `isMutable` | `readonly` | `boolean` |
| <a id="items"></a> `items` | `readonly` | `Record`\<`string`, `unknown`\> |
| <a id="metadata"></a> `metadata?` | `readonly` | `unknown` |
