[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Collections](../README.md) / IValidatingResultMapConstructorParams

# Interface: IValidatingResultMapConstructorParams\<TK, TV\>

Parameters for constructing a [ResultMap](../classes/ResultMap.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tk"></a> `TK` *extends* `string` | `string` |
| <a id="type-parameter-tv"></a> `TV` | `unknown` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-converters"></a> `converters` | [`KeyValueConverters`](../classes/KeyValueConverters.md)\<`TK`, `TV`\> |
| <a id="property-entries"></a> `entries?` | `Iterable`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`string`, `unknown`\>, `any`, `any`\> |
