[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / IAggregatedResultMapJsonEntryWithEntries

# Interface: IAggregatedResultMapJsonEntryWithEntries\<TCOLLECTIONID\>

JSON format for an [aggregated result map](../../../../classes/AggregatedResultMap.md) collection entry using an entries array.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCOLLECTIONID` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="entries"></a> `entries` | `readonly` | readonly [`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`string`, `unknown`\>[] |
| <a id="id"></a> `id` | `readonly` | `TCOLLECTIONID` |
| <a id="ismutable"></a> `isMutable` | `readonly` | `boolean` |
| <a id="metadata"></a> `metadata?` | `readonly` | `unknown` |
