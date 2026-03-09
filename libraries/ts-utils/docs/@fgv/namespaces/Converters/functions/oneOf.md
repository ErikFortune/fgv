[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / oneOf

# Function: oneOf()

> **oneOf**\<`T`, `TC`\>(`converters`, `onError`): [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\>

A helper function to create a [Converter](../../Conversion/interfaces/Converter.md) for polymorphic values.
Returns a converter which invokes the wrapped converters in sequence, returning the
first successful result.  Returns an error if none of the supplied converters can
convert the value.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `converters` | ([`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\> \| [`Validator`](../../Validation/interfaces/Validator.md)\<`T`, `TC`\>)[] | `undefined` | An ordered list of [converters](../../Conversion/interfaces/Converter.md) or [validators](../../Validation/interfaces/Validator.md) to be considered. |
| `onError` | [`OnError`](../../Conversion/type-aliases/OnError.md) | `'ignoreErrors'` | Specifies treatment of unconvertible elements. |

## Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\>

A new [Converter](../../Conversion/interfaces/Converter.md) which yields a value from the union of the types returned
by the wrapped converters.

## Remarks

If `onError` is `ignoreErrors` (default), then errors from any of the
converters are ignored provided that some converter succeeds.  If
onError is `failOnError`, then an error from any converter fails the entire
conversion.
