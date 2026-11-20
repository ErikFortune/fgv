[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Collections](../README.md) / IKeyValueConverterConstructorParams

# Interface: IKeyValueConverterConstructorParams\<TK, TV\>

Parameters for constructing a [KeyValueConverters](../classes/KeyValueConverters.md) instance.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tk"></a> `TK` *extends* `string` | `string` |
| <a id="type-parameter-tv"></a> `TV` | `unknown` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-key"></a> `key` | [`Validator`](../../Validation/interfaces/Validator.md)\<`TK`, `unknown`\> \| [`Converter`](../../Conversion/interfaces/Converter.md)\<`TK`, `unknown`\> \| [`ConverterFunc`](../../Conversion/type-aliases/ConverterFunc.md)\<`TK`, `unknown`\> | Required key [validator](../../Validation/interfaces/Validator.md), [converter](../../Conversion/interfaces/Converter.md), or [converter function](../../Conversion/type-aliases/ConverterFunc.md). |
| <a id="property-value"></a> `value` | [`Validator`](../../Validation/interfaces/Validator.md)\<`TV`, `unknown`\> \| [`Converter`](../../Conversion/interfaces/Converter.md)\<`TV`, `unknown`\> \| [`ConverterFunc`](../../Conversion/type-aliases/ConverterFunc.md)\<`TV`, `unknown`\> | Required value [validator](../../Validation/interfaces/Validator.md), [converter](../../Conversion/interfaces/Converter.md), or [converter function](../../Conversion/type-aliases/ConverterFunc.md). |
