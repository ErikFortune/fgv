[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Collections](../README.md) / IResultMapValidatorCreateParams

# Interface: IResultMapValidatorCreateParams\<TK, TV\>

Parameters for constructing a [ResultMapValidator](../classes/ResultMapValidator.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tk"></a> `TK` *extends* `string` | `string` |
| <a id="type-parameter-tv"></a> `TV` | `unknown` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-converters"></a> `converters` | [`KeyValueConverters`](../classes/KeyValueConverters.md)\<`TK`, `TV`\> |
| <a id="property-map"></a> `map` | [`ResultMap`](../classes/ResultMap.md)\<`TK`, `TV`\> |
