[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [Converters](../README.md) / extendedArrayOf

# Function: extendedArrayOf()

> **extendedArrayOf**\<`T`, `TC`\>(`label`, `converter`, `onError`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ExtendedArray`](../../Experimental/classes/ExtendedArray.md)\<`T`\>, `TC`\>

**`Beta`**

A helper function to create a `Converter` which converts `unknown` to [ExtendedArray\<T\>](../../Experimental/classes/ExtendedArray.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `undefined` |

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `label` | `string` | `undefined` | - |
| `converter` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> | `undefined` | `Converter` used to convert each item in the array |
| `onError` | [`OnError`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | `'failOnError'` | - |

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ExtendedArray`](../../Experimental/classes/ExtendedArray.md)\<`T`\>, `TC`\>

## Remarks

If `onError` is `'failOnError'` (default), then the entire conversion fails if any element cannot
be converted.  If `onError` is `'ignoreErrors'`, then failing elements are silently ignored.
