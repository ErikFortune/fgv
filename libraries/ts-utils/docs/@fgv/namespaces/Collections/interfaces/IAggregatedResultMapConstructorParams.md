[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / IAggregatedResultMapConstructorParams

# Interface: IAggregatedResultMapConstructorParams\<TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM, TMETADATA\>

Parameters for constructing an [aggregated result map](../../../../classes/AggregatedResultMap.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCOMPOSITEID` *extends* `string` | - |
| `TCOLLECTIONID` *extends* `string` | - |
| `TITEMID` *extends* `string` | - |
| `TITEM` | - |
| `TMETADATA` | `unknown` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="collectionidconverter"></a> `collectionIdConverter` | `readonly` | [`Converter`](../../Conversion/interfaces/Converter.md)\<`TCOLLECTIONID`, `unknown`\> \| [`Validator`](../../Validation/interfaces/Validator.md)\<`TCOLLECTIONID`, `unknown`\> | Converter or validator for collection IDs. |
| <a id="collections"></a> `collections?` | `readonly` | readonly [`AggregatedResultMapEntryInit`](../type-aliases/AggregatedResultMapEntryInit.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>[] | Initial collections to populate the map. **Remarks** Each entry may be mutable or read-only. |
| <a id="compositeidvalidator"></a> `compositeIdValidator?` | `readonly` | [`Validator`](../../Validation/interfaces/Validator.md)\<`TCOMPOSITEID`, `unknown`\> | Validator for composite IDs. |
| <a id="itemconverter"></a> `itemConverter` | `readonly` | [`Converter`](../../Conversion/interfaces/Converter.md)\<`TITEM`, `unknown`\> \| [`Validator`](../../Validation/interfaces/Validator.md)\<`TITEM`, `unknown`\> | Converter or validator for individual items in each collection. |
| <a id="itemidconverter"></a> `itemIdConverter` | `readonly` | [`Converter`](../../Conversion/interfaces/Converter.md)\<`TITEMID`, `unknown`\> \| [`Validator`](../../Validation/interfaces/Validator.md)\<`TITEMID`, `unknown`\> | Converter or validator for item IDs. |
| <a id="metadataconverter"></a> `metadataConverter?` | `readonly` | [`Converter`](../../Conversion/interfaces/Converter.md)\<`TMETADATA`, `unknown`\> \| [`Validator`](../../Validation/interfaces/Validator.md)\<`TMETADATA`, `unknown`\> | Optional converter or validator for collection metadata. If not provided, a metadata field in the input will cause a validation failure. |
| <a id="separator"></a> `separator?` | `readonly` | `string` | Optional separator string for composite IDs. Defaults to `.`. |
