[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Converters](../README.md) / recordOf

# Function: recordOf()

**`Internal`**

Concrete implementation of Converters.(recordOf:1) \| Converters.recordOf(Converter\<T, TC\>),
Converters.(recordOf:2) \| Converters.recordOf(Converter\<T, TC\>, 'fail' or 'ignore'), and
Converters.recordOf(Converter\<T, TC\>, KeyedConverterOptions).

## Call Signature

> **recordOf**\<`T`, `TC`, `TK`\>(`converter`): [`Converter`](../../Conversion/interfaces/Converter.md)\<`Record`\<`TK`, `T`\>, `TC`\>

A helper function to create a [Converter](../../Conversion/interfaces/Converter.md) which converts the `string`-keyed
properties using a supplied [Converter\<T, TC\>](../../Conversion/interfaces/Converter.md) or [Validator\<T\>](../../Validation/interfaces/Validator.md) to
produce a `Record<string, T>`.

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |
| `TK` *extends* `string` | `string` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `converter` | [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\> \| [`Validator`](../../Validation/interfaces/Validator.md)\<`T`, `TC`\> | [Converter](../../Conversion/interfaces/Converter.md) or [Validator](../../Validation/interfaces/Validator.md) used for each item in the source object. |

### Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<`Record`\<`TK`, `T`\>, `TC`\>

A [Converter](../../Conversion/interfaces/Converter.md) which returns `Record<string, T>`.

### Remarks

The resulting converter fails conversion if any element cannot be converted.

## Call Signature

> **recordOf**\<`T`, `TC`, `TK`\>(`converter`, `onError`): [`Converter`](../../Conversion/interfaces/Converter.md)\<`Record`\<`TK`, `T`\>, `TC`\>

A helper function to create a [Converter](../../Conversion/interfaces/Converter.md) which converts the `string`-keyed properties
using a supplied [Converter\<T, TC\>](../../Conversion/interfaces/Converter.md) or [Validator\<T\>](../../Validation/interfaces/Validator.md) to produce a
`Record<string, T>` and optionally specified handling of elements that cannot be converted.

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |
| `TK` *extends* `string` | `string` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `converter` | [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\> \| [`Validator`](../../Validation/interfaces/Validator.md)\<`T`, `TC`\> | [Converter](../../Conversion/interfaces/Converter.md) or [Validator](../../Validation/interfaces/Validator.md) for each item in the source object. |
| `onError` | `"fail"` \| `"ignore"` | - |

### Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<`Record`\<`TK`, `T`\>, `TC`\>

A [Converter](../../Conversion/interfaces/Converter.md) which returns `Record<string, T>`.

### Remarks

if `onError` is `'fail'` (default), then the entire conversion fails if any key or element
cannot be converted.  If `onError` is `'ignore'`, failing elements are silently ignored.

## Call Signature

> **recordOf**\<`T`, `TC`, `TK`\>(`converter`, `options`): [`Converter`](../../Conversion/interfaces/Converter.md)\<`Record`\<`TK`, `T`\>, `TC`\>

A helper function to create a [Converter](../../Conversion/interfaces/Converter.md) or which converts the `string`-keyed properties
using a supplied [Converter\<T, TC\>](../../Conversion/interfaces/Converter.md) or [Validator\<T\>](../../Validation/interfaces/Validator.md) to produce a
`Record<TK, T>`.

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |
| `TK` *extends* `string` | `string` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `converter` | [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\> \| [`Validator`](../../Validation/interfaces/Validator.md)\<`T`, `TC`\> | [Converter](../../Conversion/interfaces/Converter.md) or [Validator](../../Validation/interfaces/Validator.md) used for each item in the source object. |
| `options` | [`KeyedConverterOptions`](../interfaces/KeyedConverterOptions.md)\<`TK`, `TC`\> | Optional [KeyedConverterOptions\<TK, TC\>](../interfaces/KeyedConverterOptions.md) which supplies a key converter and/or error-handling options. |

### Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<`Record`\<`TK`, `T`\>, `TC`\>

A [Converter](../../Conversion/interfaces/Converter.md) which returns `Record<TK, T>`.

### Remarks

If present, the supplied [options](../interfaces/KeyedConverterOptions.md) can provide a strongly-typed
converter for keys and/or control the handling of elements that fail conversion.
