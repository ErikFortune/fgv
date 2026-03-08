[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / arrayOf

# Function: arrayOf()

> **arrayOf**\<`T`, `TC`\>(`converter`, `onError`): [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`[], `TC`\>

A helper function to create a [Converter](../../Conversion/interfaces/Converter.md) which converts `unknown` to an array of `<T>`.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `converter` | [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\> \| [`Validator`](../../Validation/interfaces/Validator.md)\<`T`, `TC`\> | `undefined` | [Converter](../../Conversion/interfaces/Converter.md) or [Validator](../../Validation/interfaces/Validator.md) used to convert each item in the array. |
| `onError` | [`OnError`](../../Conversion/type-aliases/OnError.md) | `'failOnError'` | Specifies treatment of unconvertible elements. |

## Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<`T`[], `TC`\>

A [Converter](../../Conversion/interfaces/Converter.md) which returns an array of `<T>`.

## Remarks

If `onError` is `'failOnError'` (default), then the entire conversion fails if any element cannot
be converted.  If `onError` is `'ignoreErrors'`, then failing elements are silently ignored.
