[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / optionalBoolean

# Variable: optionalBoolean

> `const` **optionalBoolean**: [`Converter`](../../Conversion/interfaces/Converter.md)\<`boolean` \| `undefined`, `unknown`\>

A [Converter](../../Conversion/interfaces/Converter.md) to convert an optional `boolean` value.

## Remarks

Values of type `boolean` or strings that match (case-insensitive) `'true'`
or `'false'` are converted and returned.  Anything else returns [Success](../../../../classes/Success.md)
with value `undefined`.
