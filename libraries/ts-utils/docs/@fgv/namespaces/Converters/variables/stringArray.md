[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / stringArray

# Variable: stringArray

> `const` **stringArray**: [`Converter`](../../Conversion/interfaces/Converter.md)\<`string`[], `unknown`\>

[Converter](../../Conversion/interfaces/Converter.md) to convert an `unknown` to an array of `string`.

## Remarks

Returns [Success](../../../../classes/Success.md) with the the supplied value if it as an array
of strings, returns [Failure](../../../../classes/Failure.md) with an error message otherwise.
