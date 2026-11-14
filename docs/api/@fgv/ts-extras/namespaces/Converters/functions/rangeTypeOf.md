[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [Converters](../README.md) / rangeTypeOf

# Function: rangeTypeOf()

> **rangeTypeOf**\<`T`, `RT`, `TC`\>(`converter`, `constructor`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`RT`, `TC`\>

A helper wrapper to construct a `Converter` which converts to an arbitrary strongly-typed
range of some comparable type.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` | - |
| <a id="type-parameter-rt"></a> `RT` *extends* [`RangeOf`](../../Experimental/classes/RangeOf.md)\<`T`\> | - |
| <a id="type-parameter-tc"></a> `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `converter` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> | `Converter` used to convert `min` and `max` extent of the range. |
| `constructor` | (`init`) => [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`RT`\> | Static constructor to instantiate the object. |

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`RT`, `TC`\>
