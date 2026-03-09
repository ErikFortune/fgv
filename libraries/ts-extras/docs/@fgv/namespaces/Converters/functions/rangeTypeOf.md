[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [Converters](../README.md) / rangeTypeOf

# Function: rangeTypeOf()

> **rangeTypeOf**\<`T`, `RT`, `TC`\>(`converter`, `constructor`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`RT`, `TC`\>

A helper wrapper to construct a `Converter` which converts to an arbitrary strongly-typed
range of some comparable type.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `RT` *extends* [`RangeOf`](../../Experimental/classes/RangeOf.md)\<`T`\> | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `converter` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> | `Converter` used to convert `min` and `max` extent of the range. |
| `constructor` | (`init`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`RT`\> | Static constructor to instantiate the object. |

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`RT`, `TC`\>
