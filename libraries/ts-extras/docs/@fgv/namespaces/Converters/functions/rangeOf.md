[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [Converters](../README.md) / rangeOf

# Function: rangeOf()

> **rangeOf**\<`T`, `TC`\>(`converter`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`RangeOf`](../../Experimental/classes/RangeOf.md)\<`T`\>, `TC`\>

A helper wrapper to construct a `Converter` which converts to [RangeOf\<T\>](../../Experimental/classes/RangeOf.md)
where `<T>` is some comparable type.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `converter` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> | `Converter` used to convert `min` and `max` extent of the range. |

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`RangeOf`](../../Experimental/classes/RangeOf.md)\<`T`\>, `TC`\>
