[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / ICollectibleConstructorParamsWithConverter

# Interface: ICollectibleConstructorParamsWithConverter\<TKEY, TINDEX\>

Parameters for constructing a new [ICollectible](ICollectible.md) instance with an
index converter.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TKEY` *extends* `string` | `string` |
| `TINDEX` *extends* `number` | `number` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="index"></a> `index?` | `number` |
| <a id="indexconverter"></a> `indexConverter` | [`Validator`](../../Validation/interfaces/Validator.md)\<`TINDEX`, `unknown`\> \| [`Converter`](../../Conversion/interfaces/Converter.md)\<`TINDEX`, `unknown`\> \| [`ConverterFunc`](../../Conversion/type-aliases/ConverterFunc.md)\<`TINDEX`, `undefined`\> |
| <a id="key"></a> `key` | `TKEY` |
