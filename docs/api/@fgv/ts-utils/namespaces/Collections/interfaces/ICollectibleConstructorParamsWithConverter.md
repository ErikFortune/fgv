[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Collections](../README.md) / ICollectibleConstructorParamsWithConverter

# Interface: ICollectibleConstructorParamsWithConverter\<TKEY, TINDEX\>

Parameters for constructing a new [ICollectible](ICollectible.md) instance with an
index converter.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tkey"></a> `TKEY` *extends* `string` | `string` |
| <a id="type-parameter-tindex"></a> `TINDEX` *extends* `number` | `number` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-index"></a> `index?` | `number` |
| <a id="property-indexconverter"></a> `indexConverter` | [`Validator`](../../Validation/interfaces/Validator.md)\<`TINDEX`, `unknown`\> \| [`Converter`](../../Conversion/interfaces/Converter.md)\<`TINDEX`, `unknown`\> \| [`ConverterFunc`](../../Conversion/type-aliases/ConverterFunc.md)\<`TINDEX`, `undefined`\> |
| <a id="property-key"></a> `key` | `TKEY` |
