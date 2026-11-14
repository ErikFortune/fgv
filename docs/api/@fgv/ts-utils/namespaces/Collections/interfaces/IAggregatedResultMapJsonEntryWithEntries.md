[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Collections](../README.md) / IAggregatedResultMapJsonEntryWithEntries

# Interface: IAggregatedResultMapJsonEntryWithEntries\<TCOLLECTIONID\>

JSON format for an [aggregated result map](../../../classes/AggregatedResultMap.md) collection entry using an entries array.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tcollectionid"></a> `TCOLLECTIONID` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-entries"></a> `entries` | `readonly` | readonly [`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`string`, `unknown`\>[] |
| <a id="property-id"></a> `id` | `readonly` | `TCOLLECTIONID` |
| <a id="property-ismutable"></a> `isMutable` | `readonly` | `boolean` |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `unknown` |
