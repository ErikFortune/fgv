[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / numberArray

# Variable: numberArray

> `const` **numberArray**: [`Converter`](../../Conversion/interfaces/Converter.md)\<`number`[], `unknown`\>

[Converter](../../Conversion/interfaces/Converter.md) to convert an `unknown` to an array of `number`.

## Remarks

Returns [Success](../../../../classes/Success.md) with the the supplied value if it as an array
of numbers, returns [Failure](../../../../classes/Failure.md) with an error message otherwise.
