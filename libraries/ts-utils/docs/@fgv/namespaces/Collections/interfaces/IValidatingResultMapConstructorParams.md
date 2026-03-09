[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / IValidatingResultMapConstructorParams

# Interface: IValidatingResultMapConstructorParams\<TK, TV\>

Parameters for constructing a [ResultMap](../classes/ResultMap.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TK` *extends* `string` | `string` |
| `TV` | `unknown` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="converters"></a> `converters` | [`KeyValueConverters`](../classes/KeyValueConverters.md)\<`TK`, `TV`\> |
| <a id="entries"></a> `entries?` | `Iterable`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`string`, `unknown`\>, `any`, `any`\> |
